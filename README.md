# Sherry Nomad Agent

## Overview
Sherry Nomad Agent is an AI-powered agent for cryptocurrency and blockchain operations on the Monad blockchain. The agent can help users deploy custom ERC-20 tokens using TokenMill and perform other blockchain-related tasks.

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
git clone https://github.com/yourusername/sherry-nomad-agent.git
cd sherry-nomad-agent
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
