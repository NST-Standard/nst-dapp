import { Contract } from "ethers"
import { useState } from "react"

export const mint = async (contract: Contract, address: string) => {
  // const [status, setStatus] = useState()
  let tx
  console.log("waiting for confirmation")
  try {
    tx = await contract["mint(address)"](address)
  } catch (e) {
    console.log(e)
    return
  }

  console.log("pending")
  let result = await tx.wait()

  console.log(result)
}
