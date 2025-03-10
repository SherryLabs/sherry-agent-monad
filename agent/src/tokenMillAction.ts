import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import { parseAbi, encodeAbiParameters, createWalletClient, createClient } from 'viem';
import { handleTokenParameters, formatTokenDetails, TokenParameters } from "./utils/tokenUtils";

//const walletClient = createWalletClient();

export const createTokenAndMarketAction: Action = {
    name: "CREATE_TOKEN",
    similes: ["DEPLOY_TOKEN", "CREATE_ERC20"],
    description: "Create and deploy a new ERC-20 token with TokenMill",

    validate: async (_agent: IAgentRuntime, _memory: Memory, _state?: State) => {
        // Extract token parameters from user message
        const tokenParams = handleTokenParameters(_memory.content.text);
        
        if (!tokenParams) return false;

        if (_state) {
            _state.tokenParams = tokenParams;
            return true;
        }
        return false;
    },

    handler: async (_agent: IAgentRuntime, _memory: Memory, _state?: State, _options?: any, _callback?: HandlerCallback) => {
        if (!_callback) throw new Error("Callback is required");
        
        // Get the token parameters, explicitly handle the null case
        let tokenParams: TokenParameters | null = null;
        
        if (_state?.tokenParams) {
            tokenParams = _state.tokenParams as TokenParameters;
        } else {
            tokenParams = handleTokenParameters(_memory.content.text);
        }
        
        // Check if tokenParams is null or undefined
        if (!tokenParams) {
            _callback({ text: "❌ Unable to extract token parameters from your request. Please provide details like name, symbol, and supply." });
            return false;
        }

        // Environment variables
        const privateKey = process.env.EVM_PRIVATE_KEY;
        const TMFactoryAddress = process.env.TM_FACTORY_ADDRESS || '0x501ee2D4AA611C906F785e10cC868e145183FCE4'; // Default to Monad Testnet
        const WMONAD = process.env.WMONAD_ADDRESS || '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701';

        if (!privateKey || !TMFactoryAddress || !WMONAD) {
            _callback({ text: "⚠️ Missing environment variables. Please check the configuration." });
            return false;
        }

        try {
            _callback({ text: "🚀 Starting token creation process with TokenMill..." });

            // Initialize blockchain service for token deployment
            const { name, symbol, totalSupply, decimals, creatorShare, stakingShare } = tokenParams;
            
            _callback({ text: `📝 Preparing token with name: ${name}, symbol: ${symbol}, supply: ${totalSupply}` });

            // Prepare token parameters
            const parameters = {
                tokenType: 1n, // ERC20
                name: name,
                symbol: symbol,
                quoteToken: WMONAD as `0x${string}`,
                totalSupply: BigInt(totalSupply) * BigInt(10 ** decimals),
                creatorShare: creatorShare * 100, // Convert percentage to BPS
                stakingShare: stakingShare * 100, // Convert percentage to BPS
                bidPrices: [0n, 9800000000000000n, 9900000000000000n],
                askPrices: [0n, 9900000000000000n, 10000000000000000n],
                args: encodeAbiParameters([{ type: 'uint256' }], [BigInt(decimals)]),
            };

            _callback({ text: "🔄 Deploying token to blockchain..." });

            try {
                // In a real implementation, you would integrate with Hardhat or another library
                // to deploy the token. This is a simplified placeholder.
                const result = await deployToken(TMFactoryAddress, parameters);
                
                _callback({ 
                    text: `✅ Token deployed successfully!\n\n` + 
                          `📋 Token Details:\n` +
                          `- Name: ${name}\n` +
                          `- Symbol: ${symbol}\n` +
                          `- Contract: ${result.tokenAddress}\n` +
                          `- Market: ${result.marketAddress}\n\n` +
                          `You can now interact with your token using the mini-app at: https://tokenmill.xyz/tokens/${result.tokenAddress}`
                });
                return true;
            } catch (error: any) {
                elizaLogger.error("Token Deployment Error:", error);
                _callback({ text: `❌ Failed to deploy token: ${error.message || error}` });
                return false;
            }
        } catch (error: any) {
            elizaLogger.error("Token Creation Error:", error);
            _callback({ text: "❌ An error occurred while creating the token." });
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Can you create an ERC-20 token for me called 'DenverCoin' with symbol 'DEN' and total supply of 1,000,000?" }
            },
            {
                user: "{{agentName}}",
                content: { text: "I'll create that token for you right away!", action: "CREATE_TOKEN" }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Help me deploy a new token with 18 decimals, name 'MyAwesomeToken', symbol 'MAT' and 10 million total supply" }
            },
            {
                user: "{{agentName}}",
                content: { text: "Starting your token deployment now!", action: "CREATE_TOKEN" }
            }
        ]
    ]
};

async function deployToken(factoryAddress: string, parameters: any): Promise<{tokenAddress: string, marketAddress: string}> {
    try {

        // Get wallet client and public client from hardhat
        const [walletClient] = await createClient;
        const publicClient = await hre.viem.getPublicClient();
        
        // TokenMill factory ABI for the createMarketAndToken function
        const abi = parseAbi([
            'function createMarketAndToken((uint96 tokenType, string name, string symbol, address quoteToken, uint256 totalSupply, uint16 creatorShare, uint16 stakingShare, uint256[] bidPrices, uint256[] askPrices, bytes args) parameters) external returns (address baseToken, address market)'
        ]);
        
        // Validate price arrays
        if (parameters.bidPrices.length !== parameters.askPrices.length || 
            parameters.bidPrices.length < 2 || 
            parameters.bidPrices.length > 101) {
            throw new Error('Price arrays have invalid length.');
        }
        
        elizaLogger.info('Simulating createMarketAndToken to get expected return values...');
        
        // First simulate the contract call to get the return values
        const { result, request } = await publicClient.simulateContract({
            address: factoryAddress as `0x${string}`,
            abi,
            functionName: 'createMarketAndToken',
            args: [parameters],
            account: walletClient.account,
        });
        
        // Extract the expected return values from simulation
        const expectedToken = result[0];
        const expectedMarket = result[1];
        
        elizaLogger.info(`Expected Token Address: ${expectedToken}`);
        elizaLogger.info(`Expected Market Address: ${expectedMarket}`);
        
        // Execute the actual transaction
        elizaLogger.info('Executing token deployment transaction...');
        const tx = await walletClient.writeContract(request);
        
        elizaLogger.info(`Transaction sent: ${tx}`);
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        elizaLogger.info(`Transaction confirmed in block ${receipt.blockNumber}`);
        
        return { 
            tokenAddress: expectedToken,
            marketAddress: expectedMarket
        };
    } catch (error: any) {
        elizaLogger.error('Token deployment error:', error);
        if (error.cause) {
            elizaLogger.error('Error details:', error.cause);
        }
        throw new Error(`Failed to deploy token: ${error.message || 'Unknown error'}`);
    }
}

