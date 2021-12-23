pragma solidity 0.8.4;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SoRadToken.sol";

contract Vendor is Ownable {
    SoRadToken soRadToken;
    uint256 public constant tokensPerEth = 100;

    event BuyTokens(address buyer, uint256 amountOfETH, uint256 amountOfTokens);
    event SellTokens(
        address seller,
        uint256 amountOfETH,
        uint256 amountOfTokens
    );

    constructor(address tokenAddress) public {
        soRadToken = SoRadToken(tokenAddress);
    }

    function buyTokens() public payable {
        uint256 amountOfTokens = msg.value * tokensPerEth;
        soRadToken.transfer(msg.sender, amountOfTokens);
        emit BuyTokens(msg.sender, msg.value, amountOfTokens);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "could not withdraw");
    }

    function sellTokens(uint256 tokenAmount) public {
        uint256 ethAmount = tokenAmount / tokensPerEth;
        soRadToken.transferFrom(msg.sender, address(this), tokenAmount);
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "could not pay seller");
        emit SellTokens(msg.sender, ethAmount, tokenAmount);
    }
}
