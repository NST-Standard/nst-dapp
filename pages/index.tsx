import Head from "next/head"
import {
  Box,
  Button,
  Container,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react"
import { useAccount, useDisconnect } from "wagmi"
import { getContract } from "@wagmi/core"
import { useEffect, useState } from "react"
import { fetchSigner, getNetwork, switchNetwork } from "@wagmi/core"
import {
  Collection,
  Contracts,
  fetchCollections,
  getContractAddress,
  tokenABI,
} from "@/lib/contractsUtils"

import Account from "../components/Account"
import Inventory from "../components/Inventory"
import Mint from "../components/Mint"
import Propose from "@/components/Propose"
import Accept from "@/components/Accept"
import { syncInventory } from "@/lib/inventoryUtils"

const Home = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const [contracts, setContracts] = useState({} as Contracts)
  const [totalSupply, setTotalSupply] = useState<Collection[]>([])
  const [inventory, setInventory] = useState<Collection[]>([])

  // FETCH CONTRACT and Tokens
  useEffect(() => {
    ;(async () => {
      const signer = await fetchSigner()
      const chain = getNetwork().chain
      if (signer && chain && (chain.id === 420 || chain.id === 31337)) {
        let _contracts = {} as Contracts

        _contracts.catBox = getContract({
          address: getContractAddress("catBox"),
          abi: tokenABI("simple"),
          signerOrProvider: signer,
        })

        _contracts.supportTicket = getContract({
          address: getContractAddress("supportTicket"),
          abi: tokenABI("multi"),
          signerOrProvider: signer,
        })

        _contracts.gardenTicket = getContract({
          address: getContractAddress("gardenTicket"),
          abi: tokenABI("multi"),
          signerOrProvider: signer,
        })

        // add "Transfer" listeners
        _contracts.catBox.on("Transfer", async (from, to, tokenId) => {
          if (
            address &&
            (address.toLowerCase() == from.toLowerCase() ||
              address.toLowerCase() == to.toLowerCase())
          ) {
            await syncInventory(_contracts, address, setInventory)
          }
        })
        _contracts.supportTicket.on("Transfer", async (from, to, tokenId) => {
          if (
            address &&
            (address.toLowerCase() == from.toLowerCase() ||
              address.toLowerCase() == to.toLowerCase())
          ) {
            await syncInventory(_contracts, address, setInventory)
          }
        })
        _contracts.gardenTicket.on("Transfer", async (from, to, tokenId) => {
          if (
            address &&
            (address.toLowerCase() == from.toLowerCase() ||
              address.toLowerCase() == to.toLowerCase())
          ) {
            await syncInventory(_contracts, address, setInventory)
          }
        })

        setContracts(_contracts)
        setTotalSupply(await fetchCollections(_contracts))
      }
    })()
  }, [isConnected, address])

  // FETCH INVENTORY
  useEffect(() => {
    ;(async () => {
      await syncInventory(contracts, address, setInventory)
    })()
  }, [contracts, address])

  return (
    <>
      <Head>
        <title>Demo NST dApp</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box
        minH="100vh"
        bgGradient="linear-gradient(230deg,rgba(200,45,12,.1),rgba(200,245,12,.1))"
        as="main"
      >
        <Container pb="10" fontFamily="monospace" maxW="container.xl">
          <Heading as="h1" fontFamily="monospace" textAlign="center" p="5">
            Demo NST dApp
          </Heading>

          {/* ACCOUNT */}
          <Account />

          <Modal
            isOpen={
              address !== undefined &&
              getNetwork().chain?.id !== 420 &&
              getNetwork().chain?.id !== 31337
            }
            onClose={() => console.log("close")}
          >
            <ModalOverlay />
            <ModalContent border="4px" borderColor="red">
              <ModalHeader>Network not supported</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                Only Optimism goerli (420) and local network (31337) supported
              </ModalBody>

              <ModalFooter>
                <Button colorScheme="red" mr={3} onClick={() => disconnect()}>
                  Disconnect
                </Button>
                <Button
                  onClick={async () => {
                    disconnect()
                    await switchNetwork({
                      chainId: 420,
                    })
                  }}
                  colorScheme="green"
                  variant="outline"
                >
                  Switch to Optimism goerli
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* NST BALANCES */}
          {address && <Inventory inventory={inventory} />}

          {/* MINT TOKEN */}
          {address && <Mint address={address} contracts={contracts} />}

          {/* PERFORM AN EXCHANGE */}
          {address && (
            <Tabs
              borderRadius="10"
              my="10"
              bg="blackAlpha.100"
              isFitted
              variant="unstyled"
            >
              <TabList>
                <Tab
                  _selected={{ bg: "none" }}
                  fontWeight="bold"
                  borderTopLeftRadius="10"
                  bg="rgb(40,240,40,0.2)"
                >
                  Propose a barter
                </Tab>
                <Tab
                  _selected={{ bg: "none" }}
                  fontWeight="bold"
                  borderTopRightRadius="10"
                  bg="rgb(40,240,40,0.2)"
                >
                  Accept a barter
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Propose
                    contracts={contracts}
                    address={address}
                    inventory={inventory}
                    totalSupply={totalSupply}
                  />
                </TabPanel>
                <TabPanel>
                  <Accept contracts={contracts} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </Container>
      </Box>
    </>
  )
}

export default Home
