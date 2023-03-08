import { useAccount, useConnect, useDisconnect } from "wagmi"
import { MetaMaskConnector } from "@wagmi/core/connectors/metaMask"
import { fetchSigner, getNetwork } from "@wagmi/core"
import { Button, Heading, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"

const Account = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({ connector: new MetaMaskConnector() })
  const { disconnect } = useDisconnect()

  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    ;(async () => {
      const signer = await fetchSigner()
      if (signer && getNetwork().chain?.id === 31337) {
        setNonce(await signer.getTransactionCount())
      }
    })()
  }, [address, isConnected])

  return (
    <>
      <Heading py="5" fontFamily="monospace" as="h2">
        Account details
      </Heading>

      {isConnected ? (
        <>
          <Text>
            Connected with {address}{" "}
            {nonce ? <Text as="b">(nonce: {nonce})</Text> : <></>}
          </Text>

          <Button onClick={() => disconnect()} colorScheme="twitter">
            Disconnect
          </Button>
        </>
      ) : (
        <>
          <Button onClick={() => connect()} colorScheme="twitter">
            Connect wallet
          </Button>
        </>
      )}
    </>
  )
}

export default Account
