import { getNetwork, signTypedData } from "@wagmi/core"
import { Contract, ethers } from "ethers"

type ExchangePart = {
  tokenAddr: string
  tokenId: Number
  amount: Number
}

type Message = {
  owner: string
  nonce: Number
}

type SimpleExchange = {
  bid: ExchangePart
  ask: ExchangePart
  message: Message
}

type SignatureOutput = {
  signature: string
  encodedStruct: string
}

export const signExchangeMessage = async (
  contract: Contract,
  exchangeData: SimpleExchange
): Promise<SignatureOutput> => {
  const chain = getNetwork().chain
  if (!chain || (chain.id !== 420 && chain.id !== 31337)) {
    throw Error("Network not supported")
  }

  const nonce = await contract.nonce(exchangeData.message.owner)

  // get the domain on the proper contract
  const domain = {
    name: await contract.name(),
    version: "1",
    chainId: chain.id,
    verifyingContract: contract.address as `0x${string}`,
  } as const

  const types = {
    SingleExchange: [
      { name: "bid", type: "Token" },
      { name: "ask", type: "Token" },
      { name: "message", type: "Message" },
    ],
    Message: [
      { name: "owner", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
    Token: [
      { name: "tokenAddr", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
  } as const

  const value = {
    bid: {
      tokenAddr: exchangeData.bid.tokenAddr as `0x${string}`,
      tokenId: ethers.BigNumber.from(exchangeData.bid.tokenId),
      amount: ethers.BigNumber.from(exchangeData.bid.amount),
    },
    ask: {
      tokenAddr: exchangeData.ask.tokenAddr as `0x${string}`,
      tokenId: ethers.BigNumber.from(exchangeData.ask.tokenId),
      amount: ethers.BigNumber.from(exchangeData.ask.amount),
    },
    message: {
      owner: exchangeData.message.owner as `0x${string}`,
      nonce: ethers.BigNumber.from(exchangeData.message.nonce),
    },
  }

  // sign the struct with domain, types and value
  const signature = await signTypedData({ domain, types, value })

  // encode parameters
  const encodedStruct = ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(tuple(address tokenAddr,uint256 tokenId,uint256 amount) bid,tuple(address tokenAddr,uint256 tokenId,uint256 amount) ask, tuple(address owner,uint256 nonce) message)",
    ],
    [value]
  )

  return { signature, encodedStruct }
}
