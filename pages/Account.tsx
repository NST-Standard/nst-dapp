import { useAccount, useConnect, useDisconnect } from "wagmi"
import { MetaMaskConnector } from "@wagmi/core/connectors/metaMask"
import { Button, Heading, Text } from "@chakra-ui/react"

const Account = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({ connector: new MetaMaskConnector() })
  const { disconnect } = useDisconnect()

  return (
    <>
      <Heading py="5" fontFamily="monospace" as="h2">
        Account details
      </Heading>

      {isConnected ? (
        <>
          <Text>Connected with {address}</Text>
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
