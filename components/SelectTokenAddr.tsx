import {
  Collection,
  getContractAddress,
  getContractName,
  TokensName,
} from "@/lib/contractsUtils"
import { BarterTerms, Message, MultiBarterTerms } from "@/lib/signatureUtils"
import { FormLabel, Select } from "@chakra-ui/react"
import { Dispatch, SetStateAction } from "react"

type Props = {
  barterTerms: BarterTerms
  multiBarterTerms: MultiBarterTerms
  setBarterTerms: Dispatch<SetStateAction<BarterTerms>>
  setMultiBarterTerms: Dispatch<SetStateAction<MultiBarterTerms>>
  message: Message
  barterComponant: "bid" | "ask"
  collectionList: Collection[]
}

const SelectTokenAddr = ({
  barterTerms,
  multiBarterTerms,
  setBarterTerms,
  setMultiBarterTerms,
  message,
  barterComponant,
  collectionList,
}: Props) => {
  return (
    <>
      <FormLabel>Token to give:</FormLabel>
      <Select
        placeholder="Token name"
        bg="white"
        onChange={(e) =>
          message.multiBarter
            ? setMultiBarterTerms((b) => {
                return {
                  ...b,
                  [barterComponant]: {
                    tokenAddr: e.target.value,
                    tokenIds: [],
                  },
                }
              })
            : setBarterTerms((b) => {
                return {
                  ...b,
                  [barterComponant]: { tokenAddr: e.target.value },
                }
              })
        }
        value={
          message.multiBarter
            ? multiBarterTerms[barterComponant].tokenAddr
            : barterTerms[barterComponant].tokenAddr
        }
      >
        {collectionList.map((nst) => {
          if (nst.tokens.length) {
            return (
              <option
                disabled={
                  message.multiBarter &&
                  getContractName(nst.tokens[0].address) === "Cat Box"
                }
                key={nst.metadata.tokenName}
                value={getContractAddress(nst.metadata.tokenName as TokensName)}
              >
                {getContractName(nst.tokens[0].address)}
              </option>
            )
          }
        })}
      </Select>
    </>
  )
}

export default SelectTokenAddr
