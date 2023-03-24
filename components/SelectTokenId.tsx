import {
  Collection,
  getContractAddress,
  TokensName,
} from "@/lib/contractsUtils"
import { BarterTerms } from "@/lib/signatureUtils"
import { FormLabel, Select } from "@chakra-ui/react"
import { Dispatch, SetStateAction } from "react"

type Props = {
  barterTerms: BarterTerms
  setBarterTerms: Dispatch<SetStateAction<BarterTerms>>
  barterComponant: "bid" | "ask"
  tokenList: Collection[]
}

const SelectTokenId = ({
  barterComponant,
  barterTerms,
  setBarterTerms,
  tokenList,
}: Props) => {
  return (
    <>
      <FormLabel>Token id:</FormLabel>
      <Select
        placeholder="Token ID"
        bg="white"
        onChange={(e) =>
          setBarterTerms((b) => {
            return {
              ...b,
              [barterComponant]: {
                ...b[barterComponant],
                tokenId: Number(e.target.value),
              },
            }
          })
        }
        value={barterTerms[barterComponant].tokenId}
      >
        {tokenList
          .find((a) => {
            return (
              getContractAddress(a.metadata.tokenName as TokensName) ===
              barterTerms[barterComponant].tokenAddr
            )
          })
          ?.tokens.map((token) => {
            if (token.args) {
              return (
                <option key={token.args[2]} value={token.args[2].toNumber()}>
                  N°{token.args[2].toNumber()}
                </option>
              )
            }
          })}
      </Select>
    </>
  )
}

export default SelectTokenId
