# Copyright 2021 - 2023 Transflox LLC. All rights reserved.

hash() {
  echo $(echo "$1" | tr -d '\n' | base64)
}

export ENV=$(hash production)
export NAMESPACE_RAW=production

export PRODUCTION=$(hash true)

# host
export MONGODB_URL=$(hash "mongodb://localhost:27017")

export START_CRON=$(hash "true")
export BALUE_LISTEN=$(hash "true")

export DB__BALUE=$(hash "balue")
export DB__BALUE__COLLECTION=$(hash "balue__nft")

export RPC_HTTP=$(hash "https://mainnet.base.org")
export RPC_WSS=$(hash "wss://mainnet.base.org")

export NFT_CONTRACT_ADDRESS=$(hash "")

export IPFS_API_KEY=$(hash "")
export IPFS_API_KEY_SECRET=$(hash "")
export IPFS_API_ENDPOINT=$(hash "https://ipfs.infura.io:5001")

export NFT_STORAGE_KEY=$(hash "")

export ROOT_CID=$(hash "")

export FILES_DIR=$(hash "")
export TEMPLATE_DIR=$(hash "")

export AWS_ID=$(hash "")
export AWS_KEY=$(hash "")

export S3_BUCKET=$(hash "")


# gen
envsubst < ./secrets.template.yml > gen.secrets-${NAMESPACE_RAW}.yml
