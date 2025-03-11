import { Chain } from "viem/chains"

export enum ChainName {
    AVALANCHE = "avalanche",
    FUJI = "fuji",
    MONAD_TESTNET = "monad-testnet",
}

export const monadTestnet: Chain = {
    id: 10143,
    name: ChainName.MONAD_TESTNET,
    rpcUrls: {
        default: {
            http: ["https://testnet-rpc.monad.xyz/"],
        },
        public: {
            http: ["https://testnet-rpc.monad.xyz/"],
        },
    },
    blockExplorers: {
        default: {
            name: "MonadExplorer",
            url: "https://testnet.monadexplorer.com/",
        },
    },
    nativeCurrency: {
        name: "Testnet Monad",
        symbol: "MON",
        decimals: 18,
    },
};