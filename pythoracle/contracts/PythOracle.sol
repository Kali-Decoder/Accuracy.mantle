// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.13;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PythPriceFeedOracle is Ownable {

  IPyth pyth;

  // Mapping from ticker (e.g., "BTC", "ETH") to price feed ID
  mapping(string => bytes32) public priceFeedIds;

  // Mapping from ticker to price (cached)
  mapping(string => PythStructs.Price) public prices;

  constructor(address _pyth) Ownable(msg.sender) {
    pyth = IPyth(_pyth);

    // Initialize with provided price feeds
    priceFeedIds["BTC"] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    priceFeedIds["ETH"] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    priceFeedIds["SOL"] = 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d;
    priceFeedIds["MNT"] = 0x4e3037c822d852d79af3ac80e35eb420ee3b870dca49f9344a38ef4773fb0585;
  }

  /**
   * @dev Add or update a price feed ID for a given ticker
   * @param ticker The ticker symbol (e.g., "BTC", "ETH")
   * @param priceId The Pyth price feed ID
   */
  function addPriceFeed(string memory ticker, bytes32 priceId) external onlyOwner {
    priceFeedIds[ticker] = priceId;
    emit PriceFeedAdded(ticker, priceId);
  }

  /**
   * @dev Get the latest price for a given ticker
   * @param ticker The ticker symbol (e.g., "BTC", "ETH")
   * @param maxAge Maximum age of the price in seconds
   * @return price The price struct from Pyth
   */
  function getPrice(string memory ticker, uint maxAge) public returns (PythStructs.Price memory price) {
    bytes32 priceId = priceFeedIds[ticker];
    require(priceId != bytes32(0), "Price feed not found for ticker");
    
    price = pyth.getPriceNoOlderThan(priceId, maxAge);
    prices[ticker] = price;
    
    return price;
  }

  /**
   * @dev Get price in 18 decimals format
   * @param ticker The ticker symbol
   * @param maxAge Maximum age of the price in seconds
   * @return price18Decimals Price in 18 decimals
   */
  function getPrice18Decimals(string memory ticker, uint maxAge) public returns (uint price18Decimals) {
    PythStructs.Price memory price = getPrice(ticker, maxAge);
    
    price18Decimals = (uint(uint64(price.price)) * (10 ** 18)) /
      (10 ** uint8(uint32(-1 * price.expo)));
    
    return price18Decimals;
  }

  /**
   * @dev Query cached price feed data for a given ticker (view function for external queries)
   * @param ticker The ticker symbol (e.g., "BTC", "ETH")
   * @return price The cached price struct from Pyth
   * @return priceId The price feed ID for the ticker
   * @return price18Decimals Price in 18 decimals format
   */
  function queryPriceFeed(string memory ticker) public view returns (
    PythStructs.Price memory price,
    bytes32 priceId,
    uint price18Decimals
  ) {
    priceId = priceFeedIds[ticker];
    require(priceId != bytes32(0), "Price feed not found for ticker");
    
    price = prices[ticker];
    require(price.price != 0, "Price not cached. Call getPrice() first to fetch latest price.");
    
    price18Decimals = (uint(uint64(price.price)) * (10 ** 18)) /
      (10 ** uint8(uint32(-1 * price.expo)));
    
    return (price, priceId, price18Decimals);
  }

  /**
   * @dev Query price feed ID for a given ticker (view function)
   * @param ticker The ticker symbol (e.g., "BTC", "ETH")
   * @return priceId The price feed ID for the ticker
   */
  function queryPriceFeedId(string memory ticker) public view returns (bytes32 priceId) {
    priceId = priceFeedIds[ticker];
    require(priceId != bytes32(0), "Price feed not found for ticker");
    return priceId;
  }

  /**
   * @dev Read price data from ticker (simple view function)
   * @param ticker The ticker symbol (e.g., "BTC", "ETH")
   * @return price18Decimals Price in 18 decimals format
   */
  function read(string memory ticker) public view returns (uint price18Decimals) {
    bytes32 priceFeedId = priceFeedIds[ticker];
    require(priceFeedId != bytes32(0), "Price feed not found for ticker");
    
    PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceFeedId, 60);
    
    price18Decimals = (uint(uint64(price.price)) * (10 ** 18)) / 
      (10 ** uint8(uint32(-1 * price.expo)));
    
    return price18Decimals;
  }

  function mint(string memory ticker) public payable {
    uint price18Decimals = getPrice18Decimals(ticker, 60);

    uint oneDollarInWei = ((10 ** 18) * (10 ** 18)) / price18Decimals;

    if (msg.value >= oneDollarInWei) {
      // User paid enough money.
      // TODO: mint the NFT here
    } else {
      revert InsufficientFee();
    }
  }

  function updateAndMint(string memory ticker, bytes[] calldata pythPriceUpdate) external payable {
    uint updateFee = pyth.getUpdateFee(pythPriceUpdate);
    pyth.updatePriceFeeds{ value: updateFee }(pythPriceUpdate);
    mint(ticker);
  }

  // Error raised if the payment is not sufficient
  error InsufficientFee();

  // Event emitted when a price feed is added
  event PriceFeedAdded(string indexed ticker, bytes32 priceId);
}
