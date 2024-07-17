// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Eyeballer is ERC721Enumerable, Ownable, ReentrancyGuard {

    event Mint(address indexed to, uint256 indexed tokenId);
    
    uint256 public constant MAX_TOKENS = 10000;
    uint256 private _currentTokenId = 0;
    uint256 public price = 0;
    string public baseURI = "https://eyeballer.replit.app/metadata";

    constructor(uint256 _price)
        ERC721("Eyeballer", "EBL")
        Ownable(msg.sender)
    {
        price = _price;
    }

    function setPrice(uint256 _price) public onlyOwner {
        require(_price >= 0, "price must be non-negative");
        price = _price;
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }
    
    function mint() public payable {
        require(_currentTokenId < MAX_TOKENS, "that's enough eyeballs");
        require(msg.value == price, "send the right amount of ETH");
        _currentTokenId++;
        _safeMint(msg.sender, _currentTokenId);
        emit Mint(msg.sender, _currentTokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, "/", Strings.toString(tokenId), ".json"));
    }

    function withdraw() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "no ETH balance");
        payable(owner()).transfer(balance);
    }

    function withdrawERC20(address tokenContract) public onlyOwner nonReentrant {
        IERC20 token = IERC20(tokenContract);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "no token balance");
        token.transfer(owner(), balance);
    }

    // accept ETH, if necessary
    fallback() external payable {}
    receive() external payable {}
}