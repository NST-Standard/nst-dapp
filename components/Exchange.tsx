import {
  Collection,
  getContractName,
  ContractsName,
  Contracts,
  getContractInstance,
  getContractAddress,
  TokensName,
} from "@/lib/contractsUtils"
import {
  Box,
  Button,
  Code,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react"
import { Contract, ethers, Event as EtherEvent } from "ethers"
import { useEffect, useState } from "react"
import { signTypedData, getNetwork } from "@wagmi/core"
import { exchange } from "@/lib/contractInteraction"

type Props = {
  inventory: Collection[]
  totalSupply: Collection[]
  address: string
  contracts: Contracts
}

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

const Exchange = ({ inventory, totalSupply, address, contracts }: Props) => {
  const [notOwnedSupply, setNotOwnedSupply] = useState<Collection[]>([])

  const [message, setMessage] = useState({
    struct: {
      bid: { tokenAddr: "0x", tokenId: 0, amount: 0 },
      ask: { tokenAddr: "0x", tokenId: 0, amount: 0 },
      message: { owner: "0x", nonce: 0 },
    },
    encodedStruct: "0x",
    signature: "0x",
  })

  const [exchangeInput, setExchangeInput] = useState({
    askedTokenAddr: "Asked token address",
    argument: "Argument",
    signature: "Signature",
  })

  async function signExchange(contract: Contract) {
    const chainid = getNetwork().chain?.id

    const exchangeData: SimpleExchange = message.struct
    // get the nonce on the proper contract
    exchangeData.message.owner = address
    exchangeData.message.nonce = await contract.nonce(address)
    exchangeData.bid.amount = 1
    exchangeData.ask.amount = 1
    console.log(exchangeData)

    // get the domain on the proper contract
    const domain = {
      name: await contract.name(),
      version: "1",
      chainId: chainid,
      verifyingContract: contract.address as `0x${string}`,
    } as const
    console.log(domain)

    // get the typed structure
    // EIP712Domain: [
    //   { name: "name", type: "string" },
    //   { name: "version", type: "string" },
    //   { name: "chainId", type: "uint256" },
    //   { name: "verifyingContract", type: "address" },
    // ],
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

    setMessage((m) => {
      return { ...m, signature, encodedStruct }
    })
  }

  useEffect(() => {
    const notOwned: Collection[] = []

    totalSupply.forEach((collection) => {
      const userCollection = inventory.find((userCollection) => {
        userCollection.metadata.title === collection.metadata.title
      })

      if (!userCollection) {
        notOwned.push(collection)
      } else {
        notOwned.push({
          ...collection,
          tokens: collection.tokens.filter((token) => {
            let owned = false
            userCollection.tokens.forEach((userToken) => {
              if (token.args && userToken.args) {
                if (userToken.args[2] === token.args[2]) owned = true
              }
            })
            return owned
          }),
        })
      }
    })

    setNotOwnedSupply(notOwned)
  }, [address, totalSupply, inventory])

  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h2">
        Perform an exchange
      </Heading>

      <Button
        onClick={() => {
          console.log()
        }}
      >
        Log
      </Button>

      <Box justifyContent="space-between" display="flex">
        {/* TOKEN TO GIVE */}
        <FormControl>
          <FormLabel>Token to give:</FormLabel>
          <Select
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
            placeholder="Contract name"
          >
            {inventory.map((nst) => {
              return (
                <option
                  key={nst.metadata.title}
                  value={getContractAddress(nst.metadata.title as TokensName)}
                >
                  {nst.metadata.title}
                </option>
              )
            })}
          </Select>
          <FormLabel>Token id:</FormLabel>
          <Select
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
            placeholder="token ID"
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
        <FormControl>
          <FormLabel>Token to ask:</FormLabel>
          <Select
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
            placeholder="Contract name"
          >
            {notOwnedSupply.map((nst) => {
              return (
                <option
                  key={nst.metadata.title}
                  value={getContractAddress(nst.metadata.title as TokensName)}
                >
                  {nst.metadata.title}
                </option>
              )
            })}
          </Select>
          <FormLabel>Token id:</FormLabel>
          <Select
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
            placeholder="token ID"
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

      <Heading my="5" fontFamily="monospace" as="h2">
        Exchange resume
      </Heading>
      <Box justifyContent="space-between" gap="3" display="flex">
        <Box borderRadius="10" bg="gray.300" p="5">
          <Text fontWeight="bold">Token to give</Text>
          {message.struct.bid && (
            <>
              <Text>{getContractName(message.struct.bid.tokenAddr)}</Text>
              <Text>{`TokenId: ${message.struct.bid.tokenId}`}</Text>
            </>
          )}
        </Box>
        <Box borderRadius="10" bg="gray.300" p="5">
          <Text fontWeight="bold">Token to ask</Text>
          {message.struct.ask && (
            <>
              <Text>{getContractName(message.struct.ask.tokenAddr)}</Text>
              <Text>{`TokenId: ${message.struct.ask.tokenId}`}</Text>
            </>
          )}
        </Box>
      </Box>

      {contracts.supportTicket ? (
        <>
          <Button
            onClick={() => signExchange(contracts.supportTicket as Contract)}
          >
            Sign
          </Button>
        </>
      ) : (
        <>:</>
      )}

      <Heading my="5" fontFamily="monospace" as="h2">
        Elements to send
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

      <Heading my="5" fontFamily="monospace" as="h2">
        Execute exchange
      </Heading>

      <FormControl my="5">
        <FormLabel>Asked Token address</FormLabel>
        <Input
          value={exchangeInput.askedTokenAddr}
          onChange={(e) =>
            setExchangeInput((i) => {
              return { ...i, askedTokenAddr: e.target.value }
            })
          }
          focusBorderColor={
            exchangeInput.askedTokenAddr.startsWith("0x") &&
            exchangeInput.askedTokenAddr.length === 42
              ? "green.500"
              : "red.500"
          }
          bg="white"
        />
        <FormLabel>Argument</FormLabel>
        <Input
          value={exchangeInput.argument}
          onChange={(e) =>
            setExchangeInput((i) => {
              return { ...i, argument: e.target.value }
            })
          }
          focusBorderColor={
            exchangeInput.argument.startsWith("0x") ? "green.500" : "red.500"
          }
          bg="white"
        />
        <FormLabel>Signature</FormLabel>
        <Input
          value={exchangeInput.signature}
          onChange={(e) =>
            setExchangeInput((i) => {
              return { ...i, signature: e.target.value }
            })
          }
          focusBorderColor={
            exchangeInput.signature.startsWith("0x") &&
            exchangeInput.signature.length === 132
              ? "green.500"
              : "red.500"
          }
          bg="white"
        />
      </FormControl>

      <Button
        onClick={() =>
          exchange(
            getContractInstance(contracts, exchangeInput.askedTokenAddr),
            exchangeInput.argument,
            exchangeInput.signature
          )
        }
        isDisabled={
          !exchangeInput.signature.startsWith("0x") ||
          exchangeInput.signature.length !== 132 ||
          !exchangeInput.argument.startsWith("0x") ||
          !exchangeInput.askedTokenAddr.startsWith("0x") ||
          exchangeInput.askedTokenAddr.length !== 42
        }
        colorScheme="purple"
      >
        Perform exchange
      </Button>
    </>
  )
}

export default Exchange
