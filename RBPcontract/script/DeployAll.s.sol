// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

/**
 * @title DeployAll
 * @notice Deploys both Factory and an example Market in one script
 */
contract DeployAll is Script {
    uint256 public constant INITIAL_PLATFORM_FEE = 200; // 2%
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Deploying Prediction Market System ===");
        console.log("Deployer:", deployer);
        console.log("Network:", vm.envString("NETWORK"));
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy Factory
        console.log("\n[1/2] Deploying PredictionMarketFactory...");
        PredictionMarketFactory factory = new PredictionMarketFactory(
            deployer,
            INITIAL_PLATFORM_FEE
        );
        console.log("Factory deployed at:", address(factory));
        
        // Step 2: Create example market
        console.log("\n[2/2] Creating example prediction market...");
        
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 30 days;
        
        address marketAddress = factory.createMarket(
            "Bitcoin Price Prediction",
            "Predict the Bitcoin price on December 31, 2024",
            "https://example.com/bitcoin.png",
            "Bitcoin Price (USD)",
            "Crypto",
            startTime,
            endTime,
            30000,  // min: $30,000
            100000, // max: $100,000
            1000,   // step: $1,000
            50000   // initial: $50,000
        );
        
        vm.stopBroadcast();
        
        // Summary
        console.log("\n=== Deployment Complete ===");
        console.log("Factory Address:", address(factory));
        console.log("Market Address:", marketAddress);
        console.log("Market ID: 0");
        console.log("Total Markets:", factory.getMarketCount());
        
        // Get market info
        PredictionMarket market = PredictionMarket(payable(marketAddress));
        (
            string memory name,
            ,
            ,
            string memory parameter,
            string memory category,
            ,
            ,
            ,
            ,
            ,
            ,
            PredictionMarket.MarketStatus status,
            ,
            ,
            
        ) = market.getMarketInfo();
        
        console.log("\n=== Example Market ===");
        console.log("Name:", name);
        console.log("Parameter:", parameter);
        console.log("Category:", category);
        console.log("Status:", _statusToString(status));
    }
    
    function _statusToString(PredictionMarket.MarketStatus status) 
        internal 
        pure 
        returns (string memory) 
    {
        if (status == PredictionMarket.MarketStatus.Pending) return "Pending";
        if (status == PredictionMarket.MarketStatus.Active) return "Active";
        if (status == PredictionMarket.MarketStatus.Resolved) return "Resolved";
        if (status == PredictionMarket.MarketStatus.Cancelled) return "Cancelled";
        return "Unknown";
    }
}

