//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IssuerRegistry.sol";
import "./SBTTemplate.sol";
import "./SBTSession.sol";

/**
 * @title SBTToken
 * @dev Soulbound Token (Non-transferable ERC721) implementation with template and session-based minting
 * @author SBT System POC
 */
contract SBTToken is ERC721, ERC721Enumerable, Ownable, Pausable, ReentrancyGuard {

    struct SBTData {
        string name;
        string description;
        address issuer;
        uint256 mintedAt;
        uint256 templateId;
        bytes32 sessionId;
        bool revoked;
    }

    // Contract references
    IssuerRegistry public immutable issuerRegistry;
    SBTTemplate public immutable sbtTemplate;
    SBTSession public immutable sbtSession;

    // Counter for token IDs
    uint256 private _nextTokenId = 1;

    // Mapping from token ID to SBT data
    mapping(uint256 => SBTData) public sbtData;

    // Mapping to track if user already has SBT from specific template (prevents duplicates)
    mapping(address => mapping(uint256 => bool)) public hasTokenFromTemplate;

    // Mapping to track if user already has SBT from specific session (prevents duplicates)
    mapping(address => mapping(bytes32 => bool)) public hasTokenFromSession;

    // Events
    event SBTMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        uint256 indexed templateId,
        bytes32 sessionId,
        address issuer,
        string name,
        string description,
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
        uint256 indexed templateId,
        bytes32 indexed sessionId,
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
        require(!sbtData[tokenId].revoked, "SBTToken: Token has been revoked");
        _;
    }

    constructor(
        address _owner,
        address _issuerRegistry,
        address _sbtTemplate,
        address _sbtSession
    ) ERC721("Soulbound Token", "SBT") Ownable(_owner) {
        require(_issuerRegistry != address(0), "SBTToken: Invalid registry address");
        require(_sbtTemplate != address(0), "SBTToken: Invalid template address");
        require(_sbtSession != address(0), "SBTToken: Invalid session address");

        issuerRegistry = IssuerRegistry(_issuerRegistry);
        sbtTemplate = SBTTemplate(_sbtTemplate);
        sbtSession = SBTSession(_sbtSession);
    }

    /**
     * @dev Mint SBT from a template (direct minting by issuer)
     * @param to Address of the recipient
     * @param templateId Template ID to mint from
     */
    function mintFromTemplate(
        address to,
        uint256 templateId
    ) external onlyAuthorizedIssuer whenNotPaused nonReentrant {
        require(to != address(0), "SBTToken: Cannot mint to zero address");
        require(sbtTemplate.isTemplateActive(templateId), "SBTToken: Template is not active");
        require(!hasTokenFromTemplate[to][templateId], "SBTToken: User already has token from this template");

        SBTTemplate.Template memory template = sbtTemplate.getTemplate(templateId);
        require(template.issuer == msg.sender, "SBTToken: Not template owner");

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);

        sbtData[tokenId] = SBTData({
            name: template.name,
            description: template.description,
            issuer: msg.sender,
            mintedAt: block.timestamp,
            templateId: templateId,
            sessionId: bytes32(0),
            revoked: false
        });

        hasTokenFromTemplate[to][templateId] = true;

        emit SBTMinted(
            to,
            tokenId,
            templateId,
            bytes32(0),
            msg.sender,
            template.name,
            template.description,
            block.timestamp
        );
    }

    /**
     * @dev Mint SBT from a session (for QR code claims)
     * @param to Address of the recipient
     * @param sessionId Session ID to mint from
     */
    function mintFromSession(
        address to,
        bytes32 sessionId
    ) external onlyAuthorizedIssuer whenNotPaused nonReentrant {
        require(to != address(0), "SBTToken: Cannot mint to zero address");
        require(sbtSession.isSessionClaimable(sessionId), "SBTToken: Session is not claimable");
        require(!hasTokenFromSession[to][sessionId], "SBTToken: User already has token from this session");

        SBTSession.Session memory session = sbtSession.getSession(sessionId);
        require(session.issuer == msg.sender, "SBTToken: Not session owner");

        SBTTemplate.Template memory template = sbtTemplate.getTemplate(session.templateId);

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);

        sbtData[tokenId] = SBTData({
            name: template.name,
            description: template.description,
            issuer: msg.sender,
            mintedAt: block.timestamp,
            templateId: session.templateId,
            sessionId: sessionId,
            revoked: false
        });

        hasTokenFromSession[to][sessionId] = true;
        hasTokenFromTemplate[to][session.templateId] = true;

        // Increment session mint count
        sbtSession.incrementMintCount(sessionId);

        emit SBTMinted(
            to,
            tokenId,
            session.templateId,
            sessionId,
            msg.sender,
            template.name,
            template.description,
            block.timestamp
        );
    }

    /**
     * @dev Batch mint SBTs from a session to multiple recipients
     * @param recipients Array of recipient addresses
     * @param sessionId Session ID to mint from
     */
    function batchMintFromSession(
        address[] memory recipients,
        bytes32 sessionId
    ) external onlyAuthorizedIssuer whenNotPaused nonReentrant {
        require(recipients.length > 0, "SBTToken: Empty recipients array");
        require(recipients.length <= 100, "SBTToken: Batch size too large"); // Gas limit protection
        require(sbtSession.isSessionClaimable(sessionId), "SBTToken: Session is not claimable");

        SBTSession.Session memory session = sbtSession.getSession(sessionId);
        require(session.issuer == msg.sender, "SBTToken: Not session owner");

        // Check if there are enough mints available
        (uint256 currentMints, uint256 maxMints,,) = sbtSession.getSessionStats(sessionId);
        require(currentMints + recipients.length <= maxMints, "SBTToken: Exceeds session mint limit");

        SBTTemplate.Template memory template = sbtTemplate.getTemplate(session.templateId);
        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            require(to != address(0), "SBTToken: Cannot mint to zero address");
            require(!hasTokenFromSession[to][sessionId], "SBTToken: User already has token from this session");

            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;

            _safeMint(to, tokenId);

            sbtData[tokenId] = SBTData({
                name: template.name,
                description: template.description,
                issuer: msg.sender,
                mintedAt: block.timestamp,
                templateId: session.templateId,
                sessionId: sessionId,
                revoked: false
            });

            hasTokenFromSession[to][sessionId] = true;
            hasTokenFromTemplate[to][session.templateId] = true;

            emit SBTMinted(
                to,
                tokenId,
                session.templateId,
                sessionId,
                msg.sender,
                template.name,
                template.description,
                block.timestamp
            );
        }

        // Update session mint count
        for (uint256 i = 0; i < recipients.length; i++) {
            sbtSession.incrementMintCount(sessionId);
        }

        emit BatchSBTMinted(recipients, tokenIds, session.templateId, sessionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Self-service claim SBT from a session (users can mint directly)
     * @param sessionId Session ID to claim from
     */
    function claimFromSession(bytes32 sessionId) external whenNotPaused nonReentrant {
        require(sbtSession.isSessionClaimable(sessionId), "SBTToken: Session is not claimable");
        require(!hasTokenFromSession[msg.sender][sessionId], "SBTToken: User already has token from this session");

        SBTSession.Session memory session = sbtSession.getSession(sessionId);
        SBTTemplate.Template memory template = sbtTemplate.getTemplate(session.templateId);

        uint256 tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        sbtData[tokenId] = SBTData({
            name: template.name,
            description: template.description,
            issuer: session.issuer, // Keep original issuer from session
            mintedAt: block.timestamp,
            templateId: session.templateId,
            sessionId: sessionId,
            revoked: false
        });

        hasTokenFromSession[msg.sender][sessionId] = true;
        hasTokenFromTemplate[msg.sender][session.templateId] = true;

        // Increment session mint count
        sbtSession.incrementMintCount(sessionId);

        emit SBTMinted(
            msg.sender,
            tokenId,
            session.templateId,
            sessionId,
            session.issuer, // Emit original issuer
            template.name,
            template.description,
            block.timestamp
        );
    }

    /**
     * @dev Revoke an SBT (can only be done by issuer or owner)
     * @param tokenId ID of the token to revoke
     */
    function revokeSBT(uint256 tokenId) external validToken(tokenId) whenNotPaused {
        require(
            msg.sender == sbtData[tokenId].issuer || msg.sender == owner(),
            "SBTToken: Not authorized to revoke"
        );

        address tokenOwner = ownerOf(tokenId);
        uint256 templateId = sbtData[tokenId].templateId;
        bytes32 sessionId = sbtData[tokenId].sessionId;

        sbtData[tokenId].revoked = true;
        hasTokenFromTemplate[tokenOwner][templateId] = false;

        if (sessionId != bytes32(0)) {
            hasTokenFromSession[tokenOwner][sessionId] = false;
        }

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
     * @return SBTData struct with all token information
     */
    function getSBTInfo(uint256 tokenId) external view returns (SBTData memory) {
        require(_ownerOf(tokenId) != address(0), "SBTToken: Token does not exist");
        return sbtData[tokenId];
    }

    /**
     * @dev Get SBT basic info
     * @param tokenId Token ID to query
     * @return name Token name
     * @return description Token description
     * @return issuer Issuer address
     * @return mintedAt Mint timestamp
     * @return revoked Revocation status
     */
    function getSBTBasicInfo(uint256 tokenId) external view returns (
        string memory name,
        string memory description,
        address issuer,
        uint256 mintedAt,
        bool revoked
    ) {
        require(_ownerOf(tokenId) != address(0), "SBTToken: Token does not exist");
        SBTData memory data = sbtData[tokenId];
        return (data.name, data.description, data.issuer, data.mintedAt, data.revoked);
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}