// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract DeployMarket is Script {
    string public constant MARKET_NAME = "How much price will HYPER hit till this pool ends ?";
    string public constant MARKET_DESCRIPTION = "Predict the HYPER Coin price on range based prediction";
    string public constant IMAGE_URL = "https://s2.coinmarketcap.com/static/img/coins/64x64/32196.png";
    string public constant PARAMETER = "HYPE";
    string public constant CATEGORY = "Coins";
    
    uint256 public constant MIN_VALUE = 1; // $30,000
    uint256 public constant MAX_VALUE = 20; // $100,000
    uint256 public constant STEP = 1; // $1,000 increments
    uint256 public constant INITIAL_VALUE = 12; // $50,000
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get factory address from environment or use a default
        address factoryAddress = vm.envOr("FACTORY_ADDRESS", address(0));
        
        if (factoryAddress == address(0)) {
            console.log("Error: FACTORY_ADDRESS not set in environment");
            console.log("Please set FACTORY_ADDRESS or deploy factory first using DeployFactory.s.sol");
            revert("Factory address required");
        }
        
        PredictionMarketFactory factory = PredictionMarketFactory(factoryAddress);
        
        // Calculate market timing
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 5 days; // 30 days from now
        
        console.log("Creating new prediction market...");
        console.log("Factory address:", factoryAddress);
        console.log("Market name:", MARKET_NAME);
        console.log("Parameter:", PARAMETER);
        console.log("Value range: $%s - $%s", MIN_VALUE, MAX_VALUE);
        console.log("Step size: $%s", STEP);
        console.log("Initial value: $%s", INITIAL_VALUE);
        console.log("Start time:", startTime);
        console.log("End time:", endTime);
        
        vm.startBroadcast(deployerPrivateKey);
        
        address marketAddress = factory.createMarket(
            MARKET_NAME,
            MARKET_DESCRIPTION,
            IMAGE_URL,
            PARAMETER,
            CATEGORY,
            startTime,
            endTime,
            MIN_VALUE,
            MAX_VALUE,
            STEP,
            INITIAL_VALUE
        );
        
        vm.stopBroadcast();
        
        PredictionMarket market = PredictionMarket(payable(marketAddress));
        
        console.log("\n=== Market Created Successfully ===");
        console.log("Market Address:", marketAddress);
        console.log("Market ID:", factory.getMarketCount() - 1);
        console.log("Status: Pending");
        console.log("Total Markets:", factory.getMarketCount());
        
        // Verify market details
        (
            string memory name,
            string memory parameter,
            string memory category,
            uint256 _startTime,
            uint256 _endTime,
            uint256 _minValue,
            uint256 _maxValue,
            uint256 _step,
            uint256 _initialValue
        ) = _getMarketDetails(market);
        
        console.log("\n=== Market Details ===");
        console.log("Name:", name);
        console.log("Parameter:", parameter);
        console.log("Category:", category);
        console.log("Min Value:", _minValue);
        console.log("Max Value:", _maxValue);
        console.log("Step:", _step);
        console.log("Initial Value:", _initialValue);
        console.log("Start Time:", _startTime);
        console.log("End Time:", _endTime);
    }
    
    function _getMarketDetails(PredictionMarket market) 
        internal 
        view 
        returns (
            string memory name,
            string memory parameter,
            string memory category,
            uint256 startTime,
            uint256 endTime,
            uint256 minValue,
            uint256 maxValue,
            uint256 step,
            uint256 initialValue
        ) 
    {
        (
            name,
            ,
            ,
            parameter,
            category,
            startTime,
            endTime,
            minValue,
            maxValue,
            step,
            initialValue,
            , // status
            , // totalVolume
            , // totalParticipants
             // finalValue
        ) = market.getMarketInfo();
    }
}

