import { Contract, ethers, Event as EtherEvent } from "ethers"
import { getNetwork } from "@wagmi/core"
import { fetchWithTimeout } from "./utils"
import jsonContracts from "./contracts.json"

export interface Collection {
  tokens: EtherEvent[]
  metadata: Metadata
}

export type Metadata = {
  tokenName: null | TokensName
  title: string
  description: string
  image: string
}

export type Contracts = {
  catBox: null | Contract
  supportTicket: null | Contract
  gardenTicket: null | Contract
}

export type ContractsName = "catBox" | "supportTicket" | "gardenTicket"
export type TokensName = "Cat Box" | "Garden Ticket" | "Support Ticket"
export type IpfsName =
  | "Can and the box"
  | "Garden ticket entrance"
  | "Support ticket"

export const tokenABI = (type: "simple" | "multi") => {
  switch (type) {
    case "simple":
      return jsonContracts.abis.simple
    case "multi":
      return jsonContracts.abis.multi
  }
}

export const getContractInstance = (
  contracts: Contracts,
  address: string
): Contract => {
  const { catBox, supportTicket, gardenTicket } = contracts
  if (catBox && supportTicket && gardenTicket) {
    switch (address.toLowerCase()) {
      case catBox.address.toLowerCase():
        return catBox
      case supportTicket.address.toLowerCase():
        return supportTicket
      case gardenTicket.address.toLowerCase():
        return gardenTicket
      default:
        throw Error("Unknown token address")
    }
  } else {
    throw Error("Instances not created")
  }
}

export const getContractAddress = (
  contractName: ContractsName | TokensName
): string => {
  const chain = getNetwork().chain
  switch (contractName) {
    case "Cat Box":
      contractName = "catBox"
      break
    case "Garden Ticket":
      contractName = "gardenTicket"
      break
    case "Support Ticket":
      contractName = "supportTicket"
      break
  }
  if (chain && (chain.id === 420 || chain.id === 31337)) {
    return jsonContracts[chain.id][contractName]
  } else {
    return ""
    throw Error(
      "Not connected or wrong network (available network: 420, 31337)"
    )
  }
}

export const getContractName = (contractAddr: string): TokensName | string => {
  const chain = getNetwork().chain
  if (chain && (chain.id === 420 || chain.id === 31337)) {
    switch (contractAddr.toLowerCase()) {
      case jsonContracts[chain.id].catBox.toLowerCase():
        return "Cat Box"
      case jsonContracts[chain.id].supportTicket.toLowerCase():
        return "Support Ticket"
      case jsonContracts[chain.id].gardenTicket.toLowerCase():
        return "Garden Ticket"
      default:
        return contractAddr
    }
  }
  return contractAddr
  // throw Error("Not connected or wrong network (available network: 420, 31337)")
}

export const fetchMetadata = async (contract: Contract): Promise<Metadata> => {
  const gateway = "https://ipfs.io/ipfs/"
  let ipfsHash = ""
  const [uri] = await contract.functions.tokenURI(0)
  ipfsHash = uri.slice(uri.indexOf("Qm"))

  let tokenName = null
  try {
    tokenName = await contract.name()
  } catch (e) {
    console.warn(e)
  }

  // fetch metadata
  let data
  try {
    data = await fetchWithTimeout(gateway + ipfsHash, { timeout: 3000 })
  } catch (e: any) {
    return {
      tokenName,
      title: "",
      description: "",
      image: `Failed to load metadata, IPFS hash: ${ipfsHash}`,
    }
  }

  // fetch image
  const json = await data.json() // metadata
  ipfsHash = json.image.slice(json.image.indexOf("Qm"))
  let imgData
  try {
    imgData = await fetchWithTimeout(gateway + ipfsHash, { timeout: 3000 })
  } catch (e: any) {
    return {
      tokenName,
      title: json.title,
      description: json.description,
      image: `Failed to load image, IPFS hash: ${ipfsHash}`,
    }
  }

  const blob = await imgData.blob()
  const src = URL.createObjectURL(blob)

  return {
    tokenName,
    title: json.name,
    description: json.description,
    image: src,
  }
}

export const fetchToken = async (
  contract: Contract,
  address: string | null
): Promise<Collection> => {
  const _address = address ? address : ethers.constants.AddressZero

  const _in = contract.filters.Transfer(
    null, // from
    _address // to
  )
  const _out = contract.filters.Transfer(
    _address, // from
    null // to
  )
  const tokensIn = await contract.queryFilter(_in)
  const tokensOut = await contract.queryFilter(_out)

  const owned: EtherEvent[] = address
    ? _filterOwnedToken(tokensIn, tokensOut)
    : _filterTotalSupply(tokensOut, tokensIn)

  const metadata = await fetchMetadata(contract)
  return { tokens: owned, metadata }
}

export const fetchAllTokens = async ({
  catBox,
  supportTicket,
  gardenTicket,
}: Contracts): Promise<EtherEvent[]> => {
  let collections: EtherEvent[] = []
  if (catBox && supportTicket && gardenTicket) {
    collections = collections.concat(
      await catBox?.queryFilter("Transfer"),
      await supportTicket?.queryFilter("Transfer"),
      await gardenTicket?.queryFilter("Transfer")
    )
  }
  return collections
}

export const fetchCollections = async ({
  catBox,
  supportTicket,
  gardenTicket,
}: Contracts): Promise<Collection[]> => {
  let collections: Collection[] = []
  if (catBox && supportTicket && gardenTicket) {
    collections.push(await fetchToken(catBox, null))
    collections.push(await fetchToken(supportTicket, null))
    collections.push(await fetchToken(gardenTicket, null))
  }
  return collections
}

const _filterOwnedToken = (
  tokenReceived: EtherEvent[],
  tokenTransfered: EtherEvent[]
): EtherEvent[] => {
  const owned = tokenReceived.filter((_in) => {
    const isOut: EtherEvent | undefined = tokenTransfered.find((_out) => {
      if (_in.args && _out.args) {
        return _in.args[2].toNumber() === _out.args[2].toNumber()
      }
    })

    return isOut && isOut.blockNumber > _in.blockNumber ? false : true
  })
  return owned
}

const _filterTotalSupply = (
  tokenMinted: EtherEvent[],
  tokenBurned: EtherEvent[]
): EtherEvent[] => {
  const totalSupply = tokenMinted.filter((_in) => {
    const isBurn: EtherEvent | undefined = tokenBurned.find((_out) => {
      if (_in.args && _out.args) {
        return _in.args[2].toNumber() === _out.args[2].toNumber()
      }
    })

    return isBurn && isBurn.blockNumber > _in.blockNumber ? false : true
  })
  return totalSupply
}
