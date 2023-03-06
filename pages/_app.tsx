import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { ChakraProvider } from "@chakra-ui/react"
import { WagmiConfig, createClient } from "wagmi"
import { getDefaultProvider } from "ethers"
import { MetaMaskConnector } from "@wagmi/core/connectors/metaMask"
import { WalletConnectConnector } from "@wagmi/core/connectors/walletConnect"

const client = createClient({
  provider: getDefaultProvider(),
  connectors: [
    new MetaMaskConnector(),
    // new WalletConnectConnector({ options: { projectId: "API_KEY" } }),
  ],
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <WagmiConfig client={client}>
        <Component {...pageProps} />
      </WagmiConfig>
    </ChakraProvider>
  )
}
