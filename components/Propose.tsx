import { Collection, Contracts } from "@/lib/contractsUtils"
import {
  BarterTerms,
  defaultBarterTerms,
  defaultMultiBarterTerms,
  Message,
  MultiBarterTerms,
} from "@/lib/signatureUtils"
import {
  Box,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Switch,
  useToast,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import SelectMultiTokenAddr from "./SelectMultiTokenId"
import SelectTokenAddr from "./SelectTokenAddr"
import SelectTokenId from "./SelectTokenId"
import Sign from "./Sign"

type Props = {
  inventory: Collection[]
  totalSupply: Collection[]
  address: string
  contracts: Contracts
}

const Propose = ({ inventory, totalSupply, address, contracts }: Props) => {
  const [notOwnedSupply, setNotOwnedSupply] = useState<Collection[]>([])

  const [barterTerms, setBarterTerms] =
    useState<BarterTerms>(defaultBarterTerms)
  const [multiBarterTerms, setMultiBarterTerms] = useState<MultiBarterTerms>(
    defaultMultiBarterTerms
  )
  const [message, setMessage] = useState<Message>({
    multiBarter: false,
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

  return (
    <>
      <Box display="flex">
        <Heading minW="20rem" my="5" fontFamily="monospace" as="h2">
          Select token{message.multiBarter ? "s" : ""}
        </Heading>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="multi" mb="0">
            Multi barter
          </FormLabel>
          <Switch
            onChange={() =>
              setMessage((m) => {
                return {
                  ...m,
                  multiBarter: !m.multiBarter,
                }
              })
            }
            colorScheme="teal"
            id="multi"
          />
        </FormControl>
      </Box>

      <Box justifyContent="space-between" display="flex">
        {/* TOKEN TO GIVE */}
        <FormControl maxW="35%">
          <SelectTokenAddr
            multiBarterTerms={multiBarterTerms}
            setMultiBarterTerms={setMultiBarterTerms}
            barterTerms={barterTerms}
            setBarterTerms={setBarterTerms}
            collectionList={inventory}
            message={message}
            barterComponant="bid"
          />
          {message.multiBarter ? (
            <SelectMultiTokenAddr
              multiBarterTerms={multiBarterTerms}
              setMultiBarterTerms={setMultiBarterTerms}
              tokenList={inventory}
              barterComponant="bid"
            />
          ) : (
            <SelectTokenId
              barterTerms={barterTerms}
              setBarterTerms={setBarterTerms}
              tokenList={inventory}
              barterComponant="bid"
            />
          )}
        </FormControl>

        {/* TOKEN TO ASK */}
        <FormControl maxW="35%">
          <SelectTokenAddr
            multiBarterTerms={multiBarterTerms}
            setMultiBarterTerms={setMultiBarterTerms}
            barterTerms={barterTerms}
            setBarterTerms={setBarterTerms}
            collectionList={notOwnedSupply}
            message={message}
            barterComponant="ask"
          />
          {message.multiBarter ? (
            <SelectMultiTokenAddr
              multiBarterTerms={multiBarterTerms}
              setMultiBarterTerms={setMultiBarterTerms}
              tokenList={notOwnedSupply}
              barterComponant="ask"
            />
          ) : (
            <SelectTokenId
              barterTerms={barterTerms}
              setBarterTerms={setBarterTerms}
              tokenList={notOwnedSupply}
              barterComponant="ask"
            />
          )}
        </FormControl>
      </Box>

      <Divider borderColor="black" mt="5" />

      <Sign
        address={address}
        contracts={contracts}
        message={message}
        setMessage={setMessage}
        barterTerms={barterTerms}
        multiBarterTerms={multiBarterTerms}
      />
    </>
  )
}

export default Propose
