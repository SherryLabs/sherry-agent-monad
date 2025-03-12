import { encodePacked } from "viem";

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
  