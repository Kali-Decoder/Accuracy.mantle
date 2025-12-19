// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PredictionMarketFactory} from "../src/PredictionMarketFactory.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract PredictionMarketFactoryTest is Test {
    PredictionMarketFactory public factory;
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant INITIAL_PLATFORM_FEE = 200; // 2%
    
    event MarketCreated(
        address indexed marketAddress,
        string name,
        string category,
        uint256 indexed marketId
    );
    event PlatformFeeUpdated(uint256 newFee);
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        factory = new PredictionMarketFactory(owner, INITIAL_PLATFORM_FEE);
    }
    
    // ============================================
    // CONSTRUCTOR TESTS
    // ============================================
    
    function test_Constructor_SetsCorrectValues() public view {
        assertEq(factory.owner(), owner);
        assertEq(factory.platformFee(), INITIAL_PLATFORM_FEE);
        assertEq(factory.getMarketCount(), 0);
    }
    
    function test_Constructor_RevertsInvalidOwner() public {
        vm.expectRevert();
        new PredictionMarketFactory(address(0), INITIAL_PLATFORM_FEE);
    }
    
    function test_Constructor_RevertsFeeTooHigh() public {
        vm.expectRevert("Factory: Fee too high");
        new PredictionMarketFactory(owner, 1001); // > 10%
    }
    
    // ============================================
    // CREATE MARKET TESTS
    // ============================================
    
    function test_CreateMarket_Success() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        address marketAddress = factory.createMarket(
            "Bitcoin Price",
            "Predict BTC price",
            "https://example.com/btc.png",
            "Bitcoin Price",
            "Crypto",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        assertTrue(marketAddress != address(0));
        assertEq(factory.getMarketCount(), 1);
        assertEq(factory.getMarket(0), marketAddress);
        assertTrue(factory.isValidMarket(marketAddress));
    }
    
    function test_CreateMarket_EmitsEvent() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        // Check event emission - only check name, category, and index (not address)
        vm.expectEmit(false, false, true, true);
        emit MarketCreated(
            address(0), // Don't check address
            "Bitcoin Price",
            "Crypto",
            0
        );
        
        address marketAddress = factory.createMarket(
            "Bitcoin Price",
            "Predict BTC price",
            "",
            "Bitcoin Price",
            "Crypto",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        assertTrue(marketAddress != address(0));
    }
    
    function test_CreateMarket_MultipleMarkets() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        address market1 = factory.createMarket(
            "Market 1",
            "Description 1",
            "",
            "Param 1",
            "Category 1",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        address market2 = factory.createMarket(
            "Market 2",
            "Description 2",
            "",
            "Param 2",
            "Category 2",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        assertEq(factory.getMarketCount(), 2);
        assertTrue(market1 != market2);
        assertTrue(factory.isValidMarket(market1));
        assertTrue(factory.isValidMarket(market2));
    }
    
    function test_CreateMarket_RevertsNonOwner() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        vm.expectRevert();
        vm.prank(user1);
        factory.createMarket(
            "Bitcoin Price",
            "Description",
            "",
            "Bitcoin Price",
            "Crypto",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
    }
    
    function test_CreateMarket_RevertsInvalidTimeRange() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        vm.expectRevert("Factory: Invalid time range");
        factory.createMarket(
            "Bitcoin Price",
            "Description",
            "",
            "Bitcoin Price",
            "Crypto",
            endTime, // Invalid: end before start
            startTime,
            0,
            100,
            10,
            50
        );
    }
    
    function test_CreateMarket_RevertsEndTimeInPast() public {
        // Create a scenario where endTime is in the past
        // We need to warp to a future time first, then try to create market with past endTime
        vm.warp(block.timestamp + 10 days);
        
        // Now try to create market with endTime in the past relative to current block.timestamp
        uint256 startTime = block.timestamp - 2 days;
        uint256 endTime = block.timestamp - 1 days;
        
        vm.expectRevert("Factory: End time must be future");
        factory.createMarket(
            "Bitcoin Price",
            "Description",
            "",
            "Bitcoin Price",
            "Crypto",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
    }
    
    function test_CreateMarket_RevertsEmptyName() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        vm.expectRevert("Factory: Name required");
        factory.createMarket(
            "", // Empty name
            "Description",
            "",
            "Bitcoin Price",
            "Crypto",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
    }
    
    function test_CreateMarket_RevertsEmptyParameter() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        vm.expectRevert("Factory: Parameter required");
        factory.createMarket(
            "Bitcoin Price",
            "Description",
            "",
            "", // Empty parameter
            "Crypto",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
    }
    
    // ============================================
    // SET PLATFORM FEE TESTS
    // ============================================
    
    function test_SetPlatformFee_Success() public {
        uint256 newFee = 300; // 3%
        
        factory.setPlatformFee(newFee);
        
        assertEq(factory.platformFee(), newFee);
    }
    
    function test_SetPlatformFee_EmitsEvent() public {
        uint256 newFee = 300;
        
        vm.expectEmit(true, false, false, false);
        emit PlatformFeeUpdated(newFee);
        
        factory.setPlatformFee(newFee);
    }
    
    function test_SetPlatformFee_RevertsFeeTooHigh() public {
        vm.expectRevert("Factory: Fee too high");
        factory.setPlatformFee(1001); // > 10%
    }
    
    function test_SetPlatformFee_RevertsNonOwner() public {
        vm.expectRevert();
        vm.prank(user1);
        factory.setPlatformFee(300);
    }
    
    // ============================================
    // VIEW FUNCTION TESTS
    // ============================================
    
    function test_GetAllMarkets() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        address market1 = factory.createMarket(
            "Market 1",
            "Description",
            "",
            "Param",
            "Category",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        address market2 = factory.createMarket(
            "Market 2",
            "Description",
            "",
            "Param",
            "Category",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        address[] memory markets = factory.getAllMarkets();
        assertEq(markets.length, 2);
        assertEq(markets[0], market1);
        assertEq(markets[1], market2);
    }
    
    function test_GetMarketsByStatus() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        address market1 = factory.createMarket(
            "Market 1",
            "Description",
            "",
            "Param",
            "Category",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        address market2 = factory.createMarket(
            "Market 2",
            "Description",
            "",
            "Param",
            "Category",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        // Both should be pending
        address[] memory pendingMarkets = factory.getMarketsByStatus(0);
        assertEq(pendingMarkets.length, 2);
        
        // Activate first market
        vm.warp(startTime + 1);
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        PredictionMarket(payable(market1)).placeBet{value: 1 ether}(50);
        
        // Check active markets
        address[] memory activeMarkets = factory.getMarketsByStatus(1);
        assertEq(activeMarkets.length, 1);
        assertEq(activeMarkets[0], market1);
        
        // Check pending markets
        pendingMarkets = factory.getMarketsByStatus(0);
        assertEq(pendingMarkets.length, 1);
        assertEq(pendingMarkets[0], market2);
    }
    
    function test_GetMarketInfo() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        address marketAddress = factory.createMarket(
            "Bitcoin Price",
            "Predict BTC price",
            "https://example.com/btc.png",
            "Bitcoin Price",
            "Crypto",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        (
            string memory name,
            string memory description,
            ,
            string memory parameter,
            string memory category,
            uint256 _startTime,
            uint256 _endTime,
            ,
            ,
            ,
            ,
            PredictionMarket.MarketStatus status,
            ,
            ,
            
        ) = factory.getMarketInfo(marketAddress);
        
        assertEq(name, "Bitcoin Price");
        assertEq(parameter, "Bitcoin Price");
        assertEq(category, "Crypto");
        assertEq(_startTime, startTime);
        assertEq(_endTime, endTime);
        assertEq(uint8(status), 0); // Pending
    }
    
    function test_IsValidMarket() public {
        uint256 startTime = block.timestamp + 1 days;
        uint256 endTime = block.timestamp + 7 days;
        
        address marketAddress = factory.createMarket(
            "Market",
            "Description",
            "",
            "Param",
            "Category",
            startTime,
            endTime,
            0,
            100,
            10,
            50
        );
        
        assertTrue(factory.isValidMarket(marketAddress));
        assertFalse(factory.isValidMarket(address(0x999)));
    }
    
    function test_GetMarket_RevertsInvalidIndex() public {
        vm.expectRevert("Factory: Index out of bounds");
        factory.getMarket(0);
    }
    
    function test_GetMarketsByStatus_RevertsInvalidStatus() public {
        vm.expectRevert("Factory: Invalid status");
        factory.getMarketsByStatus(4); // Invalid status
    }
    
    function test_GetMarketInfo_RevertsInvalidAddress() public {
        vm.expectRevert("Factory: Invalid market address");
        factory.getMarketInfo(address(0));
    }
}

