import { elizaLogger } from '@elizaos/core'
import { createClient } from '@supabase/supabase-js'
import { Database, Tables, InsertTables, UpdateTables } from './database.types'
import { Application } from '../interface/Applications'
import { createPublicClient, http } from 'viem';
import { monadTestnet } from './monadChain';

const url = process.env.SUPABASE_URL
const apiKey = process.env.SUPABASE_ANON_KEY
const bucketName = process.env.BUCKET_NAME

if (!url || !apiKey || !bucketName) {
    throw new Error('⚠️ Missing environment variables')
}

// Create Supabase client
const supabase = createClient<Database>(url, apiKey)

// Applications table operations
export const applicationsTable = {
    async insert(application: Application) {
        const { data, error } = await supabase
            .from('applications')
            .insert(application)
            .select()
            .single();

        if (error) {
            elizaLogger.error('Error inserting application:', error);
            throw error;
        }

        return data as Tables<'applications'>;
    },
};

export const insertApplication = async (a: Application) => {
    try {
        const data = await applicationsTable.insert(a);
        elizaLogger.info('Application inserted successfully:', data);
        return data;
    } catch (error) {
        console.error('Error in insertApplications:', error);
        throw error;
    }
}

// Upload file using standard upload
export async function uploadFile(fileContent: File | Blob | string, filePath: string) {
    let fileToUpload: File | Blob;

    // Convert string content to a file if needed
    if (typeof fileContent === 'string') {
        fileToUpload = new Blob([fileContent], { type: 'application/json' });
    } else {
        fileToUpload = fileContent;
    }

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, fileToUpload, {
        upsert: true, // Overwrite if file exists
        headers
    });

    if (error) {
        console.error('Error uploading file:', error);
        throw error;
    }

    return data;
}

// Convert metadata to a file and upload it
export async function uploadMetadataAsFile(metadata: string, fileName: string) {
    try {
        // Upload the metadata string directly
        const data = await uploadFile(metadata, fileName);

        // Return the public URL if needed
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

        return {
            data,
            publicUrl: publicUrlData.publicUrl
        };
    } catch (error) {
        console.error('Error in uploadMetadataAsFile:', error);
        throw error;
    }
}

const client = createPublicClient({
    chain: monadTestnet,
    transport: http(process.env.BLOCKCHAIN_RPC_URL),
});

const getDeadline = async () => {
    const block = await client.getBlock({ blockTag: 'latest' });
    return block.timestamp + BigInt(3600);
};

export const generateMetadata = async (tokenName: string, tokenAddress: string, proxyAddress: string) => {
    let metadata = `
    {
        "url": "https://tokenmill.exchange",
        "icon": "https://kfrzkvoejzjkugwosqxx.supabase.co/storage/v1/object/public/images//20250309-195334.png",
        "title": "TokenMill Swap",
        "description": "Swap 0.1 MONAD for ${tokenName} via TokenMill",
        "actions": [
            {
                "label": "Swap 0.1 MONAD for ${tokenName}",
                "address": "${proxyAddress}",
                "abi": [
                    {
                        "name": "swapExactIn",
                        "type": "function",
                        "stateMutability": "payable",
                        "inputs": [
                            {
                                "type": "bytes",
                                "name": "route"
                            },
                            {
                                "type": "address",
                                "name": "recipient"
                            },
                            {
                                "type": "uint256",
                                "name": "amountIn"
                            },
                            {
                                "type": "uint256",
                                "name": "minAmountOut"
                            },
                            {
                                "type": "uint256",
                                "name": "deadline"
                            },
                            {
                                "type": "address",
                                "name": "msgSender"
                            }
                        ],
                        "outputs": [
                            {
                                "type": "uint256"
                            }
                        ]
                    }
                ],
                "functionName": "swapExactIn",
                "chains": {
                    "source": "monad-testnet"
                },
                "amount": 0.1,
                "paramsValue": [
                    "${tokenAddress}",
                    "sender",
                    100000000000000000,
                    0,
                    "${Number(getDeadline().toString())}",
                    "sender"
                ],
                "params": [
                    {
                        "type": "bytes",
                        "name": "route"
                    },
                    {
                        "type": "address",
                        "name": "recipient"
                    },
                    {
                        "type": "uint256",
                        "name": "amountIn"
                    },
                    {
                        "type": "uint256",
                        "name": "minAmountOut"
                    },
                    {
                        "type": "uint256",
                        "name": "deadline"
                    },
                    {
                        "type": "address",
                        "name": "msgSender"
                    }
                ],
                "blockchainActionType": "payable"
            }
        ]
    }
    `
    return metadata;
}

export async function processMetadata(tokenName: string, tokenAddress: string, proxyAddress: string) {
    // Generate metadata JSON string
    const metadata = await generateMetadata(tokenName, tokenAddress, proxyAddress);

    // Get the last 10 characters of the tokenAddress
    const shortTokenAddress = tokenAddress.slice(-10);

    // Upload the metadata as a file to Supabase Storage
    const fileName = `metadata_${shortTokenAddress}.json`;
    const result = await uploadMetadataAsFile(metadata, fileName);

    elizaLogger.info('Metadata uploaded successfully:', result.publicUrl);

    return result.publicUrl;
}
