"use client";

import { useState, useRef, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalance, useDisconnect } from "wagmi";
import { Copy, LogOut, ExternalLink, ChevronDown, Wallet, AlertTriangle } from "lucide-react";
import { formatEther } from "viem";
import { mantleTestnet } from "@/app/config/chains";
import { useToastContext } from "@/app/contexts/ToastContext";

export function WalletConnect() {
  const { disconnect } = useDisconnect();
  const { showSuccess } = useToastContext();
  
  // Local UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Address copied");
    setIsDropdownOpen(false);
  };

  const viewOnExplorer = (address: string) => {
    window.open(`https://sepolia.mantlescan.xyz/address/${address}`, "_blank");
    setIsDropdownOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  // Inner component to use wagmi hooks conditionally
  const ConnectedWalletButton = ({ 
    account, 
    chain, 
    openChainModal,
    betHash
  }: { 
    account: any; 
    chain: any; 
    openChainModal: () => void;
    betHash?: string;
  }) => {
    // Get balance using wagmi hook - can be called here since component is only rendered when connected
    const { data: balance } = useBalance({
      address: account?.address as `0x${string}` | undefined,
    });

    // Check if wallet is connected to the correct chain
    const isCorrectChain = chain?.id === mantleTestnet.id;

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
        >
          {/* Balance */}
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 font-mono">
              {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : account.displayBalance || "0.0000"}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {balance?.symbol || "MNT"}
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10" />

          {/* Address */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-monad-purple flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {account.address?.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-mono text-white hidden sm:inline">
              {account.displayName || formatAddress(account.address)}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
            {/* Account Info */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Connected</div>
                {!isCorrectChain && (
                  <div className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Wrong Chain</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-monad-purple flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {account.address?.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-mono text-white truncate">{account.address}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {balance 
                      ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` 
                      : account.displayBalance || "0.0000 MNT"}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2">
              {!isCorrectChain && (
                <button
                  onClick={openChainModal}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-yellow-400 hover:bg-yellow-400/10 transition-colors mb-2 border border-yellow-500/30"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Switch to Mantle Sepolia Testnet</span>
                </button>
              )}
              <button
                onClick={() => account.address && copyToClipboard(account.address)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
              >
                <Copy className="h-4 w-4 text-gray-400" />
                <span>Copy Address</span>
              </button>
              <button
              
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span><a href={`https://sepolia.mantlescan.xyz/address/0x5E6658ac6cBC9b0109C28BED00bC4Af0F0A3f1CD`} target="_blank" rel="noopener noreferrer">View on Explorer</a></span>
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        // Check if wallet is connected to the correct chain
        const isCorrectChain = chain?.id === mantleTestnet.id;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              // Not connected - show custom connect button
              if (!connected) {
                return (
                  <div className="relative">
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-monad-purple text-white font-medium text-sm transition-all hover:shadow-[0_0_20px_-5px_rgba(135,109,255,0.5)] hover:scale-105"
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="hidden sm:inline">Connect Wallet</span>
                      <span className="sm:hidden">Connect</span>
                    </button>
                  </div>
                );
              }

              // Wrong network - show custom chain switch button
              if (chain.unsupported || !isCorrectChain) {
                return (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-yellow-500/50 bg-yellow-500/10 text-yellow-500 font-medium text-sm transition-all hover:bg-yellow-500/20"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span className="hidden sm:inline">Wrong Network</span>
                      <span className="sm:hidden">Wrong Net</span>
                    </button>
                    
                    {/* Chain Warning Banner */}
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-yellow-500/50 bg-yellow-500/10 backdrop-blur-xl p-3 mb-2 z-50">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-yellow-500 mb-1">Wrong Network</div>
                          <div className="text-xs text-yellow-400/80 mb-2">
                            Please switch to Mantle Sepolia Testnet to continue.
                          </div>
                          <button
                            onClick={openChainModal}
                            className="w-full px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 text-xs font-medium transition-colors"
                          >
                            Switch Network
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Connected - show custom connected button with dropdown
              return (
                <ConnectedWalletButton 
                  account={account} 
                  chain={chain} 
                  openChainModal={openChainModal}
                />
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

