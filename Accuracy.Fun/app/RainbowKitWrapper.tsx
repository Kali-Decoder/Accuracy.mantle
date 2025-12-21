"use client";

import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { mantleTestnet } from "./config/chains";
import type { ReactNode } from "react";

const config = getDefaultConfig({
  appName: "Accuracy",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [mantleTestnet],
  transports: {
    [mantleTestnet.id]: http(process.env.NEXT_PUBLIC_MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz"),
  },
});

export function RainbowKitWrapper({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#876dff",
          accentColorForeground: "white",
          borderRadius: "large",
          fontStack: "system",
          overlayBlur: "small",
        })}
        initialChain={mantleTestnet}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}

