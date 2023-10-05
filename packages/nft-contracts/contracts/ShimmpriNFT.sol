// SPDX-License-Identifier: None
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ShimmpriNFT is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, PausableUpgradeable, AccessControlUpgradeable, ERC721BurnableUpgradeable {
    using AddressUpgradeable for address;
    using StringsUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    CountersUpgradeable.Counter private _tokenIdCounter;

    string public baseTokenURI;
    string public baseExtension;

    uint256 public constant TOTAL_SUPPLY = 1800;
    uint256 public constant TOTAL_DAYS = 6;
    uint256 public constant MAX_PER_DAY = 300;

    uint256 public constant HOUR_IN_SECONDS = 3600;

    uint256 public startTime;

    bool public oneNftPerAddress;

    mapping(uint256 => uint256) public mintPerDay;
    mapping(uint256 => uint256) public dayOfNFT;

    mapping(uint256 => mapping(address => bool)) public mintedPerDay;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC721_init("Shimmpri NFTs", "BALUE");
        __ERC721Enumerable_init();
        __Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        startTime = type(uint256).max;
        oneNftPerAddress = true;

        _pause();
    }

    function setSpec() public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseTokenURI = "https://nft.shimmpri.xyz/";
        baseExtension = ".json";
    }

    function safeMint() public whenNotPaused {
        uint256 tokenId = _tokenIdCounter.current();

        require(block.timestamp > startTime, "Not start yet");
        require(tokenId < TOTAL_SUPPLY, "Reach max supply");
        require(mintPerDay[this.currentDay()] < MAX_PER_DAY, "Reach max per day");
        require(this.currentDay() < 6, "Ended");

        if (oneNftPerAddress) {
            require(mintedPerDay[this.currentDay()][msg.sender] == false, "Minted today");
        }

        _tokenIdCounter.increment();
        mintPerDay[this.currentDay()]++;
        mintedPerDay[this.currentDay()][msg.sender] = true;

        dayOfNFT[tokenId] = this.currentDay() + 1;

        _safeMint(msg.sender, tokenId);
    }

    function currentDay() public view returns (uint256) {
        if (startTime == type(uint256).max) {
            return 0;
        }

        uint256 left = block.timestamp - startTime;

        if (left < 0) {
            return 0;
        }

        uint256 _currentDay = left / (HOUR_IN_SECONDS * 24);

        return _currentDay;
    }

    function mintToday() public view returns (uint256) {
        return mintPerDay[this.currentDay()];
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseTokenURL(string memory _baseTokenURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseTokenURI = _baseTokenURI;
    }

    function setStartTime(uint256 _startTime) public onlyRole(DEFAULT_ADMIN_ROLE) {
        startTime = _startTime;
    }

    function setOneNftPerAddress(bool _oneNftPerAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        oneNftPerAddress = _oneNftPerAddress;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), baseExtension)) : "";
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
