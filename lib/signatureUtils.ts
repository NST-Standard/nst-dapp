import { getNetwork, signTypedData } from "@wagmi/core"
import { Contract, ethers } from "ethers"

export type Message = {
  multiBarter: boolean
  encodedStruct: string
  signature: string
}

export type Componant = {
  tokenAddr: string
  tokenId: number
}

export type MultiComponant = {
  tokenAddr: string
  tokenIds: number[]
}

export type BarterTerms = {
  bid: Componant
  ask: Componant
  nonce: number
  owner: string
  deadline: number
}

export type MultiBarterTerms = {
  bid: MultiComponant
  ask: MultiComponant
  nonce: number
  owner: string
  deadline: number
}

export const defaultBarterTerms: BarterTerms = {
  bid: { tokenAddr: "", tokenId: 0 },
  ask: { tokenAddr: "", tokenId: 0 },
  nonce: 0,
  owner: "",
  deadline: 0,
}

export const defaultMultiBarterTerms: MultiBarterTerms = {
  bid: { tokenAddr: "", tokenIds: [] },
  ask: { tokenAddr: "", tokenIds: [] },
  nonce: 0,
  owner: "",
  deadline: 0,
}

export type SignatureOutput = {
  signature: string
  encodedStruct: string
}

export const signBarterTerms = async (
  contract: Contract,
  exchangeData: BarterTerms,
  toast: Function
): Promise<SignatureOutput> => {
  const chain = getNetwork().chain
  if (!chain || (chain.id !== 420 && chain.id !== 31337)) {
    throw Error("Network not supported")
  }

  const nonce = await contract.nonce(exchangeData.owner)

  // get the domain on the proper contract
  const domain = {
    name: await contract.name(),
    version: "1",
    chainId: chain.id,
    verifyingContract: contract.address as `0x${string}`,
  } as const

  const types = {
    BarterTerms: [
      { name: "bid", type: "Componant" },
      { name: "ask", type: "Componant" },
      { name: "nonce", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "deadline", type: "uint48" },
    ],
    Componant: [
      { name: "tokenAddr", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
  } as const

  const value = {
    bid: {
      tokenAddr: exchangeData.bid.tokenAddr as `0x${string}`,
      tokenId: ethers.BigNumber.from(exchangeData.bid.tokenId),
    },
    ask: {
      tokenAddr: exchangeData.ask.tokenAddr as `0x${string}`,
      tokenId: ethers.BigNumber.from(exchangeData.ask.tokenId),
    },
    nonce: ethers.BigNumber.from(nonce),
    owner: exchangeData.owner as `0x${string}`,
    deadline: exchangeData.deadline,
  }

  // sign the struct with domain, types and value
  let signature = ""
  try {
    signature = await signTypedData({ domain, types, value })
  } catch (e: any) {
    console.log(e)
    toast({
      title: e.code === 4001 ? "Transaction aborted" : "Transaction failure",
      description: e.message,
      status: "error",
      duration: 9000,
      isClosable: true,
    })
  }

  // encode parameters
  const encodedStruct = ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(tuple(address tokenAddr,uint256 tokenId) bid,tuple(address tokenAddr,uint256 tokenId) ask,uint256 nonce,address owner,uint48 deadline)",
    ],
    [value]
  )

  return { signature, encodedStruct }
}

export const signMultiBarterTerms = async (
  contract: Contract,
  exchangeData: MultiBarterTerms,
  toast: Function
): Promise<SignatureOutput> => {
  const chain = getNetwork().chain
  if (!chain || (chain.id !== 420 && chain.id !== 31337)) {
    throw Error("Network not supported")
  }

  const nonce = await contract.nonce(exchangeData.owner)

  // get the domain on the proper contract
  const domain = {
    name: await contract.name(),
    version: "1",
    chainId: chain.id,
    verifyingContract: contract.address as `0x${string}`,
  } as const

  const types = {
    MultiBarterTerms: [
      { name: "bid", type: "MultiComponant" },
      { name: "ask", type: "MultiComponant" },
      { name: "nonce", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "deadline", type: "uint48" },
    ],
    MultiComponant: [
      { name: "tokenAddr", type: "address" },
      { name: "tokenIds", type: "uint256[]" },
    ],
  } as const

  const value = {
    bid: {
      tokenAddr: exchangeData.bid.tokenAddr as `0x${string}`,
      tokenIds: exchangeData.bid.tokenIds.map((id) =>
        ethers.BigNumber.from(id)
      ),
    },
    ask: {
      tokenAddr: exchangeData.ask.tokenAddr as `0x${string}`,
      tokenIds: exchangeData.ask.tokenIds.map((id) =>
        ethers.BigNumber.from(id)
      ),
    },
    nonce: ethers.BigNumber.from(nonce),
    owner: exchangeData.owner as `0x${string}`,
    deadline: exchangeData.deadline,
  }

  // sign the struct with domain, types and value
  let signature = ""
  try {
    signature = await signTypedData({ domain, types, value })
  } catch (e: any) {
    console.log(e)
    toast({
      title: e.code === 4001 ? "Transaction aborted" : "Transaction failure",
      description: e.message,
      status: "error",
      duration: 9000,
      isClosable: true,
    })
  }

  // encode parameters
  const encodedStruct = ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(tuple(address tokenAddr,uint256[] tokenIds) bid,tuple(address tokenAddr,uint256[] tokenIds) ask,uint256 nonce,address owner,uint48 deadline)",
    ],
    [value]
  )

  return { signature, encodedStruct }
}
