import NonFungibleToken from 0x631e88ae7f1d7c20
import UFC_NFT from 0xd049c2e1e3ec47da

access(all) fun main(account: Address): [UInt64] {
    let accountRef = getAccount(account)
    
    // Get capability using capabilities controller 
    let capability = accountRef.capabilities.get<&{NonFungibleToken.CollectionPublic}>(
        UFC_NFT.CollectionPublicPath
    )
    
    // Borrow the capability
    let collectionRef = capability.borrow()
        ?? panic("Could not borrow capability")

    return collectionRef.getIDs()
}