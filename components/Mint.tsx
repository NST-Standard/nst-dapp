import { mint, TxProgression } from "@/lib/contractInteraction"
import { Contracts } from "@/lib/contractsUtils"
import {
  Box,
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
  const [tokenId, setTokenId] = useState(0)
  const { catBox, supportTicket, gardenTicket } = contracts

  return (
    <>
      <Heading my="5" fontFamily="monospace" as="h2">
        Mint tokens
      </Heading>

      <FormControl gap="10" display="flex" my="5">
        <Box minW="50%">
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
        </Box>
        <Box>
          <FormLabel>Token ID:</FormLabel>
          <Input
            type="number"
            focusBorderColor={tokenId >= 0 ? "green.500" : "red.500"}
            onChange={(e) => setTokenId(Number(e.target.value))}
            value={tokenId}
            bg="white"
          />
        </Box>
      </FormControl>

      {catBox && supportTicket && gardenTicket && (
        <>
          <Button
            me="4"
            isLoading={
              txProgression === "Waiting for confirmation" ||
              txProgression === "Pending"
            }
            loadingText={txProgression}
            colorScheme="telegram"
            isDisabled={destination.length !== 42 || tokenId < 0}
            onClick={() =>
              mint(catBox, destination, tokenId, setTxProgression, toast)
            }
          >
            Mint a cat box
          </Button>
          <Button
            me="4"
            isLoading={
              txProgression === "Waiting for confirmation" ||
              txProgression === "Pending"
            }
            loadingText={txProgression}
            colorScheme="telegram"
            isDisabled={destination.length !== 42 || tokenId < 0}
            onClick={() =>
              mint(supportTicket, destination, tokenId, setTxProgression, toast)
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
            isDisabled={destination.length !== 42 || tokenId < 0}
            onClick={() =>
              mint(gardenTicket, destination, tokenId, setTxProgression, toast)
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
