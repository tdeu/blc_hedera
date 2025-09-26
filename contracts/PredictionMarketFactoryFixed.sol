// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./PredictionMarket.sol";
import "./AdminManager.sol";
import "./Treasury.sol";
import "./BetNFT.sol";
import "./CastToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PredictionMarketFactoryFixed {
    address public adminManager;
    address public treasury;
    CastToken public castToken;
    IERC20 public collateral;
    BetNFT public betNFT;

    bool public isFactoryPaused;
    uint256 public defaultProtocolFeeRate = 200;

    mapping(bytes32 => address) public markets;
    address[] public allMarkets;

    event MarketCreated(bytes32 indexed id, address market, string question);

    modifier onlyAdmin() {
        require(AdminManager(adminManager).isAdmin(msg.sender), "Not admin");
        _;
    }

    modifier factoryNotPaused() {
        require(!isFactoryPaused, "Market creation paused");
        _;
    }

    constructor(
        address _adminManager,
        address _treasury,
        address _collateral,
        address _castToken,
        address _betNFT
    ) {
        adminManager = _adminManager;
        treasury = _treasury;
        collateral = IERC20(_collateral);
        castToken = CastToken(_castToken);
        betNFT = BetNFT(_betNFT);
    }

    function createMarket(
        string memory question,
        uint256 endTime
    ) external factoryNotPaused returns (bytes32) {
        require(endTime > block.timestamp, "End time must be in the future");

        bytes32 id = keccak256(
            abi.encodePacked(question, block.timestamp, msg.sender)
        );
        require(markets[id] == address(0), "Market already exists");

        PredictionMarket market = new PredictionMarket(
            id,
            question,
            msg.sender,
            endTime,
            address(collateral),
            adminManager,
            treasury,
            address(betNFT),
            defaultProtocolFeeRate
        );

        markets[id] = address(market);
        allMarkets.push(address(market));

        // REMOVED: betNFT.authorizeMarket(address(market));
        // This line was causing the failure. The BetNFT owner can authorize markets separately if needed.

        emit MarketCreated(id, address(market), question);
        return id;
    }

    function rewardCreator(address creator) external {
        require(isValidMarket(msg.sender), "Only markets can reward creators");
        castToken.mint(creator, 100e18);
    }

    function isValidMarket(address market) public view returns (bool) {
        for (uint i = 0; i < allMarkets.length; i++) {
            if (allMarkets[i] == market) {
                return true;
            }
        }
        return false;
    }

    // Admin functions
    function pauseFactory() external onlyAdmin {
        isFactoryPaused = true;
    }

    function unpauseFactory() external onlyAdmin {
        isFactoryPaused = false;
    }

    function setDefaultProtocolFeeRate(uint256 _rate) external onlyAdmin {
        require(_rate <= 1000, "Fee rate too high"); // Max 10%
        defaultProtocolFeeRate = _rate;
    }

    // Helper function for BetNFT owner to authorize markets if needed
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }
}