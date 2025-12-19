// SPDX-License-Identifier: MIT

// | $$$$$$$$                                                /$$                                           /$$                                         /$$                   /$$    
// | $$__  $$                                              | $$                                          | $$                                        | $$                  | $$    
// | $$  \ $$  /$$$$$$  /$$$$$$$   /$$$$$$   /$$$$$$       | $$$$$$$   /$$$$$$   /$$$$$$$  /$$$$$$   /$$$$$$$       /$$$$$$/$$$$   /$$$$$$   /$$$$$$ | $$   /$$  /$$$$$$  /$$$$$$  
// | $$$$$$$/ |____  $$| $$__  $$ /$$__  $$ /$$__  $$      | $$__  $$ |____  $$ /$$_____/ /$$__  $$ /$$__  $$      | $$_  $$_  $$ |____  $$ /$$__  $$| $$  /$$/ /$$__  $$|_  $$_/  
// | $$__  $$  /$$$$$$$| $$  \ $$| $$  \ $$| $$$$$$$$      | $$  \ $$  /$$$$$$$|  $$$$$$ | $$$$$$$$| $$  | $$      | $$ \ $$ \ $$  /$$$$$$$| $$  \__/| $$$$$$/ | $$$$$$$$  | $$    
// | $$  \ $$ /$$__  $$| $$  | $$| $$  | $$| $$_____/      | $$  | $$ /$$__  $$ \____  $$| $$_____/| $$  | $$      | $$ | $$ | $$ /$$__  $$| $$      | $$_  $$ | $$_____/  | $$ /$$
// | $$  | $$|  $$$$$$$| $$  | $$|  $$$$$$$|  $$$$$$$      | $$$$$$$/|  $$$$$$$ /$$$$$$$/|  $$$$$$$|  $$$$$$$      | $$ | $$ | $$|  $$$$$$$| $$      | $$ \  $$|  $$$$$$$  |  $$$$/
// |__/  |__/ \_______/|__/  |__/ \____  $$ \_______/      |_______/  \_______/|_______/  \_______/ \_______/      |__/ |__/ |__/ \_______/|__/      |__/  \__/ \_______/   \___/  
//                                /$$  \ $$                                                                                                                                        
//                               |  $$$$$$/                                                                                                                                        
//                                \______/                                                                                                                                         


pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @notice A range-based prediction market where users bet on the final value of a parameter
 * @dev Users place bets with predicted values, and rewards are distributed based on accuracy
 */
