import {
  writeContract,
  prepareWriteContract,
  SendTransactionResult,
} from "@wagmi/core"
import { Contract, ethers } from "ethers"
import { Dispatch, SetStateAction } from "react"
import { tokenABI } from "./contractsUtils"

export type TxProgression = undefined | "Waiting for confirmation" | "Pending"

export const mint = async (
  contract: Contract,
  address: string,
  tokenId: number,
  setTxProgression: Dispatch<SetStateAction<TxProgression>>,
  toast: Function
) => {
  setTxProgression("Waiting for confirmation")
  let config

  try {
    config = await prepareWriteContract({
      address: contract.address as `0x${string}`,
      abi: tokenABI("multi"),
      functionName: "mint(address,uint256)",
      args: [address, tokenId],
    })
  } catch (e: any) {
    console.log(e.error)
    setTxProgression(undefined)
    toast({
      title: e.code === 4001 ? "Transaction aborted" : "Transaction failure",
      description: e.code === 4001 ? e.message : e.error.data.message,
      status: "error",
      duration: 9000,
      isClosable: true,
    })
  }

  if (config) {
    await _proceedCall(setTxProgression, toast, config)
  }
}

export const barter = async (
  contract: Contract,
  argument: string,
  signature: string,
  setTxProgression: Dispatch<SetStateAction<TxProgression>>,
  toast: Function
) => {
  const [decodedArgs] = ethers.utils.defaultAbiCoder.decode(
    [
      "tuple(tuple(address tokenAddr,uint256 tokenId) bid,tuple(address tokenAddr,uint256 tokenId) ask,uint256 nonce,address owner,uint48 deadline)",
    ],
    argument
  )

  setTxProgression("Waiting for confirmation")
  let config

  try {
    config = await prepareWriteContract({
      address: contract.address as `0x${string}`,
      abi: tokenABI("simple"),
      functionName:
        "barter(((address,uint256),(address,uint256),uint256,address,uint48),bytes)",
      args: [decodedArgs, signature],
    })
  } catch (e: any) {
    console.log(e)
    setTxProgression(undefined)
    toast({
      title: e.code === 4001 ? "Transaction aborted" : "Transaction failure",
      description: e.code === 4001 ? e.message : e.error.data.message,
      status: "error",
      duration: 9000,
      isClosable: true,
    })
  }

  if (config) {
    await _proceedCall(setTxProgression, toast, config)
  }
}

export const barterMulti = async (
  contract: Contract,
  argument: string,
  signature: string,
  setTxProgression: Dispatch<SetStateAction<TxProgression>>,
  toast: Function
) => {
  const [decodedArgs] = ethers.utils.defaultAbiCoder.decode(
    [
      "tuple(tuple(address tokenAddr,uint256[] tokenIds) bid,tuple(address tokenAddr,uint256[] tokenIds) ask,uint256 nonce,address owner,uint48 deadline)",
    ],
    argument
  )

  setTxProgression("Waiting for confirmation")
  let config

  try {
    config = await prepareWriteContract({
      address: contract.address as `0x${string}`,
      abi: tokenABI("multi"),
      functionName:
        "barter(((address,uint256[]),(address,uint256[]),uint256,address,uint48),bytes)",
      args: [decodedArgs, signature],
    })
  } catch (e: any) {
    console.log(e)
    setTxProgression(undefined)
    toast({
      title: e.code === 4001 ? "Transaction aborted" : "Transaction failure",
      description: e.code === 4001 ? e.message : e.error.data.message,
      status: "error",
      duration: 9000,
      isClosable: true,
    })
  }

  if (config) {
    await _proceedCall(setTxProgression, toast, config)
  }
}

// internal
const _proceedCall = async (
  setTxProgression: Dispatch<SetStateAction<TxProgression>>,
  toast: Function,
  config: any
) => {
  let tx: SendTransactionResult
  try {
    tx = await writeContract(config)
    setTxProgression("Pending")
    toast({
      title: "Transaction in progress",
      description: `Hash: ${tx.hash}`,
      status: "info",
      duration: 9000,
      isClosable: true,
    })
  } catch (e: any) {
    setTxProgression(undefined)
    console.log(e)
    console.log(e.message)
    toast({
      title: e.code === 4001 ? "Transaction aborted" : "Transaction failure",
      description: e.message,
      status: "error",
      duration: 9000,
      isClosable: true,
    })
    return
  }

  let result = await tx.wait()
  setTxProgression(undefined)
  toast({
    title: "Transaction succeeded",
    description: `Mined in block ${result.blockNumber}`,
    status: "success",
    duration: 9000,
    isClosable: true,
  })
}
