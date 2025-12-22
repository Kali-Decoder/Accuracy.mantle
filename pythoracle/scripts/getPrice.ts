import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS = process.env.PYTH_ORACLE_CONTRACT_ADDRESS || "0x98046Bd286715D3B0BC227Dd7a956b83D8978603";

async function getPrice(ticker: string) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set in .env file");
  }

  const privateKeyWithPrefix = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const signer = new ethers.Wallet(privateKeyWithPrefix, ethers.provider);
  const contract = await ethers.getContractAt("PythPriceFeedOracle", CONTRACT_ADDRESS, signer);

  const price18Decimals = await contract.read(ticker.toUpperCase());
  
  console.log("Ticker:", ticker.toUpperCase());
  console.log("Price (18 decimals):", price18Decimals.toString());
  console.log("Price (formatted):", ethers.formatEther(price18Decimals), "USD");
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

