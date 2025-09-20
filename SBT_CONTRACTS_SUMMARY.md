# SBT System Smart Contracts Summary

## Overview
The SBT (Soulbound Token) system consists of two interconnected smart contracts that enable the creation and management of non-transferable NFTs on the Monad blockchain.

## Contract Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  IssuerRegistry │◄────────┤    SBTToken      │
│                 │         │                  │
│ Manages         │         │ Mints/Manages    │
│ Authorized      │         │ Soulbound Tokens │
│ Issuers         │         │                  │
└─────────────────┘         └──────────────────┘
```

---

## 1. IssuerRegistry.sol

**Purpose**: Centralized registry to manage who can issue Soulbound Tokens

### Core Functions

#### Issuer Management
- **`addIssuer(address issuer, string name, string organization)`**
  - Adds a new authorized issuer
  - Only contract owner can call
  - Prevents duplicate issuers
  - Emits `IssuerAdded` event

- **`removeIssuer(address issuer)`**
  - Removes issuer authorization (but doesn't delete from array)
  - Only owner can call, cannot remove owner itself
  - Emits `IssuerRemoved` event

- **`updateIssuer(address issuer, string name, string organization)`**
  - Updates issuer information
  - Only owner can call
  - Emits `IssuerUpdated` event

#### Query Functions
- **`isAuthorizedIssuer(address issuer) → bool`**
  - **CRITICAL**: Used by SBTToken to verify issuer permissions
  - Returns true if address can mint SBTs

- **`getIssuerInfo(address issuer) → IssuerInfo`**
  - Returns complete issuer details (name, organization, authorized status, addedAt timestamp)

- **`getAllIssuers() → address[]`**
  - Returns array of all currently authorized issuers
  - Filters out removed issuers

- **`getAuthorizedIssuerCount() → uint256`**
  - Returns count of active authorized issuers

#### Administrative Functions
- **`pause()` / `unpause()`**
  - Emergency stops for contract operations
  - Only owner can call

### Data Structures
```solidity
struct IssuerInfo {
    string name;           // Human-readable name
    string organization;   // Organization name
    bool authorized;       // Authorization status
    uint256 addedAt;      // Timestamp when added
}
```

---

## 2. SBTToken.sol

**Purpose**: ERC721-based non-transferable token with soulbound properties

### Core Functions

#### Minting Functions
- **`mintSBT(address to, string uri)`**
  - Mints single SBT to recipient
  - **Requires**: Caller must be authorized issuer (checks IssuerRegistry)
  - **Prevents**: Duplicate tokens from same issuer to same user
  - **Auto-increments**: Token IDs starting from 1
  - Emits `SBTMinted` event

- **`batchMintSBT(address[] recipients, string[] uris)`**
  - Batch mints up to 100 SBTs in single transaction
  - **Gas optimized**: Single transaction for multiple mints
  - Same validation as single mint for each token
  - Emits individual `SBTMinted` + `BatchSBTMinted` events

#### Revocation Functions
- **`revokeSBT(uint256 tokenId)`**
  - Revokes (burns) an SBT
  - **Authorized**: Token issuer OR contract owner
  - **Effect**: Allows user to receive new SBT from same issuer
  - Emits `SBTRevoked` event

#### Query Functions
- **`getUserSBTs(address owner) → uint256[]`**
  - Returns all token IDs owned by an address
  - **Frontend Use**: Display user's SBT collection

- **`getSBTInfo(uint256 tokenId) → (address owner, address issuer, uint256 mintTime, bool revoked, string uri)`**
  - Returns complete token information
  - **Frontend Use**: Display token details and verification

- **`tokenIssuer(uint256 tokenId) → address`**
  - Returns who issued the token
  - **Frontend Use**: Display issuer information

- **`tokenRevoked(uint256 tokenId) → bool`**
  - Check if token has been revoked

- **`hasTokenFromIssuer(address user, address issuer) → bool`**
  - Check if user already has token from specific issuer
  - **Prevents**: Duplicate issuance

#### Soulbound Properties (Override Standard ERC721)
- **`approve()` / `setApprovalForAll()`** → **REVERTS**
  - Prevents any approval mechanisms

- **`transferFrom()` / `safeTransferFrom()`** → **REVERTS**
  - Prevents all transfers between addresses
  - **Exception**: Allows minting (from 0x0) and burning (to 0x0)

- **`getApproved()` → `address(0)`**
  - Always returns zero address

- **`isApprovedForAll()` → `false`**
  - Always returns false

#### Administrative Functions
- **`pause()` / `unpause()`**
  - Emergency stops for minting/revoking
  - Only owner can call

### Data Tracking
```solidity
mapping(uint256 => address) public tokenIssuer;    // Token ID → Issuer address
mapping(uint256 => uint256) public tokenMintTime;  // Token ID → Mint timestamp
mapping(uint256 => bool) public tokenRevoked;      // Token ID → Revoked status
mapping(address => mapping(address => bool)) public hasTokenFromIssuer; // User → Issuer → Has token
```

---

## Contract Interconnection

### How They Work Together

1. **Authorization Flow**:
   ```
   Frontend → IssuerRegistry.isAuthorizedIssuer() → Returns bool
   Frontend → SBTToken.mintSBT() → Calls IssuerRegistry.isAuthorizedIssuer()
   ```

2. **Minting Process**:
   ```
   1. User connects wallet
   2. Frontend checks if wallet is authorized issuer
   3. If authorized, user can access minting interface
   4. SBTToken contract double-checks authorization via IssuerRegistry
   5. If valid, mint succeeds
   ```

3. **Security Model**:
   - **IssuerRegistry**: Single source of truth for issuer permissions
   - **SBTToken**: Always validates against IssuerRegistry before minting
   - **Owner Control**: Contract owner can manage issuers and emergency pause

---

## Frontend Integration Points

### For Client Dashboard (`/client`)
```javascript
// Get user's SBTs
const tokenIds = await sbtToken.getUserSBTs(userAddress);

