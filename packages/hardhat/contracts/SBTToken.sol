//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IssuerRegistry.sol";

/**
 * @title SBTToken
 * @dev Soulbound Token (Non-transferable ERC721) implementation
 * @author SBT System POC
 */
contract SBTToken is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, Pausable, ReentrancyGuard {

    // Reference to the IssuerRegistry contract
    IssuerRegistry public immutable issuerRegistry;

    // Counter for token IDs
    uint256 private _nextTokenId = 1;

    // Mapping from token ID to issuer address
    mapping(uint256 => address) public tokenIssuer;

    // Mapping from token ID to mint timestamp
    mapping(uint256 => uint256) public tokenMintTime;

    // Mapping from token ID to revoked status
    mapping(uint256 => bool) public tokenRevoked;

    // Mapping to track if user already has SBT from specific issuer (prevents duplicates)
    mapping(address => mapping(address => bool)) public hasTokenFromIssuer;

    // Events
    event SBTMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string tokenURI,
        address indexed issuer,
        uint256 timestamp
    );

    event SBTRevoked(
        uint256 indexed tokenId,
        address indexed revoker,
        uint256 timestamp
    );

    event BatchSBTMinted(
        address[] recipients,
        uint256[] tokenIds,
        string[] tokenURIs,
        address indexed issuer,
        uint256 timestamp
    );

    // Modifier to check if caller is authorized issuer
    modifier onlyAuthorizedIssuer() {
        require(
            issuerRegistry.isAuthorizedIssuer(msg.sender),
            "SBTToken: Not an authorized issuer"
        );
        _;
    }

    // Modifier to check if token exists and not revoked
    modifier validToken(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "SBTToken: Token does not exist");
        require(!tokenRevoked[tokenId], "SBTToken: Token has been revoked");
        _;
    }

    constructor(
        address _owner,
        address _issuerRegistry
    ) ERC721("Soulbound Token", "SBT") Ownable(_owner) {
        require(_issuerRegistry != address(0), "SBTToken: Invalid registry address");
        issuerRegistry = IssuerRegistry(_issuerRegistry);
    }

    /**
     * @dev Mint a new SBT to a recipient
     * @param to Address of the recipient
     * @param uri IPFS URI for token metadata
     */
    function mintSBT(
        address to,
        string memory uri
    ) external onlyAuthorizedIssuer whenNotPaused nonReentrant {
        require(to != address(0), "SBTToken: Cannot mint to zero address");
        require(bytes(uri).length > 0, "SBTToken: Token URI cannot be empty");
        require(!hasTokenFromIssuer[to][msg.sender], "SBTToken: User already has token from this issuer");

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        tokenIssuer[tokenId] = msg.sender;
        tokenMintTime[tokenId] = block.timestamp;
        hasTokenFromIssuer[to][msg.sender] = true;

        emit SBTMinted(to, tokenId, uri, msg.sender, block.timestamp);
    }

    /**
     * @dev Batch mint SBTs to multiple recipients
     * @param recipients Array of recipient addresses
     * @param uris Array of IPFS URIs for token metadata
     */
    function batchMintSBT(
        address[] memory recipients,
        string[] memory uris
    ) external onlyAuthorizedIssuer whenNotPaused nonReentrant {
        require(recipients.length > 0, "SBTToken: Empty recipients array");
        require(recipients.length == uris.length, "SBTToken: Arrays length mismatch");
        require(recipients.length <= 100, "SBTToken: Batch size too large"); // Gas limit protection

        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            string memory uri = uris[i];

            require(to != address(0), "SBTToken: Cannot mint to zero address");
            require(bytes(uri).length > 0, "SBTToken: Token URI cannot be empty");
            require(!hasTokenFromIssuer[to][msg.sender], "SBTToken: User already has token from this issuer");

            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uri);

            tokenIssuer[tokenId] = msg.sender;
            tokenMintTime[tokenId] = block.timestamp;
            hasTokenFromIssuer[to][msg.sender] = true;

            emit SBTMinted(to, tokenId, uri, msg.sender, block.timestamp);
        }

        emit BatchSBTMinted(recipients, tokenIds, uris, msg.sender, block.timestamp);
    }

    /**
     * @dev Revoke an SBT (can only be done by issuer or owner)
     * @param tokenId ID of the token to revoke
     */
    function revokeSBT(uint256 tokenId) external validToken(tokenId) whenNotPaused {
        require(
            msg.sender == tokenIssuer[tokenId] || msg.sender == owner(),
            "SBTToken: Not authorized to revoke"
        );

        address tokenOwner = ownerOf(tokenId);
        address issuer = tokenIssuer[tokenId];

        tokenRevoked[tokenId] = true;
        hasTokenFromIssuer[tokenOwner][issuer] = false;

        emit SBTRevoked(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get all token IDs owned by an address
     * @param owner Address to query
     * @return uint256[] Array of token IDs
     */
    function getUserSBTs(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    /**
     * @dev Get SBT information
     * @param tokenId Token ID to query
     * @return owner Owner address
     * @return issuer Issuer address
     * @return mintTime Mint timestamp
     * @return revoked Revoked status
     * @return uri Token URI
     */
    function getSBTInfo(uint256 tokenId) external view returns (
        address owner,
        address issuer,
        uint256 mintTime,
        bool revoked,
        string memory uri
    ) {
        require(_ownerOf(tokenId) != address(0), "SBTToken: Token does not exist");

        return (
            ownerOf(tokenId),
            tokenIssuer[tokenId],
            tokenMintTime[tokenId],
            tokenRevoked[tokenId],
            tokenURI(tokenId)
        );
    }

    /**
     * @dev Override transfer functions to make tokens non-transferable
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        // Prevent all other transfers
        if (from != address(0) && to != address(0)) {
            revert("SBTToken: Soulbound tokens cannot be transferred");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override approve to prevent approvals
     */
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert("SBTToken: Soulbound tokens cannot be approved");
    }

    /**
     * @dev Override setApprovalForAll to prevent approvals
     */
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert("SBTToken: Soulbound tokens cannot be approved");
    }

    /**
     * @dev Override getApproved to always return zero address
     */
    function getApproved(uint256) public pure override(ERC721, IERC721) returns (address) {
        return address(0);
    }

    /**
     * @dev Override isApprovedForAll to always return false
     */
    function isApprovedForAll(address, address) public pure override(ERC721, IERC721) returns (bool) {
        return false;
    }

    /**
     * @dev Get next token ID
     */
    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // Override required functions
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}