import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();
const PYTH_ADDRESSES: { [key: string]: string } = {
  mantleTestnet: process.env.PYTH_ADDRESS_TESTNET || "0x98046Bd286715D3B0BC227Dd7a956b83D8978603",
  mantleMainnet: process.env.PYTH_ADDRESS_MAINNET || "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
};

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === "") {
    throw new Error("PRIVATE_KEY is not set in .env file. Please add your private key to the .env file.");
  }

  // Get the network provider
  const network = await ethers.provider.getNetwork();

  // Ensure private key has 0x prefix
  const privateKeyWithPrefix = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

  // Create a wallet/signer from the private key
  const deployer = new ethers.Wallet(privateKeyWithPrefix, ethers.provider);

  console.log("=== Deployment Configuration ===");
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Using private key from .env file");

  // Determine the network name
  let networkName: string;
  if (network.chainId === 5003n) {
    networkName = "mantleTestnet";
  } else if (network.chainId === 5000n) {
    networkName = "mantleMainnet";
  } else {
    // For localhost or other networks, default to testnet address
    networkName = "mantleTestnet";
    console.log("Warning: Unknown network, using testnet Pyth address");
  }

  const pythAddress = PYTH_ADDRESSES[networkName];

  if (!pythAddress || pythAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      `Pyth contract address not found for network: ${networkName}. ` +
      `Please set PYTH_ADDRESS_TESTNET or PYTH_ADDRESS_MAINNET in your .env file, ` +
      `or update the PYTH_ADDRESSES mapping in the deploy script.`
    );
  }

  console.log(`Using Pyth contract address: ${pythAddress}`);

  // Deploy the PythPriceFeedOracle contract using the signer
  const PythPriceFeedOracle = await ethers.getContractFactory("PythPriceFeedOracle", deployer);
  const pythPriceFeedOracle = await PythPriceFeedOracle.deploy(pythAddress);
  await pythPriceFeedOracle.waitForDeployment();

  const contractAddress = await pythPriceFeedOracle.getAddress();

  console.log("\n=== Deployment Successful ===");
  console.log("PythPriceFeedOracle deployed to:", contractAddress);
  console.log("Pyth contract address:", pythAddress);

  // Wait for a few block confirmations before verifying
  console.log("\nWaiting for block confirmations...");
  await pythPriceFeedOracle.deploymentTransaction()?.wait(5);

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", networkName);
  console.log("Pyth Contract Address:", pythAddress);
  console.log("Deployer:", deployer.address);
  console.log("\nTo verify the contract, run:");
  console.log(`npx hardhat verify --network ${networkName} ${contractAddress} ${pythAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

