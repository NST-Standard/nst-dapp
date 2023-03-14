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
  setTxProgression: Dispatch<SetStateAction<TxProgression>>,
  toast: Function
) => {
  setTxProgression("Waiting for confirmation")
  let config

  try {
    config = await prepareWriteContract({
      address: contract.address as `0x${string}`,
      abi: tokenABI(),
      functionName: "mint(address)",
      args: [address],
    })
  } catch (e) {
    console.log(e)
    setTxProgression(undefined)
    throw Error("Call configuration failed")
  }

  await _proceedCall(setTxProgression, toast, config)
}

export const exchange = async (
  contract: Contract,
  argument: string,
  signature: string,
  setTxProgression: Dispatch<SetStateAction<TxProgression>>,
  toast: Function
) => {
  const [decodedArgs] = ethers.utils.defaultAbiCoder.decode(
    [
      "tuple(tuple(address tokenAddr,uint256 tokenId,uint256 amount) bid,tuple(address tokenAddr,uint256 tokenId,uint256 amount) ask, tuple(address owner,uint256 nonce) message)",
    ],
    argument
  )

  setTxProgression("Waiting for confirmation")
  let config

  try {
    config = await prepareWriteContract({
      address: contract.address as `0x${string}`,
      abi: tokenABI(),
      functionName:
        "exchange(((address,uint256,uint256),(address,uint256,uint256),(address,uint256)),bytes)",
      args: [decodedArgs, signature],
    })
  } catch (e) {
    console.log(e)
    setTxProgression(undefined)
    throw Error("Call configuration failed")
  }

  await _proceedCall(setTxProgression, toast, config)
}

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
