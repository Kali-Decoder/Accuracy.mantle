"use client";

import Link from "next/link";
import { Search } from "lucide-react";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WalletConnect } from "./WalletConnect";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 gap-4">
        
        {/* 1. Left: Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-monad-purple shadow-[0_0_15px_-3px_rgba(135,109,255,0.4)]"></div>
          <span className="text-xl font-bold tracking-tight text-white">
            <span className="text-monad-purple">Accuracy</span><span className="text-white">.Fun</span>
          </span>
        </Link>

        {/* 2. Center: Search Bar (Visible on larger screens, matches Image 1) */}
        <div className="hidden md:flex flex-1 max-w-md items-center relative group">
          <Search className="absolute left-3 h-4 w-4 text-gray-500 group-focus-within:text-monad-purple transition-colors" />
          <input 
            type="text" 
            placeholder="Search for creators, pools, metrics..." 
            className="h-10 w-full rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-monad-purple/50 focus:bg-white/10 focus:ring-1 focus:ring-monad-purple/50"
          />
          <div className="absolute right-3 hidden lg:flex items-center gap-1">
             <kbd className="hidden rounded border border-white/10 bg-black/20 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline-block">
               /
             </kbd>
          </div>
        </div>

        {/* 3. Right: Navigation & Connect */}
        <div className="flex items-center gap-6 shrink-0">
          
          {/* Nav Links (Matches Image 1 layout) */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-400">
            <Link href="/markets" className="hover:text-white transition-colors flex items-center gap-2">
              Markets
            </Link>
            <Link href="/rewards" className="hover:text-white transition-colors flex items-center gap-2">
              Reward Procedure
            </Link>
          </div>

          {/* Divider */}
          <div className="hidden lg:block h-4 w-px bg-white/10"></div>
          
          {/* RainbowKit Wallet Connect */}
          {/* <ConnectButton /> */}
          
          {/* Custom Wallet Connect - Commented out */}
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}