import { mint } from "@/lib/contractInteraction"
import { Contracts } from "@/lib/tokenInventory"
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react"
import { useState } from "react"

type Props = {
  contracts: Contracts
  address: string
}

const Mint = ({ contracts, address }: Props) => {
  const [destination, setDestination] = useState(address)
  const { smokeBond, supportTicket, gardenTicket } = contracts

  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h2">
        Minting tokens
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
          <Button
            me="4"
            colorScheme="telegram"
            isDisabled={destination.length !== 42}
            onClick={() => mint(smokeBond, destination)}
          >
            Mint a smoke bond
          </Button>
          <Button
            me="4"
            colorScheme="telegram"
            isDisabled={destination.length !== 42}
            onClick={() => mint(supportTicket, destination)}
          >
            Mint a support ticket
          </Button>
          <Button
            me="4"
            colorScheme="telegram"
            isDisabled={destination.length !== 42}
            onClick={() => mint(gardenTicket, destination)}
          >
            Mint a garden ticket
          </Button>
        </>
      )}
    </>
  )
}

export default Mint
