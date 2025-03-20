import * as fcl from "@onflow/fcl";

fcl.config()
  .put("accessNode.api", "https://rest-testnet.onflow.org")
  .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
  .put("walletconnect.projectId", "ed985cc17afb5c8bce2c688f2735191d");