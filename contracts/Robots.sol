// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

interface Garage {
    function price() external returns (uint256);

    function purchase() external payable;
}

contract Robots is ERC721PresetMinterPauserAutoId, Garage {
    address public developer;
    uint256 public constant override price = 1e18;

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721PresetMinterPauserAutoId(name, symbol, baseTokenURI) {
        _setupRole(MINTER_ROLE, address(this));
        developer = msg.sender;
    }

    function purchase() public payable override {
        require(msg.value >= price);

        // Send ethers to developer
        (bool success, ) = developer.call{value: msg.value}("");
        require(success);

        // Mint NFT (using external call)
        this.mint(msg.sender);
    }
}