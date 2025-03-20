import NonFungibleToken from 0x631e88ae7f1d7c20
import UFC_NFT from 0xd049c2e1e3ec47da

/// This transaction allows any account to mint an NFT without admin privileges
/// by using the public minting function in the UFC_NFT contract
/// 
/// seriesId: 1 - "UFC Series #1"
/// setId: 1 - "UFC Fight Moments"

transaction(recipientAddress: Address, tokenId: UInt64, seriesId: UInt32, setId: UInt32) {
    prepare(signer: auth(Storage) &Account) {
        // Get the recipient's collection reference
        let recipient = getAccount(recipientAddress)
            .capabilities
            .get<&{NonFungibleToken.CollectionPublic}>(UFC_NFT.CollectionPublicPath)
            .borrow() ?? panic("Could not borrow recipient's collection")
            
        // Call the public mint function on the UFC_NFT contract
        UFC_NFT.publicMintNFT(
            recipient: recipient,
            tokenId: tokenId,
            seriesId: seriesId,
            setId: setId
        )
    }

    execute {
        log("Successfully minted an NFT and delivered it to the recipient's collection")
        log("Using series ID: ".concat(seriesId.toString()).concat(", set ID: ").concat(setId.toString()))
    }
}