contract PredictionMarket is ReentrancyGuard {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Admin address that can resolve or cancel the market
    address public immutable admin;

    /// @notice Platform fee in basis points (100 = 1%)
    uint256 public immutable platformFee;

    /// @notice Market metadata
    string public name;
    string public description;
    string public imageUrl;
    string public parameter; // e.g., "Bitcoin Price", "Temperature", "Goals Scored"
    string public category; // e.g., "Crypto", "Weather", "Sports"

    /// @notice Market parameters
    uint256 public minValue;
    uint256 public maxValue;
    uint256 public step;
    uint256 public initialValue;

    /// @notice Timing parameters
    uint256 public startTime;
    uint256 public endTime;
    uint256 public resolveTime;

    /// @notice Market state
    enum MarketStatus {
        Pending,
        Active,
        Resolved,
        Cancelled
    }
    MarketStatus public status;
    uint256 public finalValue;

    /// @notice Statistics
    uint256 public totalVolume; // Total native currency locked
    uint256 public totalParticipants;
    uint256 public platformFeesCollected;

    /// @notice User bet structure
    struct Bet {
        address user;
        uint256 amount;
        uint256 predictedValue;
        uint256 rewardAmount;
        bool claimed;
        uint256 timestamp;
    }

    /// @notice Array of all bets
    Bet[] public bets;

    /// @notice Mapping from user address to bet index + 1 (0 means no bet)
    mapping(address => uint256) public userBetIndex;

    // ============================================
    // EVENTS
    // ============================================

    event BetPlaced(address indexed user, uint256 amount, uint256 predictedValue, uint256 timestamp);

    event MarketResolved(uint256 finalValue, uint256 timestamp);

    event RewardClaimed(address indexed user, uint256 amount);

    event MarketCancelled(uint256 timestamp);

    event FundsTransferred(address indexed to, uint256 amount);

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyAdmin() {
        require(msg.sender == admin, "PredictionMarket: Only admin");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        string memory _name,
        string memory _description,
        string memory _imageUrl,
        string memory _parameter,
        string memory _category,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _minValue,
        uint256 _maxValue,
        uint256 _step,
        uint256 _initialValue,
        address _admin,
        uint256 _platformFee
    ) {
        require(_endTime > _startTime, "PredictionMarket: Invalid time range");
        require(_maxValue > _minValue, "PredictionMarket: Invalid value range");
        require(_step > 0, "PredictionMarket: Step must be positive");
        require(
            _initialValue >= _minValue && _initialValue <= _maxValue, "PredictionMarket: Initial value out of range"
        );
        require(_admin != address(0), "PredictionMarket: Invalid admin address");
        require(_platformFee <= 1000, "PredictionMarket: Fee too high");

        admin = _admin;
        platformFee = _platformFee;
        name = _name;
        description = _description;
        imageUrl = _imageUrl;
        parameter = _parameter;
        category = _category;
        startTime = _startTime;
        endTime = _endTime;
        minValue = _minValue;
        maxValue = _maxValue;
        step = _step;
        initialValue = _initialValue;
        status = MarketStatus.Pending;
    }

    // ============================================
    // USER FUNCTIONS
    // ============================================

    /**
     * @notice Place a bet on the predicted value
     * @param _predictedValue The value the user predicts will be the final value
     * @dev Automatically activates market if start time has passed
     */
    function placeBet(uint256 _predictedValue) external payable nonReentrant {
        // Auto-activate market if time has come
        if (status == MarketStatus.Pending && block.timestamp >= startTime) {
            status = MarketStatus.Active;
        }

        require(status == MarketStatus.Active, "PredictionMarket: Market not active");
        require(block.timestamp >= startTime, "PredictionMarket: Market not started");
        require(block.timestamp < endTime, "PredictionMarket: Market ended");
        require(msg.value > 0, "PredictionMarket: Amount must be positive");
        require(_predictedValue >= minValue && _predictedValue <= maxValue, "PredictionMarket: Prediction out of range");
        require(userBetIndex[msg.sender] == 0, "PredictionMarket: Already placed bet");

        // Validate step
        require((_predictedValue - minValue) % step == 0, "PredictionMarket: Invalid step increment");

        // Create bet
        Bet memory newBet = Bet({
            user: msg.sender,
            amount: msg.value,
            predictedValue: _predictedValue,
            rewardAmount: 0,
            claimed: false,
            timestamp: block.timestamp
        });

        bets.push(newBet);
        userBetIndex[msg.sender] = bets.length; // Store index + 1

        // Update participant count
        totalParticipants++;
        totalVolume += msg.value;

        emit BetPlaced(msg.sender, msg.value, _predictedValue, block.timestamp);
    }

    /**
     * @notice Claim reward after market resolution
     * @dev Can only be called after market is resolved and user has a winning bet
     */
    function claimReward() external nonReentrant {
        require(status == MarketStatus.Resolved, "PredictionMarket: Market not resolved");

        uint256 betIndex = userBetIndex[msg.sender];
        require(betIndex > 0, "PredictionMarket: No bet found");

        Bet storage userBet = bets[betIndex - 1];
        require(!userBet.claimed, "PredictionMarket: Already claimed");
        require(userBet.rewardAmount > 0, "PredictionMarket: No reward");

        userBet.claimed = true;
        uint256 reward = userBet.rewardAmount;

        (bool success,) = payable(msg.sender).call{value: reward}("");
        require(success, "PredictionMarket: Transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Resolve the market with the final value
     * @param _finalValue The actual final value of the parameter
     * @dev Calculates and distributes rewards based on accuracy
     */
    function resolveMarket(uint256 _finalValue) external onlyAdmin nonReentrant {
        require(status == MarketStatus.Active || status == MarketStatus.Pending, "PredictionMarket: Invalid status");
        require(block.timestamp >= endTime, "PredictionMarket: Market not ended");
        require(_finalValue >= minValue && _finalValue <= maxValue, "PredictionMarket: Final value out of range");

        status = MarketStatus.Resolved;
        finalValue = _finalValue;
        resolveTime = block.timestamp;

        _calculateRewards();

        emit MarketResolved(_finalValue, block.timestamp);
    }

    /**
     * @notice Calculate rewards for all participants based on prediction accuracy
     * @dev Uses inverse divergence weighted by bet amount
     */
    function _calculateRewards() private {
        if (bets.length == 0) return;

        // Calculate platform fee
        uint256 feeAmount = (totalVolume * platformFee) / 10000;
        platformFeesCollected = feeAmount;
        uint256 rewardPool = totalVolume - feeAmount;

        // Calculate accuracy scores using inverse divergence
        uint256 totalWeightedAccuracy = 0;
        uint256[] memory accuracyScores = new uint256[](bets.length);
        uint256[] memory weightedAccuracies = new uint256[](bets.length);

        for (uint256 i = 0; i < bets.length; i++) {
            uint256 divergence = finalValue > bets[i].predictedValue
                ? finalValue - bets[i].predictedValue
                : bets[i].predictedValue - finalValue;

            // Accuracy score: higher is better (closer to final value)
            // Using 1e18 precision to avoid division by zero and maintain precision
            uint256 accuracyScore = 1e18 / (divergence + 1);
            accuracyScores[i] = accuracyScore;

            // Weight by bet amount
            uint256 weightedAccuracy = (accuracyScore * bets[i].amount) / 1e18;
            weightedAccuracies[i] = weightedAccuracy;
            totalWeightedAccuracy += weightedAccuracy;
        }

        // Distribute rewards proportionally
        if (totalWeightedAccuracy > 0) {
            for (uint256 i = 0; i < bets.length; i++) {
                uint256 reward = (weightedAccuracies[i] * rewardPool) / totalWeightedAccuracy;
                bets[i].rewardAmount = reward;
            }
        }
    }

    /**
     * @notice Cancel the market and refund all bets
     * @dev Can only be called before resolution
     */
    function cancelMarket() external onlyAdmin nonReentrant {
        require(status == MarketStatus.Pending || status == MarketStatus.Active, "PredictionMarket: Cannot cancel");

        status = MarketStatus.Cancelled;

        // Refund all bets
        for (uint256 i = 0; i < bets.length; i++) {
            if (!bets[i].claimed) {
                bets[i].claimed = true;
                bets[i].rewardAmount = bets[i].amount; // Full refund

                (bool success,) = payable(bets[i].user).call{value: bets[i].amount}("");
                require(success, "PredictionMarket: Refund failed");
            }
        }

        emit MarketCancelled(block.timestamp);
    }

    /**
     * @notice Withdraw platform fees to recipient
     * @param _recipient Address to receive the platform fees
     */
    function withdrawPlatformFees(address payable _recipient) external onlyAdmin nonReentrant {
        require(status == MarketStatus.Resolved, "PredictionMarket: Market not resolved");
        require(platformFeesCollected > 0, "PredictionMarket: No fees to withdraw");
        require(_recipient != address(0), "PredictionMarket: Invalid recipient");

        uint256 amount = platformFeesCollected;
        platformFeesCollected = 0;

        (bool success,) = _recipient.call{value: amount}("");
        require(success, "PredictionMarket: Transfer failed");

        emit FundsTransferred(_recipient, amount);
    }

    /**
     * @notice Emergency withdraw function for cancelled markets
     * @param _recipient Address to receive remaining funds
     */
    function emergencyWithdraw(address payable _recipient) external onlyAdmin nonReentrant {
        require(status == MarketStatus.Cancelled, "PredictionMarket: Only in cancelled state");
        require(_recipient != address(0), "PredictionMarket: Invalid recipient");

        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success,) = _recipient.call{value: balance}("");
            require(success, "PredictionMarket: Transfer failed");
            emit FundsTransferred(_recipient, balance);
        }
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get all bets placed in the market
     * @return Array of all bets
     */
    function getAllBets() external view returns (Bet[] memory) {
        return bets;
    }

    /**
     * @notice Get bet information for a specific user
     * @param _user Address of the user
     * @return hasBet Whether the user has placed a bet
     * @return amount Bet amount
     * @return predictedValue Predicted value
     * @return rewardAmount Reward amount (0 if not resolved or no reward)
     * @return claimed Whether reward has been claimed
     * @return timestamp Bet timestamp
     */
    function getUserBet(address _user)
        external
        view
        returns (
            bool hasBet,
            uint256 amount,
            uint256 predictedValue,
            uint256 rewardAmount,
            bool claimed,
            uint256 timestamp
        )
    {
        uint256 betIndex = userBetIndex[_user];
        if (betIndex == 0) {
            return (false, 0, 0, 0, false, 0);
        }

        Bet memory userBet = bets[betIndex - 1];
        return (true, userBet.amount, userBet.predictedValue, userBet.rewardAmount, userBet.claimed, userBet.timestamp);
    }

    /**
     * @notice Get comprehensive market information
     * @return _name Market name
     * @return _description Market description
     * @return _imageUrl Market image URL
     * @return _parameter Parameter being predicted
     * @return _category Market category
     * @return _startTime Market start time
     * @return _endTime Market end time
     * @return _minValue Minimum value in range
     * @return _maxValue Maximum value in range
     * @return _step Step size
     * @return _initialValue Initial value
     * @return _status Current market status
     * @return _totalVolume Total volume locked
     * @return _totalParticipants Total number of participants
     * @return _finalValue Final resolved value (0 if not resolved)
     */
    function getMarketInfo()
        external
        view
        returns (
            string memory _name,
            string memory _description,
            string memory _imageUrl,
            string memory _parameter,
            string memory _category,
            uint256 _startTime,
            uint256 _endTime,
            uint256 _minValue,
            uint256 _maxValue,
            uint256 _step,
            uint256 _initialValue,
            MarketStatus _status,
            uint256 _totalVolume,
            uint256 _totalParticipants,
            uint256 _finalValue
        )
    {
        return (
            name,
            description,
            imageUrl,
            parameter,
            category,
            startTime,
            endTime,
            minValue,
            maxValue,
            step,
            initialValue,
            status,
            totalVolume,
            totalParticipants,
            finalValue
        );
    }

    /**
     * @notice Get distribution of predictions across the value range
     * @return values Array of possible values in the range
     * @return counts Array of bet counts for each value
     */
    function getPredictionDistribution() external view returns (uint256[] memory values, uint256[] memory counts) {
        uint256 range = (maxValue - minValue) / step + 1;
        values = new uint256[](range);
        counts = new uint256[](range);

        // Initialize values array
        for (uint256 i = 0; i < range; i++) {
            values[i] = minValue + (i * step);
        }

        // Count bets for each value
        for (uint256 i = 0; i < bets.length; i++) {
            uint256 index = (bets[i].predictedValue - minValue) / step;
            counts[index]++;
        }

        return (values, counts);
    }

    /**
     * @notice Get the total number of bets
     * @return Number of bets placed
     */
    function getBetCount() external view returns (uint256) {
        return bets.length;
    }

    /**
     * @notice Get contract balance
     * @return Current balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============================================
    // RECEIVE FUNCTION
    // ============================================

    /**
     * @notice Receive function to accept native currency
     */
    receive() external payable {}
}

