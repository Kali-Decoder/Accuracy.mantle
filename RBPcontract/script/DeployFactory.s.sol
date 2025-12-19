// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";

contract DeployFactory is Script {
    uint256 public constant INITIAL_PLATFORM_FEE = 200; // 2% in basis points
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PredictionMarketFactory...");
        console.log("Deployer address:", deployer);
        console.log("Initial platform fee:", INITIAL_PLATFORM_FEE, "basis points (2%)");
        
        vm.startBroadcast(deployerPrivateKey);
        
        PredictionMarketFactory factory = new PredictionMarketFactory(
            deployer,
            INITIAL_PLATFORM_FEE
        );
        
        vm.stopBroadcast();
        
        console.log("Factory deployed at:", address(factory));
        console.log("Factory owner:", factory.owner());
        console.log("Platform fee:", factory.platformFee());
        
        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("Network: %s", vm.envString("NETWORK"));
        console.log("Factory Address: %s", address(factory));
        console.log("Owner: %s", deployer);
        console.log("Platform Fee: %s basis points", factory.platformFee());
    }
}

