import { Contract, Event as EtherEvent } from "ethers"
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

export const tokenABI = () => {
  return jsonContracts.abi
}

export const getContractAddress = (contractName: ContractsName): string => {
  const chain = getNetwork().chain
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
      case jsonContracts[chain.id].smokeBond:
        return "Smoke bond"
      case jsonContracts[chain.id].supportTicket:
        return "Support ticket"
      case jsonContracts[chain.id].gardenTicket:
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
  address: string
): Promise<Collection> => {
  const transferFilter = contract.filters.Transfer(
    null, // from
    address // to
  )
  const tokens = await contract.queryFilter(transferFilter)
  const metadata = await fetchMetadata(contract)

  return { tokens, metadata }
}

export const fetchCollections = async ({
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
