import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import { parseAbi, encodeAbiParameters, createWalletClient, createClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts'
import { handleTokenParameters, formatTokenDetails, TokenParameters } from "./utils/tokenUtils";
import { monadTestnet } from "./utils/monadChain";
import { processMetadata, insertApplication } from "./utils/supabase";
import { Application } from "./interface/Applications";
import { encodeSwapRoute } from "./utils/tokenUtils";

// Note:Add Plugin "plugins": ["@elizaos-plugins/client-twitter"],

const SHERRY_URL_PREFIX = 'https://app.sherry.social/action?url='

export const createTokenAndMarketAction: Action = {
    name: "CREATE_TOKEN",
    similes: ["DEPLOY_TOKEN", "CREATE_ERC20"],
    description: "Create and deploy a new ERC-20 token with TokenMill",

    validate: async (_agent: IAgentRuntime, _memory: Memory, _state?: State) => {
        // Extract token parameters from user message - primarily name and symbol
        const tokenParams = handleTokenParameters(_memory.content.text);
        elizaLogger.info("Catching token params")

        if (!tokenParams) return false;

        elizaLogger.info("Token params catched")
        elizaLogger.info(tokenParams)

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
            _callback({ text: "❌ Unable to extract token name from your request. Please provide a name for your token." });
            return false;
        }

        // Environment variables
        const privateKey = process.env.EVM_PRIVATE_KEY;
        const TMFactoryAddress = process.env.TM_FACTORY_ADDRESS;
        const TMProxyAddress = process.env.TM_PROXY_ADDRESS;
        const WMONAD = process.env.WMONAD_ADDRESS;

        if (!privateKey || !TMFactoryAddress || !WMONAD) {
            _callback({ text: "⚠️ Missing environment variables. Please check the configuration." });
            return false;
        }

        try {
            _callback({ text: "🚀 Starting token creation process with TokenMill..." });

            // Initialize token deployment with extracted name and symbol
            // Other parameters are using default values
            const { name, symbol, totalSupply, decimals, creatorShare, stakingShare } = tokenParams;

            try {

                // Prepare token parameters
                const parameters = {
                    tokenType: 1n, // ERC20 as far as I know :p
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

                const result = await deployToken(TMFactoryAddress, parameters);


                elizaLogger.info({
                    text: `✅ Token deployed successfully!\n\n` +
                        `📋 Token Details:\n` +
                        `- Name: ${name}\n` +
                        `- Symbol: ${symbol}\n` +
                        `- Contract: ${result.tokenAddress}\n` +
                        `- Market: ${result.marketAddress}\n\n` +
                        `You can now interact with your token using the mini-app at: https://pandaria.tokenmill.xyz/monad/${result.tokenAddress}`
                });

                const encodedAddress = encodeSwapRoute(result.tokenAddress);
                const urlHostedMetadata = await processMetadata(name, encodedAddress, TMProxyAddress);

                elizaLogger.info(`Metadata hosted successfully - URL : ${urlHostedMetadata}`)

                let app: Application = {
                    api_url: urlHostedMetadata,
                    email: "gilberts@sherry.social",
                    explanation: `Buy Tokens deployed on Token Mill`,
                    name: `Simplify the way users buy tokens`,
                    project_name: "Monad AI Agent",
                    state: "approved",
                    telegram: "@gilbertsahumada",
                    twitter: "@gilbertsahumada",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }

                await insertApplication(app);

                _callback({ text: `✅ Here is the sherry link to sell your token : ${SHERRY_URL_PREFIX}${urlHostedMetadata}` })

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
                content: { text: "Can you create an ERC-20 token for me called 'DenverCoin' with symbol 'DEN'?" }
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

async function deployToken(factoryAddress: string, parameters: any): Promise<{ tokenAddress: string, marketAddress: string }> {
    try {

        const privateKey = process.env.EVM_PRIVATE_KEY;

        if (!privateKey) {
            throw new Error('EVM_PRIVATE_KEY environment variable is missing.');
        }

        // create account from private key
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        // Init wallet client from account
        const walletClient = createWalletClient({
            account,
            chain: monadTestnet,
            transport: http()
        });

        // Init public client
        const publicClient = await createPublicClient({
            chain: monadTestnet,
            transport: http()
        });

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


