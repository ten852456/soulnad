// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IssuerRegistry.sol";

/**
 * @title SBTTemplate
 * @dev Contract for managing SBT templates that can be used to mint tokens
 */
contract SBTTemplate is Ownable, Pausable {
    struct Template {
        uint256 templateId;
        string name;
        string description;
        address issuer;
        uint256 createdAt;
        bool active;
    }

    // State variables
    uint256 private _templateIdCounter;
    mapping(uint256 => Template) public templates;
    mapping(address => uint256[]) public issuerTemplates;

    IssuerRegistry public immutable issuerRegistry;

    // Events
    event TemplateCreated(
        uint256 indexed templateId,
        address indexed issuer,
        string name,
        string description
    );

    event TemplateUpdated(
        uint256 indexed templateId,
        string name,
        string description
    );

    event TemplateDeactivated(uint256 indexed templateId);
    event TemplateReactivated(uint256 indexed templateId);

    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(
            issuerRegistry.isAuthorizedIssuer(msg.sender),
            "SBTTemplate: caller is not an authorized issuer"
        );
        _;
    }

    modifier templateExists(uint256 templateId) {
        require(templateId <= _templateIdCounter && templateId > 0, "SBTTemplate: template does not exist");
        _;
    }

    modifier onlyTemplateIssuer(uint256 templateId) {
        require(templates[templateId].issuer == msg.sender, "SBTTemplate: not template issuer");
        _;
    }

    constructor(address _issuerRegistry) Ownable(msg.sender) {
        require(_issuerRegistry != address(0), "SBTTemplate: invalid issuer registry address");
        issuerRegistry = IssuerRegistry(_issuerRegistry);
        _templateIdCounter = 0;
    }

    /**
     * @dev Create a new SBT template
     * @param name The name for the SBT template
     * @param description The description for the SBT template
     * @return templateId The ID of the created template
     */
    function createTemplate(
        string memory name,
        string memory description
    ) external onlyAuthorizedIssuer whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "SBTTemplate: name cannot be empty");
        require(bytes(description).length > 0, "SBTTemplate: description cannot be empty");

        _templateIdCounter++;
        uint256 templateId = _templateIdCounter;

        templates[templateId] = Template({
            templateId: templateId,
            name: name,
            description: description,
            issuer: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        issuerTemplates[msg.sender].push(templateId);

        emit TemplateCreated(templateId, msg.sender, name, description);

        return templateId;
    }

    /**
     * @dev Update an existing template
     * @param templateId The ID of the template to update
     * @param name The new name for the template
     * @param description The new description for the template
     */
    function updateTemplate(
        uint256 templateId,
        string memory name,
        string memory description
    ) external templateExists(templateId) onlyTemplateIssuer(templateId) whenNotPaused {
        require(bytes(name).length > 0, "SBTTemplate: name cannot be empty");
        require(bytes(description).length > 0, "SBTTemplate: description cannot be empty");
        require(templates[templateId].active, "SBTTemplate: template is not active");

        templates[templateId].name = name;
        templates[templateId].description = description;

        emit TemplateUpdated(templateId, name, description);
    }

    /**
     * @dev Deactivate a template
     * @param templateId The ID of the template to deactivate
     */
    function deactivateTemplate(uint256 templateId)
        external
        templateExists(templateId)
        onlyTemplateIssuer(templateId)
        whenNotPaused
    {
        require(templates[templateId].active, "SBTTemplate: template already inactive");

        templates[templateId].active = false;
        emit TemplateDeactivated(templateId);
    }

    /**
     * @dev Reactivate a template
     * @param templateId The ID of the template to reactivate
     */
    function reactivateTemplate(uint256 templateId)
        external
        templateExists(templateId)
        onlyTemplateIssuer(templateId)
        whenNotPaused
    {
        require(!templates[templateId].active, "SBTTemplate: template already active");

        templates[templateId].active = true;
        emit TemplateReactivated(templateId);
    }

    /**
     * @dev Get template details
     * @param templateId The ID of the template
     * @return Template struct with all template data
     */
    function getTemplate(uint256 templateId)
        external
        view
        templateExists(templateId)
        returns (Template memory)
    {
        return templates[templateId];
    }

    /**
     * @dev Get all template IDs for an issuer
     * @param issuer The address of the issuer
     * @return Array of template IDs
     */
    function getIssuerTemplates(address issuer) external view returns (uint256[] memory) {
        return issuerTemplates[issuer];
    }

    /**
     * @dev Get total number of templates created
     * @return The total template count
     */
    function getTotalTemplates() external view returns (uint256) {
        return _templateIdCounter;
    }

    /**
     * @dev Check if a template is active and exists
     * @param templateId The ID of the template
     * @return Boolean indicating if template is active
     */
    function isTemplateActive(uint256 templateId) external view returns (bool) {
        if (templateId > _templateIdCounter || templateId == 0) {
            return false;
        }
        return templates[templateId].active;
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}