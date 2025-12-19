// SPDX-License-Identifier: MIT

//  /$$$$$$$  /$$$$$$$  /$$      /$$       /$$$$$$$$                             /$$                              
// | $$__  $$| $$__  $$| $$$    /$$$      | $$_____/                            | $$                              
// | $$  \ $$| $$  \ $$| $$$$  /$$$$      | $$    /$$$$$$   /$$$$$$$  /$$$$$$  /$$$$$$    /$$$$$$  /$$   /$$      
// | $$$$$$$/| $$$$$$$ | $$ $$/$$ $$      | $$$$$|____  $$ /$$_____/ /$$__  $$|_  $$_/   /$$__  $$| $$  | $$      
// | $$__  $$| $$__  $$| $$  $$$| $$      | $$__/ /$$$$$$$| $$      | $$  \ $$  | $$    | $$  \__/| $$  | $$      
// | $$  \ $$| $$  \ $$| $$\  $ | $$      | $$   /$$__  $$| $$      | $$  | $$  | $$ /$$| $$      | $$  | $$      
// | $$  | $$| $$$$$$$/| $$ \/  | $$      | $$  |  $$$$$$$|  $$$$$$$|  $$$$$$/  |  $$$$/| $$      |  $$$$$$$      
// |__/  |__/|_______/ |__/     |__/      |__/   \_______/ \_______/ \______/    \___/  |__/       \____  $$      
//                                                                                                 /$$  | $$      
//                                                                                                |  $$$$$$/      
//                                                                                                 \______/       
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {PredictionMarket} from "./PredictionMarket.sol";

/**
 * @title PredictionMarketFactory
 * @notice Factory contract for creating and managing prediction markets
 * @dev Allows the owner to create new prediction markets and manage platform fees
 */
