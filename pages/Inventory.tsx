import { Event as EtherEvent } from "ethers"
import { Box, Card, CardBody, Heading, Spinner, Text } from "@chakra-ui/react"
import { Collection, contractName } from "@/lib/tokenInventory"
import Image from "next/image"

type Props = {
  inventory: Collection[]
}

const Inventory = ({ inventory }: Props) => {
  return (
    <>
      <Heading py="5" as="h2" fontFamily="monospace">
        {"User's NSTs balance"}
      </Heading>
      {!inventory.length && <Spinner />}
      <Box display="flex" gap="5">
        {inventory.map((nst: Collection) => {
          return nst.tokens.map((token: EtherEvent) => {
            if (token.args) {
              return (
                <Card maxW="20%" key={token.address + token.args[2].toNumber()}>
                  <CardBody display="flex" flexDirection="column">
                    <Text fontSize="1rem" fontWeight="bold">
                      {contractName(token.address)}
                    </Text>
                    {nst.metadata.image.startsWith("Failed") ? (
                      <>
                        <Text>{nst.metadata.image}</Text>
                      </>
                    ) : (
                      <>
                        <Image
                          alt={nst.metadata.description}
                          src={nst.metadata.image}
                          width="200"
                          height="200"
                        />
                      </>
                    )}
                    {token.args ? (
                      <Text fontWeight="bold" mt="auto">
                        TokenId: {token.args[2].toNumber()}
                      </Text>
                    ) : (
                      ""
                    )}
                  </CardBody>
                </Card>
              )
            }
          })
        })}
      </Box>
    </>
  )
}

export default Inventory