// Get each token's details
for (const tokenId of tokenIds) {
  const [owner, issuer, mintTime, revoked, uri] = await sbtToken.getSBTInfo(tokenId);
  // Fetch metadata from IPFS using uri
}
```

### For Issuer Dashboard (`/issuer`)
```javascript
// Check if user is authorized issuer
const isAuthorized = await issuerRegistry.isAuthorizedIssuer(userAddress);

// Get issuer info
const issuerInfo = await issuerRegistry.getIssuerInfo(userAddress);
```

### For Minting (`/create`, `/mint`)
```javascript
// Single mint
await sbtToken.mintSBT(recipientAddress, ipfsUri);

// Batch mint
await sbtToken.batchMintSBT(addressArray, uriArray);
```

### For QR Code Claims (`/claim/:metadataHash`)
```javascript
// Check if user already has token from this issuer
const hasToken = await sbtToken.hasTokenFromIssuer(userAddress, issuerAddress);

if (!hasToken) {
  await sbtToken.mintSBT(userAddress, ipfsUri);
}
```

---

## Key Features Summary

### ✅ Non-Transferable (Soulbound)
- Cannot be transferred, sold, or traded
- Bound to the recipient's address permanently
- Can only be revoked by issuer or contract owner

### ✅ Authorization Control
- Only authorized issuers can mint tokens
- Central registry manages issuer permissions
- Owner can add/remove/update issuers

### ✅ Duplicate Prevention
- One SBT per issuer per user maximum
- Prevents spam and duplicate credentials
- Allows re-issuance after revocation

### ✅ Gas Optimization
- Batch minting for events (up to 100 tokens)
- Efficient storage patterns
- Reasonable deployment costs (2.4M gas)

### ✅ Emergency Controls
- Pausable functionality for both contracts
- Owner can revoke any SBT
- Safe upgrade patterns

### ✅ IPFS Integration
- Token metadata stored on IPFS
- Decentralized and persistent storage
- Standard NFT metadata format

---

## Events for Frontend Monitoring

### IssuerRegistry Events
```solidity
event IssuerAdded(address indexed issuer, string name, string organization, uint256 timestamp);
event IssuerRemoved(address indexed issuer, uint256 timestamp);
event IssuerUpdated(address indexed issuer, string name, string organization, uint256 timestamp);
```

### SBTToken Events
```solidity
event SBTMinted(address indexed recipient, uint256 indexed tokenId, string tokenURI, address indexed issuer, uint256 timestamp);
event SBTRevoked(uint256 indexed tokenId, address indexed revoker, uint256 timestamp);
event BatchSBTMinted(address[] recipients, uint256[] tokenIds, string[] tokenURIs, address indexed issuer, uint256 timestamp);
```

These events enable real-time frontend updates and comprehensive activity tracking.