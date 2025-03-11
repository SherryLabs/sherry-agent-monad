import { elizaLogger } from '@elizaos/core'
import { createClient } from '@supabase/supabase-js'
import { Database, Tables, InsertTables, UpdateTables } from './database.types'

const url = process.env.SUPABASE_URL
const apiKey = process.env.SUPABASE_ANON_KEY
const bucketName = process.env.BUCKET_NAME

if(!url || !apiKey || !bucketName) { 
    throw new Error('⚠️ Missing environment variables')
}

// Create Supabase client
const supabase = createClient<Database>(url, apiKey)

// Applications table operations
export const applicationsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('applications')
      .select('*');
    
    if (error) {
      elizaLogger.error('Error fetching applications:', error);
      throw error;
    }
    
    return data as Tables<'applications'>[];
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id_application', id)
      .single();
    
    if (error) {
      elizaLogger.error(`Error fetching application with ID ${id}:`, error);
      throw error;
    }
    
    return data as Tables<'applications'>;
  },
  
  async insert(application: InsertTables<'applications'>) {
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
  
  async update(id: string, updates: UpdateTables<'applications'>) {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id_application', id)
      .select()
      .single();
    
    if (error) {
      elizaLogger.error(`Error updating application with ID ${id}:`, error);
      throw error;
    }
    
    return data as Tables<'applications'>;
  },
  
  async delete(id: string) {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id_application', id);
    
    if (error) {
      elizaLogger.error(`Error deleting application with ID ${id}:`, error);
      throw error;
    }
    
    return true;
  }
};

// Upload file using standard upload
export async function uploadFile(fileContent: File | Blob | string, filePath: string, bucketName: string = 'bucket_name') {
  let fileToUpload: File | Blob;
  
  // Convert string content to a file if needed
  if (typeof fileContent === 'string') {
    fileToUpload = new Blob([fileContent], { type: 'application/json' });
  } else {
    fileToUpload = fileContent;
  }
  
  const { data, error } = await supabase.storage.from(bucketName).upload(filePath, fileToUpload, {
    upsert: true, // Overwrite if file exists
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
    const data = await uploadFile(metadata, fileName, bucketName);
    
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

export const generateMetadata = async (tokenName: string, tokenAddress: string, ) => { 
    let metadata = `
    {
        "url": "https://tokenmill.exchange",
        "icon": "https://kfrzkvoejzjkugwosqxx.supabase.co/storage/v1/object/public/images//20250309-195334.png",
        "title": "TokenMill Swap",
        "description": "Swap 0.1 MONAD for ${tokenName} via TokenMill",
        "actions": [
            {
                "label": "Swap 0.1 MONAD for ${tokenName}",
                "address": "${tokenAddress}",
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
                    "0x00000000000000000000000000000000000000000300000083828b09e730aea59a83de8cb84b963a9fc604a6",
                    "sender",
                    100000000000000000,
                    0,
                    1741704787,
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

export async function processMetadata(tokenName: string, tokenAddress: string) {    
    // Generate metadata JSON string
    const metadata = await generateMetadata(tokenName, tokenAddress);
    
    // Upload the metadata as a file
    const fileName = `metadata_${tokenAddress}.json`;
    const result = await uploadMetadataAsFile(metadata, fileName);
    
    elizaLogger.info('Metadata uploaded successfully:', result.publicUrl);

    return result.publicUrl;
  }

