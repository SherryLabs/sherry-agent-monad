import { elizaLogger } from "@elizaos/core";
import { State } from "@elizaos/core";

/**
 * Token parameter interface
 */
export interface TokenParameters {
  name: string;
  symbol: string;
  totalSupply: number;
  decimals: number;
  creatorShare: number;
  stakingShare: number;
}

// Extend the State type to include tokenParams
declare module "@elizaos/core" {
  interface State {
    tokenParams?: TokenParameters;
  }
}

/**
 * Extract token parameters from user message with enhanced pattern matching
 * @param text User message text
 * @returns TokenParameters object or null if required parameters can't be extracted
 */
export function handleTokenParameters(text: string): TokenParameters | null {
  if (!text || typeof text !== 'string') {
    elizaLogger.error("Invalid input text for token parameter extraction");
    return null;
  }

  try {
    // Name extraction with multiple patterns
    const nameMatch = text.match(/called ['"](.*?)['"]|name ['"](.*?)['"]|named ['"](.*?)['"]/) || 
                     text.match(/name[:]?\s+['"](.*?)['"]/) || 
                     text.match(/token\s+['"](.*?)['"]/) ||
                     text.match(/called\s+(\w+)/) ||
                     text.match(/name[:]?\s+(\w+)/);
    
    // Symbol extraction
    const symbolMatch = text.match(/symbol ['"](.*?)['"]|symbol[:]?\s+['"](.*?)['"]/) || 
                       text.match(/symbol[:]?\s+(\w+)/) ||
                       text.match(/ticker[:]?\s+(\w+)/) ||
                       text.match(/ticker ['"](.*?)['"]|ticker[:]?\s+['"](.*?)['"]/) ||
                       text.match(/with\s+symbol\s+['"](.*?)['"]/) ||
                       text.match(/with\s+symbol\s+(\w+)/);
    
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

    if (!nameMatch && !symbolMatch && !supplyMatch) {
      elizaLogger.debug("Token parameter extraction failed: insufficient parameters");
      return null;
    }

    // Extract the first captured group that isn't undefined
    const name = (
      nameMatch?.[1] || 
      nameMatch?.[2] || 
      nameMatch?.[3] || 
      'MyToken'
    ).trim();
    
    const symbol = (
      symbolMatch?.[1] || 
      symbolMatch?.[2] || 
      name.substring(0, 3).toUpperCase()
    ).trim();
    
    const supplyStr = (supplyMatch?.[1] || '1000000').replace(/,/g, '');
    
    // Ensure all numeric values are properly parsed
    let totalSupply: number;
    try {
      totalSupply = parseFloat(supplyStr);
    } catch (e) {
      totalSupply = 1000000; // Default if parsing fails
    }

    let decimals: number;
    try {
      decimals = parseInt((decimalsMatch?.[1] || '18').trim(), 10);
    } catch (e) {
      decimals = 18; // Default if parsing fails
    }

    let creatorShare: number;
    try {
      creatorShare = parseInt((creatorShareMatch?.[1] || '40').trim(), 10);
    } catch (e) {
      creatorShare = 40; // Default if parsing fails
    }

    let stakingShare: number;
    try {
      stakingShare = parseInt((stakingShareMatch?.[1] || '40').trim(), 10);
    } catch (e) {
      stakingShare = 40; // Default if parsing fails
    }
    
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
