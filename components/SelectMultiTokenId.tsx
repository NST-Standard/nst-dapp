import {
  Collection,
  getContractAddress,
  TokensName,
} from "@/lib/contractsUtils"
import { MultiBarterTerms } from "@/lib/signatureUtils"
import { Button, Flex, Text } from "@chakra-ui/react"
import { Dispatch, SetStateAction } from "react"

type Props = {
  multiBarterTerms: MultiBarterTerms
  setMultiBarterTerms: Dispatch<SetStateAction<MultiBarterTerms>>
  barterComponant: "bid" | "ask"
  tokenList: Collection[]
}

const SelectMultiTokenAddr = ({
  multiBarterTerms,
  setMultiBarterTerms,
  barterComponant,
  tokenList,
}: Props) => {
  return (
    <>
      <Flex my="4" gap="1" wrap="wrap">
        {tokenList
          .find((a) => {
            return (
              getContractAddress(a.metadata.tokenName as TokensName) ===
              multiBarterTerms[barterComponant].tokenAddr
            )
          })
          ?.tokens.map((token) => {
            if (!token.args) return
            return (
              <Button
                onClick={() =>
                  setMultiBarterTerms((b) => {
                    if (!token.args) return b
                    return {
                      ...b,
                      [barterComponant]: {
                        ...b[barterComponant],
                        tokenIds: [
                          ...b[barterComponant].tokenIds,
                          token.args[2].toNumber(),
                        ],
                      },
                    }
                  })
                }
                key={token.args[2]}
                isDisabled={multiBarterTerms[barterComponant].tokenIds.includes(
                  token.args[2].toNumber()
                )}
              >
                {token.args[2].toNumber()}
              </Button>
            )
          })}
      </Flex>
      <Text>Selected token Ids:</Text>
      <Flex my="4" gap="1" wrap="wrap">
        {multiBarterTerms[barterComponant].tokenIds.map((ids) => {
          return (
            <Button
              onClick={() =>
                setMultiBarterTerms((b) => {
                  return {
                    ...b,
                    [barterComponant]: {
                      ...b[barterComponant],
                      tokenIds: b[barterComponant].tokenIds.filter(
                        (id) => id !== ids
                      ),
                    },
                  }
                })
              }
              key={ids}
            >
              {ids}
            </Button>
          )
        })}
      </Flex>
    </>
  )
}

export default SelectMultiTokenAddr
