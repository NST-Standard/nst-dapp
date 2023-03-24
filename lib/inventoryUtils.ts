import { Dispatch, SetStateAction } from "react"
import { Collection, Contracts, fetchToken } from "./contractsUtils"

export const syncInventory = async (
  { catBox, supportTicket, gardenTicket }: Contracts,
  address: string | undefined,
  setInventory: Dispatch<SetStateAction<Collection[]>>
) => {
  if (catBox && supportTicket && gardenTicket && address) {
    const inventory: Collection[] = []
    inventory.push(await fetchToken(supportTicket, address))
    inventory.push(await fetchToken(gardenTicket, address))
    inventory.push(await fetchToken(catBox, address))
    setInventory(inventory)
  }
}
