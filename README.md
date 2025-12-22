# Accuracy.mantle

A decentralized range-based prediction market platform. Move beyond binary predictions—bet on ranges and earn rewards proportional to your accuracy.

## 🎯 Overview

Accuracy.mantle revolutionizes prediction markets by introducing **range-based betting** instead of traditional binary outcomes. Users predict within a range, and rewards scale with precision—small losses when close, big wins when accurate. That's how accuracy works.

### Key Features

- **Range-Based Betting**: Predict within a range instead of exact values
- **Proportional Rewards**: Earn more when your prediction is more accurate
- **Fair Distribution**: Transparent reward system that scales with prediction precision
- **Multi-Market Support**: Bet on cryptocurrencies, social media metrics, and more
- **Real-Time Updates**: Track market status, volume, and participant counts
- **Wallet Integration**: Connect via RainbowKit with support for multiple wallets

## 📁 Project Structure

This repository contains two main components:

```
Accuracy.mantle/
├── Accuracy.Fun/          # Frontend Next.js application
│   ├── app/               # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── components/   # React components
│   │   ├── config/       # Configuration files
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   ├── markets/      # Market pages
│   │   └── rewards/      # Rewards page
│   ├── public/           # Static assets
│   └── package.json
│
└── RBPcontract/          # Smart contracts (Foundry)
    ├── src/              # Solidity source files
    │   ├── PredictionMarket.sol
    │   └── PredictionMarketFactory.sol
    ├── script/           # Deployment scripts
    ├── test/             # Test files
    └── foundry.toml      # Foundry configuration
```

## 🚀 Tech Stack

### Frontend (Accuracy.Fun)
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Blockchain**: Viem 2.x, Wagmi 2.x
- **Wallet**: RainbowKit 2.x
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React

### Smart Contracts (RBPcontract)
- **Framework**: Foundry
- **Language**: Solidity
- **Architecture**: Factory pattern for market creation
- **Testing**: Forge test suite

## 📋 Prerequisites

- Node.js 18+ (or pnpm/yarn/bun)
- pnpm (recommended) or npm/yarn
- Foundry (for smart contract development)
- A wallet with testnet tokens (for testing)

### Installing Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Accuracy.mantle
```

### 2. Frontend Setup (Accuracy.Fun)

Navigate to the frontend directory:

```bash
cd Accuracy.Fun
```

Install dependencies:

```bash
pnpm install
# or
npm install
# or
yarn install
```

#### Environment Variables

Create a `.env.local` file in the `Accuracy.Fun` directory:

```env
# Mantle RPC URL
NEXT_PUBLIC_MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz

# Contract Addresses (update with your deployed contracts)
NEXT_PUBLIC_FACTORY_ADDRESS=0x...

# Chain ID (5003 for Mantle Sepolia Testnet, 5000 for Mantle Mainnet)
NEXT_PUBLIC_CHAIN_ID=5003
```

#### Development

Run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Build

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

### 3. Smart Contracts Setup (RBPcontract)

Navigate to the contracts directory:

```bash
cd RBPcontract
```

#### Build Contracts

```bash
forge build
```

#### Run Tests

```bash
forge test
```

The test suite includes:
- **PredictionMarketTest**: 32 tests
- **PredictionMarketFactoryTest**: 22 tests

#### Deploy Contracts

Deploy the factory contract:

```bash
forge script script/DeployFactory.s.sol --rpc-url <your_rpc_url> --private-key <your_private_key> --broadcast
```

Deploy all contracts:

```bash
forge script script/DeployAll.s.sol --rpc-url <your_rpc_url> --private-key <your_private_key> --broadcast
```

For detailed deployment instructions, see [RBPcontract/DEPLOYMENT.md](./RBPcontract/DEPLOYMENT.md).

## 🔗 Smart Contracts

The platform uses Solidity smart contracts with a factory pattern:

- **PredictionMarketFactory**: Creates and manages prediction markets
- **PredictionMarket**: Individual market contracts with range-based betting logic

### Key Contract Functions

- `createMarket()`: Create a new prediction market
- `placeBet(predictedValue)`: Place a bet with your predicted value
- `resolveMarket(finalValue)`: Resolve market with final value (admin only)
- `claimReward()`: Claim your reward after market resolution
- `getAllBets()`: Get all bets in a market
- `getUserBet(address)`: Get a specific user's bet

For detailed contract documentation, see [RBPcontract/README.md](./RBPcontract/README.md).

## 🎮 Usage

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Switch Network**: Ensure you're on the correct network (configured in chains.ts)
3. **Browse Markets**: Explore available prediction markets
4. **Place Bet**: Select a market, choose your prediction range, and place a bet
5. **Claim Rewards**: After market resolution, claim your proportional reward

### For Developers

#### Using Frontend Hooks

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

Markets are created through the factory contract. See the [contract documentation](./RBPcontract/README.md) for details.

## 🎨 Features in Detail

### Range-Based Rewards

Unlike binary markets, Accuracy uses an inverse divergence algorithm:
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

### Frontend Testing

The frontend is configured for development and can be tested locally:

1. Get testnet tokens from the appropriate faucet
2. Connect your wallet to the testnet
3. Create or participate in test markets

### Smart Contract Testing

Run the comprehensive test suite:

```bash
cd RBPcontract
forge test
```

All tests should pass:
- PredictionMarketTest: 32 passed
- PredictionMarketFactoryTest: 22 passed

## 🚢 Deployment

### Frontend Deployment

#### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set the root directory to `Accuracy.Fun`
4. Add environment variables
5. Deploy

#### Manual Deployment

```bash
cd Accuracy.Fun
pnpm build
pnpm start
```

### Smart Contract Deployment

See [RBPcontract/DEPLOYMENT.md](./RBPcontract/DEPLOYMENT.md) for detailed deployment instructions.

## 📚 Documentation

- [Frontend README](./Accuracy.Fun/README.md) - Detailed frontend documentation
- [Smart Contracts README](./RBPcontract/README.md) - Contract documentation
- [Deployment Guide](./RBPcontract/DEPLOYMENT.md) - Deployment instructions
- [Market Resolution Guide](./RBPcontract/HOW_TO_RESOLVE_MARKETS.md) - How to resolve markets

## 🔮 Future Scope

- Betting for specific posts
- PolyMarket Integration
- Limitless Bets
- Hybrid Betting Options
- Additional market types
- Multi-chain support

