import { Collection, contractName, Contracts } from "@/lib/tokenInventory"
import { Box, Button, Heading, Select, Text } from "@chakra-ui/react"
import { Contract, ethers, Event as EtherEvent } from "ethers"
import { useEffect, useState } from "react"
import { signTypedData } from "@wagmi/core"

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

  async function signExchange(contract: Contract) {
    // get the nonce on the proper contract
    const exchange: SimpleExchange = {
      bid: simpleExchange.bid,
      ask: simpleExchange.ask,
      message: { owner: address, nonce: 0 },
    }

    // get the domain on the proper contract
    const domain = {
      name: await contract.name(),
      version: "1",
      chainId: 420,
      verifyingContract: contract.address as `0x${string}`,
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

    const signature = await signTypedData({ domain, types, value })
    console.log(signature)
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
                    amount: 0,
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
                    >{`${contractName(
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
                    amount: 0,
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
                  >{`${contractName(
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
              <Text>{contractName(simpleExchange.bid.tokenAddr)}</Text>
              <Text>{`TokenId: ${simpleExchange.bid.tokenId}`}</Text>
            </>
          )}
        </Box>
        <Box borderRadius="10" bg="gray.300" p="5">
          <Text fontWeight="bold">Token to ask</Text>
          {simpleExchange.ask && (
            <>
              <Text>{contractName(simpleExchange.ask.tokenAddr)}</Text>
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
    </>
  )
}

export default Exchange
