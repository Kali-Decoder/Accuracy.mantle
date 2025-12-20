# Accuracy.Fun

A decentralized range-based prediction market platform built on Mantle blockchain. Move beyond binary predictions—bet on ranges and earn rewards proportional to your accuracy.

## 🎯 Overview

Accuracy.Fun revolutionizes prediction markets by introducing **range-based betting** instead of traditional binary outcomes. Users predict within a range, and rewards scale with precision—small losses when close, big wins when accurate. That's how accuracy works.

### Key Features

- **Range-Based Betting**: Predict within a range instead of exact values
- **Proportional Rewards**: Earn more when your prediction is more accurate
- **Fair Distribution**: Transparent reward system that scales with prediction precision
- **Multi-Market Support**: Bet on cryptocurrencies, social media metrics, and more
- **Real-Time Updates**: Track market status, volume, and participant counts
- **Wallet Integration**: Connect via RainbowKit with support for multiple wallets

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Blockchain**: Viem 2.x, Wagmi 2.x
- **Wallet**: RainbowKit 2.x
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React

### Blockchain
- **Network**: Mantle Sepolia Testnet & Mantle Mainnet
- **Smart Contracts**: Solidity (Foundry)
- **Contract Architecture**: Factory pattern for market creation

## 📋 Prerequisites

- Node.js 18+ (or pnpm/yarn/bun)
- pnpm (recommended) or npm/yarn
- A wallet with Mantle testnet tokens (for testing)

## 🛠️ Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Accuracy/Accuracy.Fun
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
# or
yarn install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Mantle RPC URL (Testnet)
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz

# Contract Addresses (update with your deployed contracts)
NEXT_PUBLIC_FACTORY_ADDRESS=0x...

# Chain ID (5003 for Mantle Sepolia Testnet, 5000 for Mantle Mainnet)
NEXT_PUBLIC_CHAIN_ID=5003
```

### Development

Run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
pnpm build
# or
npm run build
```

Start production server:

```bash
pnpm start
# or
npm start
```

## 📁 Project Structure

```
Accuracy.Fun/
├── app/
│   ├── api/                 # API routes
│   ├── components/          # React components
│   │   ├── MarketCard.tsx   # Market display card
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── WalletConnect.tsx # Wallet connection UI
│   │   └── ...
│   ├── config/              # Configuration files
│   │   ├── abi_config.ts    # Contract ABIs
│   │   ├── addresses.ts     # Contract addresses
│   │   └── chains.ts        # Chain configurations
│   ├── contexts/            # React contexts
│   │   └── ToastContext.tsx # Toast notifications
│   ├── hooks/               # Custom React hooks
│   │   ├── usePredictionMarket.ts
│   │   ├── usePredictionMarketFactory.ts
│   │   └── ...
│   ├── lib/                 # Utility libraries
│   │   └── viem/            # Viem client setup
│   ├── markets/             # Market pages
│   │   ├── page.tsx         # Markets listing
│   │   └── [slug]/          # Individual market page
│   ├── rewards/             # Rewards page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── providers.tsx        # App providers
│   └── RainbowKitWrapper.tsx # RainbowKit setup
├── public/                   # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

## 🔗 Smart Contracts

This frontend interacts with Solidity smart contracts deployed on Mantle:

- **PredictionMarketFactory**: Creates and manages prediction markets
- **PredictionMarket**: Individual market contracts with range-based betting logic

See the [`RBPcontract`](../RBPcontract/) directory for contract source code, deployment scripts, and documentation.

### Key Contract Functions

- `createMarket()`: Create a new prediction market
- `placeBet(predictedValue)`: Place a bet with your predicted value
- `resolveMarket(finalValue)`: Resolve market with final value (admin only)
- `claimReward()`: Claim your reward after market resolution
- `getAllBets()`: Get all bets in a market
- `getUserBet(address)`: Get a specific user's bet

## 🎮 Usage

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Switch Network**: Ensure you're on Mantle Sepolia Testnet (Chain ID: 5003)
3. **Browse Markets**: Explore available prediction markets
4. **Place Bet**: Select a market, choose your prediction range, and place a bet
5. **Claim Rewards**: After market resolution, claim your proportional reward

### For Developers

#### Using Hooks

```typescript
import { usePredictionMarket } from '@/app/hooks/usePredictionMarket';

function MarketComponent({ marketAddress }: { marketAddress: Address }) {
  const { placeBet, claimReward, userBet, allBets } = usePredictionMarket(marketAddress);
  
  // Place a bet
  const handleBet = async () => {
    await placeBet.placeBet(BigInt(50000)); // Predicted value
  };
  
  // Claim reward
  const handleClaim = async () => {
    await claimReward.claimReward();
  };
}
```

#### Creating Markets

Markets are created through the factory contract. See the [contract documentation](../RBPcontract/README.md) for details.

## 🎨 Features in Detail

### Range-Based Rewards

Unlike binary markets, Accuracy.Fun uses an inverse divergence algorithm:
- Predictions closer to the final value receive higher rewards
- Rewards are distributed proportionally based on accuracy
- Small losses when close, big wins when precise

### Market States

- **Pending**: Market created but not yet active
- **Active**: Market is live and accepting bets
- **Resolved**: Market has been resolved, rewards can be claimed
- **Cancelled**: Market cancelled, bets refunded

### Supported Markets

- Cryptocurrency prices (Bitcoin, Ethereum, Altcoins)
- Social media metrics (YouTube, Twitter, Instagram, Farcaster)
- Custom parameters with configurable ranges

## 🧪 Testing

The platform is currently deployed on Mantle Sepolia Testnet. To test:

1. Get testnet tokens from Mantle faucet
2. Connect your wallet to Mantle Sepolia Testnet (Chain ID: 5003)
3. Create or participate in test markets

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
pnpm build
pnpm start
```

## 📚 Documentation

- [Smart Contracts Documentation](../RBPcontract/README.md)
- [Deployment Guide](../RBPcontract/DEPLOYMENT.md)
- [Market Resolution Guide](../RBPcontract/HOW_TO_RESOLVE_MARKETS.md)

## 🔮 Future Scope

- Betting for specific posts
- PolyMarket Integration
- Limitless Bets
- Hybrid Betting Options
- Additional market types

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Add your license here]

## 🔗 Links

- [Mantle Network](https://www.mantle.xyz/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

## 💬 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ for accurate predictions**
