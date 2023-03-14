import {
  Collection,
  Contracts,
  ContractsName,
  getContractAddress,
  getContractInstance,
  getContractName,
  TokensName,
} from "@/lib/contractsUtils"
import { signExchangeMessage } from "@/lib/signatureUtils"
import {
  Box,
  Button,
  Code,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Text,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"

type Props = {
  inventory: Collection[]
  totalSupply: Collection[]
  address: string
  contracts: Contracts
}

const Propose = ({ inventory, totalSupply, address, contracts }: Props) => {
  const [notOwnedSupply, setNotOwnedSupply] = useState<Collection[]>([])

  const [message, setMessage] = useState({
    struct: {
      bid: { tokenAddr: "", tokenId: 0, amount: 0 },
      ask: { tokenAddr: "", tokenId: 0, amount: 0 },
      message: { owner: "", nonce: 0 },
    },
    encodedStruct: "",
    signature: "",
  })

  useEffect(() => {
    const _notOwnedSupply = totalSupply.map((nst) => {
      if (!nst.tokens.length) return nst
      const supply = nst.tokens
      const userNst = inventory.find(
        (userNst) => userNst.metadata.title === nst.metadata.title
      )
      if (!userNst || !userNst.tokens.length) return nst
      const notOwned = supply.filter((token) => {
        const isOwned = userNst.tokens.find((userToken) => {
          if (token.args && userToken.args) {
            return token.args[2].toNumber() === userToken.args[2].toNumber()
          }
        })
        return isOwned ? false : true
      })
      return { ...nst, tokens: notOwned }
    })

    setNotOwnedSupply(_notOwnedSupply)
  }, [address, totalSupply, inventory])

  async function sign() {
    const exchangeData = message.struct
    exchangeData.message.owner = address
    exchangeData.bid.amount = 1
    exchangeData.ask.amount = 1
    const { signature, encodedStruct } = await signExchangeMessage(
      getContractInstance(contracts, message.struct.bid.tokenAddr),
      exchangeData
    )

    setMessage((m) => {
      return { ...m, signature, encodedStruct }
    })
  }

  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h2">
        Select token
      </Heading>

      <Box justifyContent="space-between" display="flex">
        {/* TOKEN TO GIVE */}
        <FormControl maxW="35%">
          <FormLabel>Token to give:</FormLabel>
          <Select
            placeholder="Token name"
            bg="white"
            onChange={(e) =>
              setMessage((m) => {
                return {
                  ...m,
                  struct: {
                    ...m.struct,
                    bid: { ...m.struct.bid, tokenAddr: e.target.value },
                  },
                }
              })
            }
            value={message.struct.bid.tokenAddr}
          >
            {inventory.map((nst) => {
              if (nst.tokens.length) {
                return (
                  <option
                    key={nst.metadata.title}
                    value={getContractAddress(nst.metadata.title as TokensName)}
                  >
                    {getContractName(nst.tokens[0].address)}
                  </option>
                )
              }
            })}
          </Select>
          <FormLabel>Token id:</FormLabel>
          <Select
            placeholder="Token ID"
            bg="white"
            onChange={(e) =>
              setMessage((m) => {
                return {
                  ...m,
                  struct: {
                    ...m.struct,
                    bid: { ...m.struct.bid, tokenId: Number(e.target.value) },
                  },
                }
              })
            }
            value={message.struct.bid.tokenId}
          >
            {inventory
              .find((a) => {
                return (
                  getContractAddress(a.metadata.title as ContractsName) ===
                  message.struct.bid.tokenAddr
                )
              })
              ?.tokens.map((token) => {
                if (token.args) {
                  return (
                    <option
                      key={token.args[2]}
                      value={token.args[2].toNumber()}
                    >
                      N°{token.args[2].toNumber()}
                    </option>
                  )
                }
              })}
          </Select>
        </FormControl>

        {/* TOKEN TO ASK */}
        <FormControl maxW="35%">
          <FormLabel>Token to ask:</FormLabel>
          <Select
            placeholder="Token name"
            bg="white"
            onChange={(e) =>
              setMessage((m) => {
                return {
                  ...m,
                  struct: {
                    ...m.struct,
                    ask: { ...m.struct.ask, tokenAddr: e.target.value },
                  },
                }
              })
            }
            value={message.struct.ask.tokenAddr}
          >
            {notOwnedSupply.map((nst) => {
              if (nst.tokens.length) {
                return (
                  <option
                    key={nst.metadata.title}
                    value={getContractAddress(nst.metadata.title as TokensName)}
                  >
                    {getContractName(nst.tokens[0].address)}
                  </option>
                )
              }
            })}
          </Select>
          <FormLabel>Token id:</FormLabel>
          <Select
            placeholder="Token ID"
            bg="white"
            onChange={(e) =>
              setMessage((m) => {
                return {
                  ...m,
                  struct: {
                    ...m.struct,
                    ask: { ...m.struct.ask, tokenId: Number(e.target.value) },
                  },
                }
              })
            }
            value={message.struct.ask.tokenId}
          >
            {notOwnedSupply
              .find((a) => {
                return (
                  getContractAddress(a.metadata.title as ContractsName) ===
                  message.struct.ask.tokenAddr
                )
              })
              ?.tokens.map((token) => {
                if (token.args) {
                  return (
                    <option
                      key={token.args[2]}
                      value={token.args[2].toNumber()}
                    >
                      N°{token.args[2].toNumber()}
                    </option>
                  )
                }
              })}
          </Select>
        </FormControl>
      </Box>

      <Divider borderColor="black" mt="5" />
      <Heading my="5" fontFamily="monospace" as="h3">
        Exchange resume
      </Heading>
      <Box
        textAlign="center"
        fontSize="2xl"
        justifyContent="space-between"
        gap="3"
        display="flex"
      >
        <Box borderRadius="10" bg="gray.300" px="5rem" py="5">
          <Text fontWeight="bold">Token to give</Text>
          {message.struct.bid && (
            <>
              <Text>{getContractName(message.struct.bid.tokenAddr)}</Text>
              <Text>{`TokenId: ${message.struct.bid.tokenId}`}</Text>
            </>
          )}
        </Box>
        {contracts.smokeBond &&
        contracts.supportTicket &&
        contracts.gardenTicket ? (
          <>
            <Button
              colorScheme="teal"
              size="lg"
              my="auto"
              isDisabled={
                message.struct.bid.tokenAddr === message.struct.ask.tokenAddr &&
                message.struct.bid.tokenId === message.struct.ask.tokenId
              }
              onClick={() => sign()}
            >
              Sign
            </Button>
          </>
        ) : (
          <>:</>
        )}
        <Box borderRadius="10" bg="gray.300" px="5rem" py="5">
          <Text fontWeight="bold">Token to ask</Text>
          {message.struct.ask && (
            <>
              <Text>{getContractName(message.struct.ask.tokenAddr)}</Text>
              <Text>{`TokenId: ${message.struct.ask.tokenId}`}</Text>
            </>
          )}
        </Box>
      </Box>

      <Divider borderColor="black" mt="5" />
      <Heading my="5" fontFamily="monospace" as="h2">
        Elements to send/publish
      </Heading>

      <Text mt="5" fontWeight="bold" fontSize="1.5rem">
        Asked token address:
      </Text>
      <Code maxW="90%" p="1">
        {message.struct.ask.tokenAddr}
      </Code>
      <Text mt="5" fontWeight="bold" fontSize="1.5rem">
        Message argument:
      </Text>
      <Code maxW="90%" p="1">
        {message.encodedStruct}
      </Code>
      <Text mt="5" fontWeight="bold" fontSize="1.5rem">
        Signature:
      </Text>
      <Code maxW="90%" p="1">
        {message.signature}
      </Code>
    </>
  )
}

export default Propose
