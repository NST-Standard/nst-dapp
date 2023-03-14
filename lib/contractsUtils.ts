import { Contract, ethers, Event as EtherEvent } from "ethers"
import { getNetwork } from "@wagmi/core"
import { fetchWithTimeout } from "./utils"
import jsonContracts from "./contracts.json"

export interface Collection {
  tokens: EtherEvent[]
  metadata: Metadata
}

export type Metadata = {
  title: string
  description: string
  image: string
}

export type Contracts = {
  smokeBond: null | Contract
  supportTicket: null | Contract
  gardenTicket: null | Contract
}

export type ContractsName = "smokeBond" | "supportTicket" | "gardenTicket"
export type TokensName =
  | "Cigar credit note"
  | "Garden ticket entrance"
  | "Support ticket"

export const tokenABI = () => {
  return jsonContracts.abi
}

export const getContractInstance = (
  contracts: Contracts,
  address: string
): Contract => {
  const { smokeBond, supportTicket, gardenTicket } = contracts
  if (smokeBond && supportTicket && gardenTicket) {
    switch (address.toLowerCase()) {
      case smokeBond.address.toLowerCase():
        return smokeBond
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
    case "Cigar credit note":
      contractName = "smokeBond"
      break
    case "Garden ticket entrance":
      contractName = "gardenTicket"
      break
    case "Support ticket":
      contractName = "supportTicket"
      break
  }
  if (chain && (chain.id === 420 || chain.id === 31337)) {
    return jsonContracts[chain.id][contractName]
  } else {
    throw Error(
      "Not connected or wrong network (available network: 420, 31337)"
    )
  }
}

export const getContractName = (contractAddr: string): string => {
  const chain = getNetwork().chain
  if (chain && (chain.id === 420 || chain.id === 31337)) {
    switch (contractAddr.toLowerCase()) {
      case jsonContracts[chain.id].smokeBond.toLowerCase():
        return "Cigar credit note"
      case jsonContracts[chain.id].supportTicket.toLowerCase():
        return "Support ticket"
      case jsonContracts[chain.id].gardenTicket.toLowerCase():
        return "Garden ticket"
      default:
        return contractAddr
    }
  }
  throw Error("Not connected or wrong network (available network: 420, 31337)")
}

export const fetchMetadata = async (contract: Contract): Promise<Metadata> => {
  const gateway = "https://ipfs.io/ipfs/"
  let ipfsHash = ""
  const [uri] = await contract.functions.tokenURI(0)
  ipfsHash = uri.slice(uri.indexOf("Qm"))

  // fetch metadata
  let data
  try {
    data = await fetchWithTimeout(gateway + ipfsHash, { timeout: 3000 })
  } catch (e: any) {
    return {
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
      title: json.title,
      description: json.description,
      image: `Failed to load image, IPFS hash: ${ipfsHash}`,
    }
  }

  const blob = await imgData.blob()
  const src = URL.createObjectURL(blob)

  return {
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
  smokeBond,
  supportTicket,
  gardenTicket,
}: Contracts): Promise<EtherEvent[]> => {
  let collections: EtherEvent[] = []
  if (smokeBond && supportTicket && gardenTicket) {
    collections = collections.concat(
      await smokeBond?.queryFilter("Transfer"),
      await supportTicket?.queryFilter("Transfer"),
      await gardenTicket?.queryFilter("Transfer")
    )
  }
  return collections
}

export const fetchCollections = async ({
  smokeBond,
  supportTicket,
  gardenTicket,
}: Contracts): Promise<Collection[]> => {
  let collections: Collection[] = []
  if (smokeBond && supportTicket && gardenTicket) {
    collections.push(await fetchToken(smokeBond, null))
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
