import { defineChain } from "viem";

export const mantleTestnet = defineChain({
  id: 5003,
  name: "Mantle Sepolia Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: { 
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz"] 
    },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://sepolia.mantlescan.xyz/" },
  },
  testnet: true,
});

export const mantleMainnet = defineChain({
  id: 5000,
  name: "Mantle",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: { 
      http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || "https://rpc.mantle.xyz"] 
    },
  },
  blockExplorers: {
    default: { name: "Mantle Explorer", url: "https://mantlescan.xyz/" },
  },
  testnet: false,
});
