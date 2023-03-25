import {
  Contracts,
  getContractInstance,
  getContractName,
} from "@/lib/contractsUtils"
import {
  BarterTerms,
  Message,
  MultiBarterTerms,
  SignatureOutput,
  signBarterTerms,
  signMultiBarterTerms,
} from "@/lib/signatureUtils"
import {
  Box,
  Button,
  Code,
  Divider,
  Heading,
  ListItem,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react"
import { Dispatch, SetStateAction } from "react"

type Props = {
  address: string
  message: Message
  setMessage: Dispatch<SetStateAction<Message>>
  contracts: Contracts
  barterTerms: BarterTerms
  multiBarterTerms: MultiBarterTerms
}

const Sign = ({
  address,
  barterTerms,
  multiBarterTerms,
  contracts,
  message,
  setMessage,
}: Props) => {
  const toast = useToast()

  async function sign() {
    let output: SignatureOutput
    if (message.multiBarter) {
      const exchangeData = multiBarterTerms
      exchangeData.owner = address
      exchangeData.deadline = Math.floor(84600 + Date.now() / 1000)
      console.log(exchangeData)
      output = await signMultiBarterTerms(
        getContractInstance(contracts, multiBarterTerms.bid.tokenAddr),
        exchangeData,
        toast
      )
    } else {
      const exchangeData = barterTerms
      exchangeData.owner = address
      exchangeData.deadline = Math.floor(84600 + Date.now() / 1000) // +1j
      output = await signBarterTerms(
        getContractInstance(contracts, barterTerms.bid.tokenAddr),
        exchangeData,
        toast
      )
    }

    const { signature, encodedStruct } = output
    setMessage((m) => {
      return { ...m, signature, encodedStruct }
    })
  }

  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h3">
        {message.multiBarter ? "Multi b" : "B"}arter terms
      </Heading>
      <Box
        textAlign="center"
        fontSize="2xl"
        justifyContent="space-between"
        gap="3"
        display="flex"
      >
        <Box borderRadius="10" bg="gray.300" px="5rem" py="5">
          {message.multiBarter ? (
            <>
              {" "}
              <Text fontWeight="bold">Tokens to give</Text>
              <UnorderedList>
                {multiBarterTerms.bid.tokenIds.map((id) => {
                  return (
                    <ListItem textAlign="start" key={id}>
                      {id}
                    </ListItem>
                  )
                })}
              </UnorderedList>
            </>
          ) : (
            <>
              <Text fontWeight="bold">Token to give</Text>
              {barterTerms.bid && (
                <>
                  <Text>{getContractName(barterTerms.bid.tokenAddr)}</Text>
                  <Text>{`TokenId: ${barterTerms.bid.tokenId}`}</Text>
                </>
              )}
            </>
          )}
        </Box>
        {contracts.catBox &&
        contracts.supportTicket &&
        contracts.gardenTicket ? (
          <>
            <Button
              colorScheme="teal"
              size="lg"
              my="auto"
              isDisabled={
                message.multiBarter
                  ? multiBarterTerms.bid.tokenIds.length === 0 ||
                    multiBarterTerms.ask.tokenIds.length === 0
                  : barterTerms.bid.tokenAddr.length !== 42 ||
                    barterTerms.ask.tokenAddr.length !== 42
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
          {message.multiBarter ? (
            <>
              {" "}
              <Text fontWeight="bold">Tokens to ask</Text>
              <UnorderedList>
                {multiBarterTerms.ask.tokenIds.map((id) => {
                  return (
                    <ListItem textAlign="start" key={id}>
                      {id}
                    </ListItem>
                  )
                })}
              </UnorderedList>
            </>
          ) : (
            <>
              <Text fontWeight="bold">Token to ask</Text>
              {barterTerms.ask && (
                <>
                  <Text>{getContractName(barterTerms.ask.tokenAddr)}</Text>
                  <Text>{`TokenId: ${barterTerms.ask.tokenId}`}</Text>
                </>
              )}
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
        {message.multiBarter
          ? multiBarterTerms.ask.tokenAddr
          : barterTerms.ask.tokenAddr}
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

export default Sign
