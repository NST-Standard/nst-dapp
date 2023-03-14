import { exchange, TxProgression } from "@/lib/contractInteraction"
import { Contracts, getContractInstance } from "@/lib/contractsUtils"
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"

type Props = {
  contracts: Contracts
}

const Accept = ({ contracts }: Props) => {
  const toast = useToast()
  const [txProgression, setTxProgression] = useState<TxProgression>()
  const [exchangeInput, setExchangeInput] = useState({
    askedTokenAddr: "",
    argument: "",
    signature: "",
  })
  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h2">
        Fill exchange data
      </Heading>

      <FormControl my="5">
        <FormLabel>Asked Token address</FormLabel>
        <Input
          placeholder="[0x]Token address to send"
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
          placeholder="[0x]Raw argument"
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
          placeholder="[0x]Signature"
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
            exchangeInput.signature,
            setTxProgression,
            toast
          )
        }
        isLoading={
          txProgression === "Waiting for confirmation" ||
          txProgression === "Pending"
        }
        loadingText={txProgression}
        isDisabled={
          !exchangeInput.signature.startsWith("0x") ||
          exchangeInput.signature.length !== 132 ||
          !exchangeInput.argument.startsWith("0x") ||
          !exchangeInput.askedTokenAddr.startsWith("0x") ||
          exchangeInput.askedTokenAddr.length !== 42
        }
        colorScheme="teal"
      >
        Perform exchange
      </Button>
    </>
  )
}
export default Accept
