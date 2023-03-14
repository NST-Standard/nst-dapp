import { mint, TxProgression } from "@/lib/contractInteraction"
import { Contracts } from "@/lib/contractsUtils"
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react"
import { useState } from "react"

type Props = {
  contracts: Contracts
  address: string
}

const Mint = ({ contracts, address }: Props) => {
  const toast = useToast()
  const [txProgression, setTxProgression] = useState<TxProgression>()
  const [destination, setDestination] = useState(address)
  const { smokeBond, supportTicket, gardenTicket } = contracts

  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h2">
        Mint tokens
      </Heading>

      <FormControl my="5">
        <FormLabel>Mint to:</FormLabel>
        <InputGroup>
          <Input
            focusBorderColor={
              destination.length === 42 ? "green.500" : "red.500"
            }
            onChange={(e) => setDestination(e.target.value)}
            value={destination}
            bg="white"
          />
          <InputRightElement width="4.5rem">
            <Button
              isDisabled={destination === address}
              colorScheme="green"
              size="sm"
              onClick={() => setDestination(address)}
            >
              me
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      {smokeBond && supportTicket && gardenTicket && (
        <>
          <Button onClick={() => console.log(toast)}>log</Button>
          <Button
            me="4"
            isLoading={
              txProgression === "Waiting for confirmation" ||
              txProgression === "Pending"
            }
            loadingText={txProgression}
            colorScheme="telegram"
            isDisabled={destination.length !== 42}
            onClick={() =>
              mint(smokeBond, destination, setTxProgression, toast)
            }
          >
            Mint a smoke bond
          </Button>
          <Button
            me="4"
            isLoading={
              txProgression === "Waiting for confirmation" ||
              txProgression === "Pending"
            }
            loadingText={txProgression}
            colorScheme="telegram"
            isDisabled={destination.length !== 42}
            onClick={() =>
              mint(supportTicket, destination, setTxProgression, toast)
            }
          >
            Mint a support ticket
          </Button>
          <Button
            me="4"
            isLoading={
              txProgression === "Waiting for confirmation" ||
              txProgression === "Pending"
            }
            loadingText={txProgression}
            colorScheme="telegram"
            isDisabled={destination.length !== 42}
            onClick={() =>
              mint(gardenTicket, destination, setTxProgression, toast)
            }
          >
            Mint a garden ticket
          </Button>
        </>
      )}
    </>
  )
}

export default Mint
