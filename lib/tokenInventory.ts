import { Contract, Event as EtherEvent } from "ethers"
import { fetchWithTimeout } from "./utils"

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

export const contractName = (contractAddr: string): string => {
  switch (contractAddr.toLowerCase()) {
    case "0xbecced78b7a65a0b2464869553fc0a3c2d2db935":
      return "Smoke Bond"
    case "0x1ddd12d738acf870de92fd5387d90f3733d50d94":
      return "Support ticket"
    case "0x1a48b20bd0f0c89f823686c2270c5404887c287c":
      return "Garden ticket"
    default:
      return "Unknown contract"
  }
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
