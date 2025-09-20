// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IssuerRegistry.sol";
import "./SBTTemplate.sol";

/**
 * @title SBTSession
 * @dev Contract for managing time-limited SBT minting sessions with unique IDs
 */
contract SBTSession is Ownable, Pausable {
    struct Session {
        bytes32 sessionId;
        uint256 templateId;
        uint256 maxMints;
        uint256 currentMints;
        uint256 endTimestamp;
        address issuer;
        bool active;
        string title; // Optional session title for UI
    }

    // State variables
    mapping(bytes32 => Session) public sessions;
    mapping(bytes32 => mapping(address => bool)) public hasClaimed;
    mapping(address => bytes32[]) public issuerSessions;

    // For tracking unique session generation
    uint256 private _sessionNonce;

    IssuerRegistry public immutable issuerRegistry;
    SBTTemplate public immutable sbtTemplate;
    address public sbtTokenContract;

    // Events
    event SessionCreated(
        bytes32 indexed sessionId,
        uint256 indexed templateId,
        address indexed issuer,
        uint256 maxMints,
        uint256 endTimestamp,
        string title
    );

    event SessionClaimed(
        bytes32 indexed sessionId,
        address indexed claimer,
        uint256 remainingMints
    );

    event SessionEnded(bytes32 indexed sessionId, address indexed issuer);
    event SessionMintIncreased(bytes32 indexed sessionId, uint256 newCurrentMints);

    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(
            issuerRegistry.isAuthorizedIssuer(msg.sender),
            "SBTSession: caller is not an authorized issuer"
        );
        _;
    }

    modifier sessionExists(bytes32 sessionId) {
        require(sessions[sessionId].issuer != address(0), "SBTSession: session does not exist");
        _;
    }

    modifier onlySessionIssuer(bytes32 sessionId) {
        require(sessions[sessionId].issuer == msg.sender, "SBTSession: not session issuer");
        _;
    }

    modifier sessionActive(bytes32 sessionId) {
        require(sessions[sessionId].active, "SBTSession: session is not active");
        require(block.timestamp <= sessions[sessionId].endTimestamp, "SBTSession: session has expired");
        require(sessions[sessionId].currentMints < sessions[sessionId].maxMints, "SBTSession: session mint limit reached");
        _;
    }

    modifier onlySBTToken() {
        require(msg.sender == sbtTokenContract, "SBTSession: caller is not the SBT token contract");
        _;
    }

    constructor(address _issuerRegistry, address _sbtTemplate) Ownable(msg.sender) {
        require(_issuerRegistry != address(0), "SBTSession: invalid issuer registry address");
        require(_sbtTemplate != address(0), "SBTSession: invalid SBT template address");

        issuerRegistry = IssuerRegistry(_issuerRegistry);
        sbtTemplate = SBTTemplate(_sbtTemplate);
        _sessionNonce = 0;
    }

    /**
     * @dev Set the SBTToken contract address (only owner can call this)
     * @param _sbtTokenContract Address of the SBTToken contract
     */
    function setSBTTokenContract(address _sbtTokenContract) external onlyOwner {
        require(_sbtTokenContract != address(0), "SBTSession: invalid SBT token contract address");
        sbtTokenContract = _sbtTokenContract;
    }

    /**
     * @dev Generate a unique session ID
     * @param templateId The template ID for this session
     * @param maxMints Maximum number of mints allowed
     * @param endTimestamp When the session expires
     * @param title Optional session title
     * @return sessionId Unique session identifier
     */
    function generateUniqueSessionId(
        uint256 templateId,
        uint256 maxMints,
        uint256 endTimestamp,
        string memory title
    ) private returns (bytes32) {
        _sessionNonce++;
        return keccak256(
            abi.encodePacked(
                msg.sender,
                templateId,
                maxMints,
                endTimestamp,
                title,
                block.timestamp,
                block.prevrandao,
                _sessionNonce
            )
        );
    }

    /**
     * @dev Create a new minting session
     * @param templateId The template ID to use for minting
     * @param maxMints Maximum number of tokens that can be minted in this session
     * @param durationInSeconds How long the session should last
     * @param title Optional title for the session
     * @return sessionId The unique session identifier
     */
    function createSession(
        uint256 templateId,
        uint256 maxMints,
        uint256 durationInSeconds,
        string memory title
    ) external onlyAuthorizedIssuer whenNotPaused returns (bytes32) {
        require(sbtTemplate.isTemplateActive(templateId), "SBTSession: template is not active");
        require(maxMints > 0, "SBTSession: max mints must be greater than 0");
        require(durationInSeconds > 0, "SBTSession: duration must be greater than 0");

        SBTTemplate.Template memory template = sbtTemplate.getTemplate(templateId);
        require(template.issuer == msg.sender, "SBTSession: not template owner");

        uint256 endTimestamp = block.timestamp + durationInSeconds;
        bytes32 sessionId = generateUniqueSessionId(templateId, maxMints, endTimestamp, title);

        // Ensure uniqueness (should be extremely rare to have collisions)
        require(sessions[sessionId].issuer == address(0), "SBTSession: session ID collision");

        sessions[sessionId] = Session({
            sessionId: sessionId,
            templateId: templateId,
            maxMints: maxMints,
            currentMints: 0,
            endTimestamp: endTimestamp,
            issuer: msg.sender,
            active: true,
            title: title
        });

        issuerSessions[msg.sender].push(sessionId);

        emit SessionCreated(sessionId, templateId, msg.sender, maxMints, endTimestamp, title);

        return sessionId;
    }

    // Note: claimFromSession is now handled directly in SBTToken.claimFromSession()
    // This removes the two-step process of claim -> mint

    /**
     * @dev Increment mint count (called by SBTToken contract)
     * @param sessionId The session to increment
     */
    function incrementMintCount(bytes32 sessionId)
        external
        onlySBTToken
        sessionExists(sessionId)
    {
        // Only the SBTToken contract can call this
        sessions[sessionId].currentMints++;
        emit SessionMintIncreased(sessionId, sessions[sessionId].currentMints);
    }

    /**
     * @dev End a session early (only by issuer)
     * @param sessionId The session to end
     */
    function endSession(bytes32 sessionId)
        external
        sessionExists(sessionId)
        onlySessionIssuer(sessionId)
        whenNotPaused
    {
        require(sessions[sessionId].active, "SBTSession: session already ended");

        sessions[sessionId].active = false;
        emit SessionEnded(sessionId, msg.sender);
    }

    /**
     * @dev Get session details
     * @param sessionId The session ID
     * @return Session struct with all session data
     */
    function getSession(bytes32 sessionId)
        external
        view
        sessionExists(sessionId)
        returns (Session memory)
    {
        return sessions[sessionId];
    }

    /**
     * @dev Get all session IDs for an issuer
     * @param issuer The address of the issuer
     * @return Array of session IDs
     */
    function getIssuerSessions(address issuer) external view returns (bytes32[] memory) {
        return issuerSessions[issuer];
    }

    /**
     * @dev Check if an address has claimed from a session
     * @param sessionId The session ID
     * @param claimer The address to check
     * @return Boolean indicating if address has claimed
     */
    function hasClaimedFromSession(bytes32 sessionId, address claimer)
        external
        view
        returns (bool)
    {
        return hasClaimed[sessionId][claimer];
    }

    /**
     * @dev Check if a session is currently active and can accept claims
     * @param sessionId The session ID
     * @return Boolean indicating if session is claimable
     */
    function isSessionClaimable(bytes32 sessionId) external view returns (bool) {
        if (sessions[sessionId].issuer == address(0)) return false;
        if (!sessions[sessionId].active) return false;
        if (block.timestamp > sessions[sessionId].endTimestamp) return false;
        if (sessions[sessionId].currentMints >= sessions[sessionId].maxMints) return false;
        return true;
    }

    /**
     * @dev Get session statistics
     * @param sessionId The session ID
     * @return currentMints Current number of mints
     * @return maxMints Maximum number of mints allowed
     * @return remainingMints Number of mints remaining
     * @return timeRemaining Seconds until session expires
     */
    function getSessionStats(bytes32 sessionId)
        external
        view
        sessionExists(sessionId)
        returns (
            uint256 currentMints,
            uint256 maxMints,
            uint256 remainingMints,
            uint256 timeRemaining
        )
    {
        Session memory session = sessions[sessionId];
        currentMints = session.currentMints;
        maxMints = session.maxMints;
        remainingMints = maxMints > currentMints ? maxMints - currentMints : 0;
        timeRemaining = session.endTimestamp > block.timestamp ? session.endTimestamp - block.timestamp : 0;
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}