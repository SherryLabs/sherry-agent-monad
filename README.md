# Sherry Nomad Agent

## Overview
Sheriza AI - Monad Agent is an AI-powered agent for cryptocurrency and blockchain operations on the Monad blockchain. The agent can help users deploy custom ERC-20 tokens using TokenMill and perform other blockchain-related tasks.

## Features

### Token Deployment with TokenMill
- Create and deploy custom ERC-20 tokens on the Monad blockchain
- Configure token parameters such as name, symbol.
- Automatic metadata generation and hosting
- Integration with Supabase for application tracking

## Environment Variables
The following environment variables need to be configured:

```
# Blockchain Configuration
EVM_PRIVATE_KEY=your_private_key
TM_FACTORY_ADDRESS=token_mill_factory_address
WMONAD_ADDRESS=wrapped_monad_address

# Database Configuration (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
SMALL_ANTHROPIC_MODEL=claude-3-haiku-20240307
MEDIUM_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
LARGE_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Twitter Account Configuration
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_twitter_email
TWITTER_2FA_SECRET=your_twitter_2fa_secret
```

## Available Actions

### CREATE_TOKEN
Allows users to deploy a custom ERC-20 token with the following parameters:
- Name: The name of the token
- Symbol: The token symbol (ticker)
- Total Supply: The total number of tokens to create
- Decimals: The number of decimal places (default: 18)
- Creator Share: Percentage allocated to the creator (default: 5%)
- Staking Share: Percentage allocated to staking rewards (default: 5%)

Example usage:
```
"Create an ERC-20 token called 'DenverCoin' with symbol 'DEN' and a supply of 1,000,000"
```

## Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/SherryLabs/sherry-agent-monad
cd sherry-agent-monad
```

2. Install dependencies
```bash
pnpm install
```

3. Configure environment variables
Create a `.env` file in the root directory and add the required environment variables.

4. Start the agent
```bash
pnpm start --character='characters/sherry-agent.character.json'
```

## Technical Architecture

The agent is built on the ElizaOS framework and uses:
- Viem for blockchain interactions
- Supabase for data storage
- Monad testnet for token deployment

## Future Enhancements
- Token swapping functionality
- Portfolio management
- Multi-chain support

## Wormhole Implementation

In this project, we utilized [Wormhole](https://wormhole.com/docs/) to enable cross-chain transactions between the Monad and Avalanche networks. We deployed the [sender](https://github.com/SherryLabs/sherry-contracts/blob/dev/monad-hackathon/contracts/wormhole/SL1MessageSender.sol) contract on Monad, which initiates the transaction, and the [receiver](https://github.com/SherryLabs/sherry-contracts/blob/dev/monad-hackathon/contracts/wormhole/SL1MessageReceiver.sol) contract on Avalanche, which processes the incoming transaction. This setup allows us to seamlessly transfer data and assets across these two blockchain ecosystems.
You can find the deployed sender contract on Monad [here](https://github.com/SherryLabs/sherry-contracts/blob/dev/monad-hackathon/contracts/wormhole/SL1MessageSender.sol). The contract address is also available on the [Monad explorer](https://testnet.monadexplorer.com/address/0xa3CA6021b432a88EEFb5b53B31833e19195b4ecB). This implementation demonstrates how Wormhole can be leveraged for efficient and secure cross-chain communication. Further details about the contract deployment and transaction flow can be explored in the provided links.


## Privy Implementation

For this hackathon project, we integrated Privy to enhance user authentication and wallet management. Our application, named [Sherry Playground](https://app.sherry.social/home), leverages Privy to provide a streamlined and secure user experience. You can access and test the application here: [Sherry Playground](https://app.sherry.social/home).

Currently, Sherry Playground is in the testing phase, and we are actively working on integrating server wallets to expand its functionality. This feature will allow users to manage their wallets directly through the application, improving accessibility and usability. Stay tuned for updates as we continue to refine and enhance this integration.


