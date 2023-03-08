import { Contract, ethers } from "ethers"

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

export const exchange = async (
  contract: Contract,
  argument: string,
  signature: string
) => {
  const decodedArgs = ethers.utils.defaultAbiCoder.decode(
    [
      "tuple(address,uint256,uint256)",
      "tuple(address,uint256,uint256)",
      "tuple(address,uint256)",
    ],
    argument
  )

  console.log(decodedArgs)

  let tx
  console.log("waiting for confirmation")
  try {
    tx = await contract[
      "exchange(((address,uint256,uint256),(address,uint256,uint256),(address,uint256)),bytes)"
    ](decodedArgs, signature)
  } catch (e) {
    console.log(e)
    return
  }

  console.log("pending")
  let result = await tx.wait()

  console.log(result)
}
