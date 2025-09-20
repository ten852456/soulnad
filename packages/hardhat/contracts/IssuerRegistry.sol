//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IssuerRegistry
 * @dev Contract to manage authorized SBT issuers
 * @author SBT System POC
 */
contract IssuerRegistry is Ownable, Pausable {
    struct IssuerInfo {
        string name;
        string organization;
        bool authorized;
        uint256 addedAt;
    }

    // Mapping from issuer address to issuer info
    mapping(address => IssuerInfo) private issuers;

    // Array to track all issuer addresses for enumeration
    address[] public issuerAddresses;

    // Mapping to track if address is in the array (for gas optimization)
    mapping(address => bool) private isInArray;

    // Events
    event IssuerAdded(
        address indexed issuer,
        string name,
        string organization,
        uint256 timestamp
    );

    event IssuerRemoved(
        address indexed issuer,
        uint256 timestamp
    );

    event IssuerUpdated(
        address indexed issuer,
        string name,
        string organization,
        uint256 timestamp
    );

    constructor(address _owner) Ownable(_owner) {
        // Add the owner as the first authorized issuer
        _addIssuerInternal(_owner, "System Admin", "SBT System");
    }

    /**
     * @dev Add a new authorized issuer
     * @param issuer Address of the issuer
     * @param name Name of the issuer
     * @param organization Organization name
     */
    function addIssuer(
        address issuer,
        string memory name,
        string memory organization
    ) external onlyOwner whenNotPaused {
        require(issuer != address(0), "IssuerRegistry: Invalid issuer address");
        require(bytes(name).length > 0, "IssuerRegistry: Name cannot be empty");
        require(!issuers[issuer].authorized, "IssuerRegistry: Issuer already exists");

        _addIssuerInternal(issuer, name, organization);
    }

    /**
     * @dev Internal function to add issuer
     */
    function _addIssuerInternal(
        address issuer,
        string memory name,
        string memory organization
    ) internal {
        issuers[issuer] = IssuerInfo({
            name: name,
            organization: organization,
            authorized: true,
            addedAt: block.timestamp
        });

        if (!isInArray[issuer]) {
            issuerAddresses.push(issuer);
            isInArray[issuer] = true;
        }

        emit IssuerAdded(issuer, name, organization, block.timestamp);
    }

    /**
     * @dev Remove an authorized issuer
     * @param issuer Address of the issuer to remove
     */
    function removeIssuer(address issuer) external onlyOwner whenNotPaused {
        require(issuer != address(0), "IssuerRegistry: Invalid issuer address");
        require(issuers[issuer].authorized, "IssuerRegistry: Issuer not found");
        require(issuer != owner(), "IssuerRegistry: Cannot remove owner");

        issuers[issuer].authorized = false;

        emit IssuerRemoved(issuer, block.timestamp);
    }

    /**
     * @dev Update issuer information
     * @param issuer Address of the issuer
     * @param name New name
     * @param organization New organization
     */
    function updateIssuer(
        address issuer,
        string memory name,
        string memory organization
    ) external onlyOwner whenNotPaused {
        require(issuer != address(0), "IssuerRegistry: Invalid issuer address");
        require(issuers[issuer].authorized, "IssuerRegistry: Issuer not found");
        require(bytes(name).length > 0, "IssuerRegistry: Name cannot be empty");

        issuers[issuer].name = name;
        issuers[issuer].organization = organization;

        emit IssuerUpdated(issuer, name, organization, block.timestamp);
    }

    /**
     * @dev Check if an address is an authorized issuer
     * @param issuer Address to check
     * @return bool True if authorized, false otherwise
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return issuers[issuer].authorized;
    }

    /**
     * @dev Get issuer information
     * @param issuer Address of the issuer
     * @return IssuerInfo struct containing issuer details
     */
    function getIssuerInfo(address issuer) external view returns (IssuerInfo memory) {
        return issuers[issuer];
    }

    /**
     * @dev Get all authorized issuer addresses
     * @return address[] Array of all issuer addresses
     */
    function getAllIssuers() external view returns (address[] memory) {
        uint256 authorizedCount = 0;

        // Count authorized issuers
        for (uint256 i = 0; i < issuerAddresses.length; i++) {
            if (issuers[issuerAddresses[i]].authorized) {
                authorizedCount++;
            }
        }

        // Create array of authorized issuers
        address[] memory authorizedIssuers = new address[](authorizedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < issuerAddresses.length; i++) {
            if (issuers[issuerAddresses[i]].authorized) {
                authorizedIssuers[index] = issuerAddresses[i];
                index++;
            }
        }

        return authorizedIssuers;
    }

    /**
     * @dev Get total count of authorized issuers
     * @return uint256 Count of authorized issuers
     */
    function getAuthorizedIssuerCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < issuerAddresses.length; i++) {
            if (issuers[issuerAddresses[i]].authorized) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}