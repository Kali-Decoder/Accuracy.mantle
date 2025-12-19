// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    address public admin;
    address public user1;
    address public user2;
    address public user3;
    
    uint256 public constant PLATFORM_FEE = 200; // 2%
    uint256 public constant MIN_VALUE = 0;
    uint256 public constant MAX_VALUE = 100;
    uint256 public constant STEP = 10;
    uint256 public constant INITIAL_VALUE = 50;
    
    uint256 public startTime;
    uint256 public endTime;
    
    event BetPlaced(address indexed user, uint256 amount, uint256 predictedValue, uint256 timestamp);
    event MarketResolved(uint256 finalValue, uint256 timestamp);
    event RewardClaimed(address indexed user, uint256 amount);
    event MarketCancelled(uint256 timestamp);
    
    function setUp() public {
        admin = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);
        
        startTime = block.timestamp + 1 days;
        endTime = block.timestamp + 7 days;
        
        market = new PredictionMarket(
            "Bitcoin Price Prediction",
            "Predict Bitcoin price on Dec 31",
            "https://example.com/btc.png",
            "Bitcoin Price",
            "Crypto",
            startTime,
            endTime,
            MIN_VALUE,
            MAX_VALUE,
            STEP,
            INITIAL_VALUE,
            admin,
            PLATFORM_FEE
        );
        
        // Fund users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
    }
    
    // ============================================
    // CONSTRUCTOR TESTS
    // ============================================
    
    function test_Constructor_SetsCorrectValues() public view {
        assertEq(market.admin(), admin);
        assertEq(market.platformFee(), PLATFORM_FEE);
        assertEq(market.minValue(), MIN_VALUE);
        assertEq(market.maxValue(), MAX_VALUE);
        assertEq(market.step(), STEP);
        assertEq(market.initialValue(), INITIAL_VALUE);
        assertEq(uint8(market.status()), 0); // Pending
    }
    
    function test_Constructor_RevertsInvalidTimeRange() public {
        vm.expectRevert("PredictionMarket: Invalid time range");
        new PredictionMarket(
            "Test",
            "Test",
            "",
            "Test",
            "Test",
            endTime,
            startTime, // Invalid: end before start
            MIN_VALUE,
            MAX_VALUE,
            STEP,
            INITIAL_VALUE,
            admin,
            PLATFORM_FEE
        );
    }
    
    function test_Constructor_RevertsInvalidValueRange() public {
        vm.expectRevert("PredictionMarket: Invalid value range");
        new PredictionMarket(
            "Test",
            "Test",
            "",
            "Test",
            "Test",
            startTime,
            endTime,
            MAX_VALUE,
            MIN_VALUE, // Invalid: max < min
            STEP,
            INITIAL_VALUE,
            admin,
            PLATFORM_FEE
        );
    }
    
    function test_Constructor_RevertsInvalidInitialValue() public {
        vm.expectRevert("PredictionMarket: Initial value out of range");
        new PredictionMarket(
            "Test",
            "Test",
            "",
            "Test",
            "Test",
            startTime,
            endTime,
            MIN_VALUE,
            MAX_VALUE,
            STEP,
            MAX_VALUE + 1, // Invalid: out of range
            admin,
            PLATFORM_FEE
        );
    }
    
    // ============================================
    // PLACE BET TESTS
    // ============================================
    
    function test_PlaceBet_Success() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        (bool hasBet, uint256 amount, uint256 predictedValue, , , ) = market.getUserBet(user1);
        assertTrue(hasBet);
        assertEq(amount, 1 ether);
        assertEq(predictedValue, 50);
        assertEq(market.totalVolume(), 1 ether);
        assertEq(market.totalParticipants(), 1);
    }
    
    function test_PlaceBet_AutoActivatesMarket() public {
        vm.warp(startTime + 1);
        
        assertEq(uint8(market.status()), 0); // Pending
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        assertEq(uint8(market.status()), 1); // Active
    }
    
    function test_PlaceBet_RevertsBeforeStartTime() public {
        vm.expectRevert("PredictionMarket: Market not active");
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
    }
    
    function test_PlaceBet_RevertsAfterEndTime() public {
        vm.warp(endTime + 1);
        
        vm.expectRevert("PredictionMarket: Market ended");
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
    }
    
    function test_PlaceBet_RevertsInvalidValue() public {
        vm.warp(startTime + 1);
        
        vm.expectRevert("PredictionMarket: Prediction out of range");
        vm.prank(user1);
        market.placeBet{value: 1 ether}(MAX_VALUE + 1);
    }
    
    function test_PlaceBet_RevertsInvalidStep() public {
        vm.warp(startTime + 1);
        
        vm.expectRevert("PredictionMarket: Invalid step increment");
        vm.prank(user1);
        market.placeBet{value: 1 ether}(55); // Not a multiple of step
    }
    
    function test_PlaceBet_RevertsZeroAmount() public {
        vm.warp(startTime + 1);
        
        vm.expectRevert("PredictionMarket: Amount must be positive");
        vm.prank(user1);
        market.placeBet{value: 0}(50);
    }
    
    function test_PlaceBet_RevertsDuplicateBet() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.expectRevert("PredictionMarket: Already placed bet");
        vm.prank(user1);
        market.placeBet{value: 1 ether}(60);
    }
    
    function test_PlaceBet_MultipleUsers() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.prank(user2);
        market.placeBet{value: 2 ether}(60);
        
        vm.prank(user3);
        market.placeBet{value: 0.5 ether}(40);
        
        assertEq(market.totalVolume(), 3.5 ether);
        assertEq(market.totalParticipants(), 3);
        assertEq(market.getBetCount(), 3);
    }
    
    // ============================================
    // RESOLVE MARKET TESTS
    // ============================================
    
    function test_ResolveMarket_Success() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.prank(user2);
        market.placeBet{value: 1 ether}(60);
        
        vm.warp(endTime + 1);
        
        market.resolveMarket(55);
        
        assertEq(uint8(market.status()), 2); // Resolved
        assertEq(market.finalValue(), 55);
        assertEq(market.resolveTime(), block.timestamp);
    }
    
    function test_ResolveMarket_CalculatesRewards() public {
        vm.warp(startTime + 1);
        
        // User1 bets 1 ether on 50 (divergence = 5 from final value 55)
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        // User2 bets 1 ether on 80 (divergence = 25 from final value 55)
        vm.prank(user2);
        market.placeBet{value: 1 ether}(80);
        
        vm.warp(endTime + 1);
        market.resolveMarket(55);
        
        (, , , uint256 reward1, , ) = market.getUserBet(user1);
        (, , , uint256 reward2, , ) = market.getUserBet(user2);
        
        // User1 should get more reward (closer prediction: divergence 5 vs 25)
        assertGt(reward1, reward2);
        assertGt(reward1, 0);
        assertGt(reward2, 0);
        
        // Both should get some reward (total pool minus platform fee)
        // Allow for small rounding differences
        uint256 totalVolume = 2 ether;
        uint256 platformFeeAmount = (totalVolume * PLATFORM_FEE) / 10000;
        uint256 rewardPool = totalVolume - platformFeeAmount;
        uint256 totalRewards = reward1 + reward2;
        assertGe(totalRewards, rewardPool - 1); // Allow 1 wei difference for rounding
        assertLe(totalRewards, rewardPool);
    }
    
    function test_ResolveMarket_RevertsBeforeEndTime() public {
        vm.warp(startTime + 1);
        market.placeBet{value: 1 ether}(50);
        
        vm.expectRevert("PredictionMarket: Market not ended");
        market.resolveMarket(55);
    }
    
    function test_ResolveMarket_RevertsInvalidFinalValue() public {
        vm.warp(endTime + 1);
        
        vm.expectRevert("PredictionMarket: Final value out of range");
        market.resolveMarket(MAX_VALUE + 1);
    }
    
    function test_ResolveMarket_RevertsNonAdmin() public {
        vm.warp(endTime + 1);
        
        vm.expectRevert("PredictionMarket: Only admin");
        vm.prank(user1);
        market.resolveMarket(55);
    }
    
    // ============================================
    // CLAIM REWARD TESTS
    // ============================================
    
    function test_ClaimReward_Success() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.warp(endTime + 1);
        market.resolveMarket(55);
        
        (, , , uint256 rewardAmount, , ) = market.getUserBet(user1);
        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        market.claimReward();
        
        assertEq(user1.balance, balanceBefore + rewardAmount);
        
        (, , , , bool claimed, ) = market.getUserBet(user1);
        assertTrue(claimed);
    }
    
    function test_ClaimReward_RevertsNotResolved() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.expectRevert("PredictionMarket: Market not resolved");
        vm.prank(user1);
        market.claimReward();
    }
    
    function test_ClaimReward_RevertsNoBet() public {
        vm.warp(endTime + 1);
        market.resolveMarket(55);
        
        vm.expectRevert("PredictionMarket: No bet found");
        vm.prank(user1);
        market.claimReward();
    }
    
    function test_ClaimReward_RevertsAlreadyClaimed() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.warp(endTime + 1);
        market.resolveMarket(55);
        
        vm.prank(user1);
        market.claimReward();
        
        vm.expectRevert("PredictionMarket: Already claimed");
        vm.prank(user1);
        market.claimReward();
    }
    
    // ============================================
    // CANCEL MARKET TESTS
    // ============================================
    
    function test_CancelMarket_RefundsAllBets() public {
        vm.warp(startTime + 1);
        
        uint256 user1BalanceBefore = user1.balance;
        uint256 user2BalanceBefore = user2.balance;
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.prank(user2);
        market.placeBet{value: 2 ether}(60);
        
        market.cancelMarket();
        
        assertEq(uint8(market.status()), 3); // Cancelled
        assertEq(user1.balance, user1BalanceBefore);
        assertEq(user2.balance, user2BalanceBefore);
    }
    
    function test_CancelMarket_RevertsNonAdmin() public {
        vm.expectRevert("PredictionMarket: Only admin");
        vm.prank(user1);
        market.cancelMarket();
    }
    
    function test_CancelMarket_RevertsAfterResolved() public {
        vm.warp(startTime + 1);
        market.placeBet{value: 1 ether}(50);
        vm.warp(endTime + 1);
        market.resolveMarket(55);
        
        vm.expectRevert("PredictionMarket: Cannot cancel");
        market.cancelMarket();
    }
    
    // ============================================
    // PLATFORM FEE TESTS
    // ============================================
    
    function test_WithdrawPlatformFees_Success() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.warp(endTime + 1);
        market.resolveMarket(55);
        
        uint256 expectedFee = (1 ether * PLATFORM_FEE) / 10000;
        assertEq(market.platformFeesCollected(), expectedFee);
        
        address feeRecipient = address(0x999);
        uint256 balanceBefore = feeRecipient.balance;
        
        market.withdrawPlatformFees(payable(feeRecipient));
        
        assertEq(feeRecipient.balance, balanceBefore + expectedFee);
        assertEq(market.platformFeesCollected(), 0);
    }
    
    function test_WithdrawPlatformFees_RevertsNotResolved() public {
        vm.expectRevert("PredictionMarket: Market not resolved");
        market.withdrawPlatformFees(payable(address(0x999)));
    }
    
    // ============================================
    // VIEW FUNCTION TESTS
    // ============================================
    
    function test_GetAllBets() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.prank(user2);
        market.placeBet{value: 2 ether}(60);
        
        PredictionMarket.Bet[] memory bets = market.getAllBets();
        assertEq(bets.length, 2);
        assertEq(bets[0].user, user1);
        assertEq(bets[0].amount, 1 ether);
        assertEq(bets[1].user, user2);
        assertEq(bets[1].amount, 2 ether);
    }
    
    function test_GetPredictionDistribution() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.prank(user2);
        market.placeBet{value: 1 ether}(50);
        
        vm.prank(user3);
        market.placeBet{value: 1 ether}(60);
        
        (uint256[] memory values, uint256[] memory counts) = market.getPredictionDistribution();
        
        // Should have 11 possible values (0, 10, 20, ..., 100)
        assertEq(values.length, 11);
        assertEq(counts.length, 11);
        
        // Value 50 should have 2 bets
        assertEq(counts[5], 2); // index 5 = value 50
        
        // Value 60 should have 1 bet
        assertEq(counts[6], 1); // index 6 = value 60
    }
    
    function test_GetMarketInfo() public view {
        (
            string memory name,
            string memory description,
            ,
            string memory parameter,
            string memory category,
            uint256 _startTime,
            uint256 _endTime,
            uint256 _minValue,
            uint256 _maxValue,
            uint256 _step,
            uint256 _initialValue,
            PredictionMarket.MarketStatus status,
            uint256 _totalVolume,
            uint256 _totalParticipants,
            uint256 _finalValue
        ) = market.getMarketInfo();
        
        assertEq(name, "Bitcoin Price Prediction");
        assertEq(parameter, "Bitcoin Price");
        assertEq(category, "Crypto");
        assertEq(_startTime, startTime);
        assertEq(_endTime, endTime);
        assertEq(_minValue, MIN_VALUE);
        assertEq(_maxValue, MAX_VALUE);
        assertEq(_step, STEP);
        assertEq(_initialValue, INITIAL_VALUE);
        assertEq(uint8(status), 0); // Pending
        assertEq(_totalVolume, 0);
        assertEq(_totalParticipants, 0);
        assertEq(_finalValue, 0);
    }
    
    // ============================================
    // EDGE CASES
    // ============================================
    
    function test_ResolveMarket_NoBets() public {
        vm.warp(endTime + 1);
        
        market.resolveMarket(55);
        
        assertEq(uint8(market.status()), 2); // Resolved
        assertEq(market.finalValue(), 55);
    }
    
    function test_ResolveMarket_ExactPrediction() public {
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        market.placeBet{value: 1 ether}(50);
        
        vm.warp(endTime + 1);
        market.resolveMarket(50); // Exact match
        
        (, , , uint256 reward, , ) = market.getUserBet(user1);
        assertGt(reward, 0);
    }
}