contract PredictionMarketFactory is Ownable, ReentrancyGuard {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Array of all created market addresses
    address[] public allMarkets;

    /// @notice Platform fee in basis points (100 = 1%)
    uint256 public platformFee;

    /// @notice Maximum allowed platform fee (10%)
    uint256 public constant MAX_PLATFORM_FEE = 1000;

    // ============================================
    // EVENTS
    // ============================================

    event MarketCreated(address indexed marketAddress, string name, string category, uint256 indexed marketId);

    event PlatformFeeUpdated(uint256 newFee);

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Constructor sets the owner and initial platform fee
     * @param _initialOwner Address of the contract owner
     * @param _initialPlatformFee Initial platform fee in basis points (default: 200 = 2%)
     */
    constructor(address _initialOwner, uint256 _initialPlatformFee) Ownable(_initialOwner) {
        require(_initialOwner != address(0), "Factory: Invalid owner address");
        require(_initialPlatformFee <= MAX_PLATFORM_FEE, "Factory: Fee too high");

        platformFee = _initialPlatformFee;
    }

    // ============================================
    // OWNER FUNCTIONS
    // ============================================

    /**
     * @notice Create a new prediction market
     * @param _name Name of the market
     * @param _description Description of the market
     * @param _imageUrl URL to an image representing the market
     * @param _parameter The parameter being predicted (e.g., "Bitcoin Price")
     * @param _category Category of the market (e.g., "Crypto", "Weather", "Sports")
     * @param _startTime Unix timestamp when the market becomes active
     * @param _endTime Unix timestamp when the market closes for betting
     * @param _minValue Minimum value in the prediction range
     * @param _maxValue Maximum value in the prediction range
     * @param _step Step size for valid predictions
     * @param _initialValue Initial/current value of the parameter
     * @return marketAddress Address of the newly created market
     */
    function createMarket(
        string calldata _name,
        string calldata _description,
        string calldata _imageUrl,
        string calldata _parameter,
        string calldata _category,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _minValue,
        uint256 _maxValue,
        uint256 _step,
        uint256 _initialValue
    ) external onlyOwner nonReentrant returns (address marketAddress) {
        require(bytes(_name).length > 0, "Factory: Name required");
        require(bytes(_parameter).length > 0, "Factory: Parameter required");
        require(_endTime > _startTime, "Factory: Invalid time range");
        require(_endTime > block.timestamp, "Factory: End time must be future");
        require(_maxValue > _minValue, "Factory: Invalid value range");
        require(_step > 0, "Factory: Step must be positive");
        require(_initialValue >= _minValue && _initialValue <= _maxValue, "Factory: Initial value out of range");

        PredictionMarket newMarket = new PredictionMarket(
            _name,
            _description,
            _imageUrl,
            _parameter,
            _category,
            _startTime,
            _endTime,
            _minValue,
            _maxValue,
            _step,
            _initialValue,
            owner(),
            platformFee
        );

        marketAddress = address(newMarket);
        allMarkets.push(marketAddress);

        emit MarketCreated(marketAddress, _name, _category, allMarkets.length - 1);

        return marketAddress;
    }

    /**
     * @notice Update the platform fee
     * @param _fee New platform fee in basis points (100 = 1%)
     * @dev Maximum fee is 10% (1000 basis points)
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_PLATFORM_FEE, "Factory: Fee too high");
        platformFee = _fee;
        emit PlatformFeeUpdated(_fee);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get all market addresses
     * @return Array of all market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    /**
     * @notice Get the total number of markets created
     * @return Number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }

    /**
     * @notice Get markets filtered by status
     * @param _status Market status (0=Pending, 1=Active, 2=Resolved, 3=Cancelled)
     * @return Array of market addresses with the specified status
     */
    function getMarketsByStatus(uint8 _status) external view returns (address[] memory) {
        require(_status <= 3, "Factory: Invalid status");

        // First pass: count markets with matching status
        uint256 count = 0;
        for (uint256 i = 0; i < allMarkets.length; i++) {
            PredictionMarket market = PredictionMarket(payable(allMarkets[i]));
            if (uint8(market.status()) == _status) {
                count++;
            }
        }

        // Second pass: collect addresses
        address[] memory filtered = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allMarkets.length; i++) {
            PredictionMarket market = PredictionMarket(payable(allMarkets[i]));
            if (uint8(market.status()) == _status) {
                filtered[index] = allMarkets[i];
                index++;
            }
        }

        return filtered;
    }

    /**
     * @notice Get market address by index
     * @param _index Index of the market
     * @return Market address at the given index
     */
    function getMarket(uint256 _index) external view returns (address) {
        require(_index < allMarkets.length, "Factory: Index out of bounds");
        return allMarkets[_index];
    }

    /**
     * @notice Get market information for a specific market
     * @param _marketAddress Address of the market
     * @return name Market name
     * @return description Market description
     * @return imageUrl Market image URL
     * @return parameter Parameter being predicted
     * @return category Market category
     * @return startTime Market start time
     * @return endTime Market end time
     * @return minValue Minimum value in range
     * @return maxValue Maximum value in range
     * @return step Step size
     * @return initialValue Initial value
     * @return status Current market status
     * @return totalVolume Total volume locked
     * @return totalParticipants Total number of participants
     * @return finalValue Final resolved value (0 if not resolved)
     */
    function getMarketInfo(address _marketAddress)
        external
        view
        returns (
            string memory name,
            string memory description,
            string memory imageUrl,
            string memory parameter,
            string memory category,
            uint256 startTime,
            uint256 endTime,
            uint256 minValue,
            uint256 maxValue,
            uint256 step,
            uint256 initialValue,
            PredictionMarket.MarketStatus status,
            uint256 totalVolume,
            uint256 totalParticipants,
            uint256 finalValue
        )
    {
        require(_marketAddress != address(0), "Factory: Invalid market address");
        return PredictionMarket(payable(_marketAddress)).getMarketInfo();
    }

    /**
     * @notice Check if an address is a valid market created by this factory
     * @param _marketAddress Address to check
     * @return Whether the address is a valid market
     */
    function isValidMarket(address _marketAddress) external view returns (bool) {
        for (uint256 i = 0; i < allMarkets.length; i++) {
            if (allMarkets[i] == _marketAddress) {
                return true;
            }
        }
        return false;
    }
}

