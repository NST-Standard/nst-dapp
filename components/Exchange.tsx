import { Collection, getContractName, Contracts } from "@/lib/contractsUtils"
import {
  Box,
  Button,
  Code,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Text,
} from "@chakra-ui/react"
import { Contract, ethers, Event as EtherEvent } from "ethers"
import { useEffect, useState } from "react"
import { signTypedData, getNetwork } from "@wagmi/core"
import { exchange } from "@/lib/contractInteraction"

type Props = {
  inventory: Collection[]
  totalSupply: EtherEvent[]
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

const initExchangeState: SimpleExchange = {
  bid: { tokenAddr: "Token address", tokenId: 0, amount: 0 },
  ask: { tokenAddr: "Token address", tokenId: 0, amount: 0 },
  message: { owner: "", nonce: 0 },
}

const Exchange = ({ inventory, totalSupply, address, contracts }: Props) => {
  const [simpleExchange, setSimpleExchange] =
    useState<SimpleExchange>(initExchangeState)

  const [notOwnedSupply, setNotOwnedSupply] = useState<EtherEvent[]>([])
  const [message, setMessage] = useState({
    askedTokenAddr: "Asked token address",
    argument: "Argument",
    signature: "Signature",
  })

  const [exchangeInput, setExchangeInput] = useState({
    askedTokenAddr: "Asked token address",
    argument: "Argument",
    signature: "Signature",
  })

  function getContract(tokenAddr: string): Contract {
    const { smokeBond, supportTicket, gardenTicket } = contracts
    if (smokeBond && supportTicket && gardenTicket) {
      switch (tokenAddr.toLowerCase()) {
        case smokeBond.address.toLowerCase():
          return smokeBond
        case supportTicket.address.toLowerCase():
          return supportTicket
        case gardenTicket.address.toLowerCase():
          return gardenTicket
        default:
          throw Error("Unknown token address")
      }
    } else {
      throw Error("Unknown token address")
    }
  }

  async function signExchange(contract: Contract) {
    // get the nonce on the proper contract
    const nonce = (await contract.nonce(address)).toNumber()
    const chainid = getNetwork().chain?.id
    const exchange: SimpleExchange = {
      bid: simpleExchange.bid,
      ask: simpleExchange.ask,
      message: { owner: address, nonce },
    }

    // get the domain on the proper contract
    const domain = {
      name: await contract.name(),
      version: "1",
      chainId: chainid,
      verifyingContract: simpleExchange.bid.tokenAddr as `0x${string}`,
    } as const

    const types = {
      Token: [
        { name: "tokenAddr", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
      Message: [
        { name: "owner", type: "address" },
        { name: "nonce", type: "uint256" },
      ],
      SingleExchange: [
        { name: "bid", type: "Token" },
        { name: "ask", type: "Token" },
        { name: "message", type: "Message" },
      ],
    } as const

    const value = {
      bid: {
        tokenAddr: exchange.bid.tokenAddr as `0x${string}`,
        tokenId: ethers.BigNumber.from(exchange.bid.tokenId),
        amount: ethers.BigNumber.from(exchange.bid.amount),
      },
      ask: {
        tokenAddr: exchange.ask.tokenAddr as `0x${string}`,
        tokenId: ethers.BigNumber.from(exchange.ask.tokenId),
        amount: ethers.BigNumber.from(exchange.ask.amount),
      },
      message: {
        owner: exchange.message.owner as `0x${string}`,
        nonce: ethers.BigNumber.from(exchange.message.nonce),
      },
    } as const

    const argument = ethers.utils.defaultAbiCoder.encode(
      [
        "tuple(address,uint256,uint256)",
        "tuple(address,uint256,uint256)",
        "tuple(address,uint256)",
      ],
      [
        [value.bid.tokenAddr, value.bid.tokenId, value.bid.amount],
        [value.ask.tokenAddr, value.ask.tokenId, value.ask.amount],
        [value.message.owner, value.message.nonce],
      ]
    )

    console.table([
      [value.bid.tokenAddr, value.bid.tokenId, value.bid.amount],
      [value.ask.tokenAddr, value.ask.tokenId, value.ask.amount],
      [value.message.owner, value.message.nonce],
    ])

    console.log(value)
    console.log(types)
    console.log(domain)

    const signature = await signTypedData({ domain, types, value })
    setMessage({ askedTokenAddr: value.ask.tokenAddr, argument, signature })
  }

  useEffect(() => {
    const filtered = totalSupply.filter((token) => {
      if (token.args) {
        return token.args[1] !== address
      }
    })
    setNotOwnedSupply(filtered)
  }, [address, totalSupply])

  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h2">
        Perform an exchange
      </Heading>

      <Box justifyContent="space-between" display="flex">
        <Box maxW="20%">
          <Text>Give:</Text>
          <Select
            multiple={true}
            value={[
              simpleExchange.bid.tokenAddr,
              simpleExchange.bid.tokenId.toString(),
            ]}
            onChange={(e) => {
              const [tokenAddr, tokenId] = e.target.value.split(",")
              setSimpleExchange((s) => {
                return {
                  ...s,
                  bid: {
                    tokenAddr,
                    tokenId: Number(tokenId),
                    amount: 1,
                  },
                }
              })
            }}
            bg="white"
          >
            {inventory.map((nst: Collection) => {
              return nst.tokens.map((token: EtherEvent) => {
                if (token.args) {
                  return (
                    <option
                      key={token.address + token.args[2].toNumber()}
                      value={[token.address, token.args[2].toNumber()]}
                    >{`${getContractName(
                      token.address
                    )} (id: ${token.args[2].toNumber()})`}</option>
                  )
                }
              })
            })}
          </Select>
        </Box>
        <Box maxW="20%">
          <Text>Ask:</Text>
          <Select
            multiple={true}
            value={[
              simpleExchange.ask.tokenAddr,
              simpleExchange.ask.tokenId.toString(),
            ]}
            onChange={(e) => {
              const [tokenAddr, tokenId] = e.target.value.split(",")
              setSimpleExchange((s) => {
                return {
                  ...s,
                  ask: {
                    tokenAddr,
                    tokenId: Number(tokenId),
                    amount: 1,
                  },
                }
              })
            }}
            bg="white"
          >
            {notOwnedSupply.map((token: EtherEvent) => {
              if (token.args) {
                return (
                  <option
                    key={token.address + token.args[2].toNumber()}
                    value={[token.address, token.args[2].toNumber()]}
                  >{`${getContractName(
                    token.address
                  )} (id: ${token.args[2].toNumber()})`}</option>
                )
              }
            })}
          </Select>
        </Box>
      </Box>

      <Heading my="5" fontFamily="monospace" as="h2">
        Exchange resume
      </Heading>
      <Box justifyContent="space-between" gap="3" display="flex">
        <Box borderRadius="10" bg="gray.300" p="5">
          <Text fontWeight="bold">Token to give</Text>
          {simpleExchange.bid && (
            <>
              <Text>{getContractName(simpleExchange.bid.tokenAddr)}</Text>
              <Text>{`TokenId: ${simpleExchange.bid.tokenId}`}</Text>
            </>
          )}
        </Box>
        <Box borderRadius="10" bg="gray.300" p="5">
          <Text fontWeight="bold">Token to ask</Text>
          {simpleExchange.ask && (
            <>
              <Text>{getContractName(simpleExchange.ask.tokenAddr)}</Text>
              <Text>{`TokenId: ${simpleExchange.ask.tokenId}`}</Text>
            </>
          )}
        </Box>
      </Box>

      {contracts.smokeBond ? (
        <>
          <Button onClick={() => signExchange(contracts.smokeBond as Contract)}>
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
        {message.askedTokenAddr}
      </Code>
      <Text mt="5" fontWeight="bold" fontSize="1.5rem">
        Message argument:
      </Text>
      <Code maxW="90%" p="1">
        {message.argument}
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
            getContract(exchangeInput.askedTokenAddr),
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
