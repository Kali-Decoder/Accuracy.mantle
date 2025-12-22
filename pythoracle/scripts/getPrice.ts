import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Contract address - update this with your deployed contract address
const CONTRACT_ADDRESS = process.env.PYTH_ORACLE_CONTRACT_ADDRESS || "";

async function getPrice(ticker: string) {
  if (!ticker || ticker === "") {
    throw new Error("Please provide a ticker symbol. Example: getPrice('BTC')");
  }

  // Validate that PRIVATE_KEY is set
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === "") {
    throw new Error("PRIVATE_KEY is not set in .env file. Please add your private key to the .env file.");
  }

  // Validate contract address
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
    throw new Error("PYTH_ORACLE_CONTRACT_ADDRESS is not set in .env file. Please add your contract address to the .env file.");
  }

  // Get the network provider
  const network = await ethers.provider.getNetwork();

  // Ensure private key has 0x prefix
  const privateKeyWithPrefix = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

  // Create a wallet/signer from the private key
  const signer = new ethers.Wallet(privateKeyWithPrefix, ethers.provider);

  console.log("=== Get Pyth Price ===");
  console.log("Using account:", signer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Contract address:", CONTRACT_ADDRESS);
  console.log("Ticker:", ticker.toUpperCase());

  // Get the contract instance
  const contract = await ethers.getContractAt("PythPriceFeedOracle", CONTRACT_ADDRESS, signer);

  // First, check if the price feed ID exists for this ticker
  try {
    const priceFeedId = await contract.queryPriceFeedId(ticker.toUpperCase());
    console.log("\nPrice Feed ID:", priceFeedId);
  } catch (error: any) {
    if (error.message && error.message.includes("Price feed not found")) {
      throw new Error(`Price feed not found for ticker: ${ticker.toUpperCase()}. Available tickers: BTC, ETH, SOL, MNT`);
    }
    throw error;
  }

  // Check if price is already cached
  try {
    const [cachedPrice, priceFeedId, price18Decimals] = await contract.queryPriceFeed(ticker.toUpperCase());
    
    if (cachedPrice.price !== 0n) {
      console.log("\n=== Cached Price Found ===");
      console.log("Price (raw):", cachedPrice.price.toString());
      console.log("Exponent:", cachedPrice.expo.toString());
      console.log("Confidence:", cachedPrice.conf.toString());
      console.log("Price (18 decimals):", price18Decimals.toString());
      console.log("Price (formatted):", ethers.formatEther(price18Decimals), "USD");
      console.log("Price Feed ID:", priceFeedId);
      
      // Calculate age (if publishTime is available)
      if (cachedPrice.publishTime) {
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const age = currentTime - cachedPrice.publishTime;
        console.log("Price age:", age.toString(), "seconds");
      }
    }
  } catch (error: any) {
    if (error.message && error.message.includes("Price not cached")) {
      console.log("\n⚠️  No cached price found. Fetching latest price from Pyth...");
    } else {
      console.log("\n⚠️  Could not query cached price:", error.message);
    }
  }

  // Get the latest price (maxAge: 60 seconds)
  console.log("\nFetching latest price from Pyth...");
  const maxAge = 60; // Maximum age of price in seconds
  
  try {
    const tx = await contract.getPrice(ticker.toUpperCase(), maxAge);
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);

    // Query the updated price
    const [price, priceFeedId, price18Decimals] = await contract.queryPriceFeed(ticker.toUpperCase());
    
    console.log("\n=== Latest Price ===");
    console.log("Price (raw):", price.price.toString());
    console.log("Exponent:", price.expo.toString());
    console.log("Confidence:", price.conf.toString());
    console.log("Price (18 decimals):", price18Decimals.toString());
    console.log("Price (formatted):", ethers.formatEther(price18Decimals), "USD");
    console.log("Price Feed ID:", priceFeedId);
    
    if (price.publishTime) {
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const age = currentTime - price.publishTime;
      console.log("Publish time:", price.publishTime.toString());
      console.log("Price age:", age.toString(), "seconds");
    }

    // Also get price in 18 decimals format directly
    console.log("\n=== Alternative: Get Price 18 Decimals ===");
    const price18DecimalsDirect = await contract.getPrice18Decimals(ticker.toUpperCase(), maxAge);
    console.log("Price (18 decimals, direct):", price18DecimalsDirect.toString());
    console.log("Price (formatted, direct):", ethers.formatEther(price18DecimalsDirect), "USD");

  } catch (error: any) {
    console.error("\n❌ Error fetching price:", error.message);
    
    if (error.message && error.message.includes("stale price")) {
      console.log("\nThe price from Pyth is too old. You may need to update the price feeds first.");
      console.log("To update price feeds, you need to:");
      console.log("1. Get the latest price update data from Pyth API");
      console.log("2. Call updateAndMint() or updatePriceFeeds() with the update data");
    }
    
    throw error;
  }
}

async function main() {
  // Get ticker from command line arguments or use default
  const ticker = process.argv[2] || "BTC"; // Default to BTC if not provided
  
  await getPrice(ticker);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

