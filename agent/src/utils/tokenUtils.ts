import { elizaLogger } from "@elizaos/core";
import { State } from "@elizaos/core";
import { encodePacked } from "viem";

/**
 * Token parameter interface
 */
export interface TokenParameters {
  name: string;
  symbol: string;
  // The following parameters will use default values
  totalSupply: number; // Default will be used
  decimals: number;    // Default will be used
  creatorShare: number; // Default will be used
  stakingShare: number; // Default will be used
}

// Extend the State type to include tokenParams
declare module "@elizaos/core" {
  interface State {
    tokenParams?: TokenParameters;
  }
}

/**
 * Extract token parameters from user message with enhanced pattern matching
 * Focus primarily on name and symbol as these are the parameters provided in chat
 * @param text User message text
 * @returns TokenParameters object or null if required parameters can't be extracted
 */
export function handleTokenParameters(text: string): TokenParameters | null {
  if (!text || typeof text !== 'string') {
    elizaLogger.error("Invalid input text for token parameter extraction");
    return null;
  }

  try {
    // Name extraction with multiple patterns - primary focus
    const nameMatch = text.match(/called ['"](.*?)['"]|name ['"](.*?)['"]|named ['"](.*?)['"]/) || 
                     text.match(/name[:]?\s+['"](.*?)['"]/) || 
                     text.match(/token\s+['"](.*?)['"]/) ||
                     text.match(/called\s+(\w+)/) ||
                     text.match(/name[:]?\s+(\w+)/) ||
                     text.match(/create\s+(\w+)/) ||
                     text.match(/deploy\s+(\w+)/);
    
    // Symbol extraction - primary focus
    const symbolMatch = text.match(/symbol ['"](.*?)['"]|symbol[:]?\s+['"](.*?)['"]/) || 
                       text.match(/symbol[:]?\s+(\w+)/) ||
                       text.match(/ticker[:]?\s+(\w+)/) ||
                       text.match(/ticker ['"](.*?)['"]|ticker[:]?\s+['"](.*?)['"]/) ||
                       text.match(/with\s+symbol\s+['"](.*?)['"]/) ||
                       text.match(/with\s+symbol\s+(\w+)/);
    
    // We'll only check for name and symbol as they're the primary chat parameters
    if (!nameMatch) {
      elizaLogger.debug("Token parameter extraction failed: No token name found");
      return null;
    }

    // Extract the first captured group that isn't undefined
    const name = (
      nameMatch?.[1] || 
      nameMatch?.[2] || 
      nameMatch?.[3] || 
      'MyToken' // Default token name
    ).trim();
    
    const symbol = (
      symbolMatch?.[1] || 
      symbolMatch?.[2] || 
      name.substring(0, 3).toUpperCase()
    ).trim();
    
    // Comment out unused parameter extraction
    /* 
    // Total supply extraction with optional comma formatting
    const supplyMatch = text.match(/supply\s+of\s+([0-9,.]+)/) || 
                       text.match(/supply[:]?\s+([0-9,.]+)/) ||
                       text.match(/([0-9,.]+)\s+total\s+supply/) ||
                       text.match(/([0-9,.]+)\s+tokens/);
    
    // Decimals extraction
    const decimalsMatch = text.match(/([0-9]+)\s+decimals/) ||
                         text.match(/decimals[:]?\s+([0-9]+)/);
    
    // Creator share extraction (percentage)
    const creatorShareMatch = text.match(/creator\s+share\s+(\d+)%/) ||
                             text.match(/creator\s+share[:]?\s+(\d+)/) ||
                             text.match(/creator[:]?\s+(\d+)%/);
    
    // Staking share extraction (percentage)
    const stakingShareMatch = text.match(/staking\s+share\s+(\d+)%/) ||
                             text.match(/staking\s+share[:]?\s+(\d+)/) ||
                             text.match(/staking[:]?\s+(\d+)%/);
    */
    
    // Use default values for the parameters that are not extracted from chat
    const totalSupply = 1000000;  // Default 1 million
    const decimals = 18;          // Default 18 decimals (standard)
    const creatorShare = 40;      // Default 40%
    const stakingShare = 40;      // Default 40%
    
    // Validate and return the token parameters
    return {
      name,
      symbol,
      totalSupply,
      decimals,
      creatorShare,
      stakingShare
    };
  } catch (error) {
    elizaLogger.error("Error extracting token parameters:", error);
    return null;
  }
}

/**
 * Format token details for display
 * @param params Token parameters
 * @returns Formatted string for display
 */
export function formatTokenDetails(params: TokenParameters): string {
  return `📋 Token Details:
- Name: ${params.name}
- Symbol: ${params.symbol}
- Total Supply: ${params.totalSupply.toLocaleString()}
- Decimals: ${params.decimals}
- Creator Share: ${params.creatorShare}%
- Staking Share: ${params.stakingShare}%`;
}

/**
 * Encodes a route for token swaps using the same logic as el script original
 * @param targetToken The address of the token to swap to
 * @returns Encoded route bytes
 */
export function encodeSwapRoute(targetToken: string): `0x${string}` {
    // Usar exactamente la misma lógica de encoding que el script
    return encodePacked(
      ["address", "uint32", "address"],
      [
        "0x0000000000000000000000000000000000000000", // address(0) for native token
        50331648, // uint32((3 << 24) | (0 << 16) | 0)
        targetToken as `0x${string}`, // The token you want to receive
      ]
    );
  }
  