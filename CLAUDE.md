# SBT System POC - Claude Development Rules

## Project Overview
**SBT System POC** - Soulbound Token System Proof of Concept for Monad Bitz 2025
- **Duration**: 3-4 hours hackathon project
- **Deployment**: Monad Testnet/Mainnet
- **Tech Stack**: Scaffold-ETH2, Next.js, React, TypeScript, Solidity, Hardhat, RainbowKit, Wagmi

## Architecture
- **Type**: Full Stack DApp
- **Frontend**: Next.js with Scaffold-ETH2 (App Router, not Pages Router)
- **Backend**: Smart Contracts on Monad (EVM Compatible)
- **Wallet**: RainbowKit integration
- **Storage**: On-chain metadata (name, description) + Template/Session system
- **External Libraries**: qrcode.js, @openzeppelin/contracts

## Development Commands
Always use these commands for development workflow:
- `yarn chain` - Start local blockchain
- `yarn deploy` - Deploy contracts
- `yarn start` - Start frontend
- `yarn test` - Run contract tests
- `yarn lint` - Run linting
- `yarn typecheck` - Run TypeScript checks

## Smart Contract Architecture

### SBTToken.sol (`contracts/SBTToken.sol`)
**Standard**: ERC721 with non-transferable modification + Template/Session system
**Key Functions**:
- `mintFromTemplate(address to, uint256 templateId)` - Direct minting by issuer
- `mintFromSession(address to, bytes32 sessionId)` - QR code claim minting (issuer-only)
- `claimFromSession(bytes32 sessionId)` - **Self-service minting** by users
- `batchMintFromSession(address[] recipients, bytes32 sessionId)` - Batch minting
- `revokeSBT(uint256 tokenId)` - Revoke token
- `getUserSBTs(address owner)` - Get user's tokens
- `getSBTInfo(uint256 tokenId)` - Get token details

**Data Structure**:
```solidity
struct SBTData {
    string name;
    string description;
    address issuer;
    uint256 mintedAt;
    uint256 templateId;
    bytes32 sessionId;
    bool revoked;
}
```

**Events**:
- `SBTMinted(address indexed recipient, uint256 indexed tokenId, uint256 indexed templateId, bytes32 sessionId, ...)`
- `SBTRevoked(uint256 indexed tokenId, address indexed revoker, uint256 timestamp)`
- `BatchSBTMinted(address[] recipients, uint256[] tokenIds, uint256 indexed templateId, bytes32 indexed sessionId, ...)`

### SBTTemplate.sol (`contracts/SBTTemplate.sol`)
**Purpose**: Manage reusable SBT templates
**Key Functions**:
- `createTemplate(string name, string description)` - Create new template
- `updateTemplate(uint256 templateId, string name, string description)` - Update template
- `getTemplate(uint256 templateId)` - Get template details
- `getIssuerTemplates(address issuer)` - Get issuer's templates
- `isTemplateActive(uint256 templateId)` - Check if template is active

**Data Structure**:
```solidity
struct Template {
    uint256 templateId;
    string name;
    string description;
    address issuer;
    uint256 createdAt;
    bool active;
}
```

### SBTSession.sol (`contracts/SBTSession.sol`)
**Purpose**: Manage time-limited minting sessions with unique IDs
**Key Functions**:
- `createSession(uint256 templateId, uint256 maxMints, uint256 durationInSeconds, string title)` - Create session
- `claimFromSession(bytes32 sessionId)` - User claims spot in session
- `getSession(bytes32 sessionId)` - Get session details
- `isSessionClaimable(bytes32 sessionId)` - Check if session is active
- `getSessionStats(bytes32 sessionId)` - Get session statistics

**Data Structure**:
```solidity
struct Session {
    bytes32 sessionId;        // Unique hash-based ID
    uint256 templateId;
    uint256 maxMints;
    uint256 currentMints;
    uint256 endTimestamp;
    address issuer;
    bool active;
    string title;
}
```

**Unique Session ID Generation**:
```solidity
// Uses keccak256 hash of multiple parameters including nonce for uniqueness
sessionId = keccak256(abi.encodePacked(
    msg.sender, templateId, maxMints, endTimestamp,
    title, block.timestamp, block.prevrandao, _sessionNonce
));
```

### IssuerRegistry.sol (`contracts/IssuerRegistry.sol`)
**Purpose**: Manage authorized issuers
**Key Functions**:
- `addIssuer(address issuer, string memory name, string memory organization)`
- `removeIssuer(address issuer)`
- `isAuthorizedIssuer(address issuer)`
- `getIssuerInfo(address issuer)`

## Frontend Pages Structure

### Routes & Features
1. **Home** (`/`) - Entry point with wallet connection and role selection
2. **Client Dashboard** (`/client`) - Display user's SBT collection from blockchain
3. **Issuer Dashboard** (`/issuer`) - Issuer SBT management interface with templates and sessions
4. **Create Template** (`/create`) - Create SBT template (name, description)
5. **Create Session** (`/session`) - Create time-limited minting session from template
6. **QR Display** (`/qr/:sessionId`) - Display QR code for claiming SBT from session
7. **Claim Page** (`/claim/:sessionId`) - Participants claim SBT via QR scan
8. **Batch Mint** (`/batch/:sessionId`) - Bulk SBT minting from session to multiple addresses

## Scaffold-ETH Contract Interaction Rules

### ALWAYS use these hooks for contract interactions:

#### Reading Contract Data
```typescript
const { data: someData } = useScaffoldReadContract({
  contractName: "SBTToken", // or "SBTTemplate", "SBTSession", "IssuerRegistry"
  functionName: "functionName",
  args: [arg1, arg2], // optional
});
```

#### Writing Contract Data
```typescript
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "SBTToken" // or "SBTTemplate", "SBTSession"
});

// Usage
await writeContractAsync({
  functionName: "mintFromSession",
  args: [address, sessionId],
  value: parseEther("0.1"), // optional, for payable functions
});
```

#### Other Available Hooks
- `useScaffoldWatchContractEvent` - Watch for contract events
- `useScaffoldEventHistory` - Get historical events
- `useDeployedContractInfo` - Get deployed contract info
- `useScaffoldContract` - Get contract instance
- `useTransactor` - Transaction utilities

### Display Components (Always Use These)
- `Address` - Always use when displaying ETH addresses
- `AddressInput` - Always use for ETH address input
- `Balance` - Display ETH/USDC balance
- `EtherInput` - Number input with ETH/USD conversion

Location: `packages/nextjs/components/scaffold-eth`

## Key Blockchain Interactions

### Client Dashboard
- `getUserSBTs(userAddress)` - Get all user's SBT token IDs
- `getSBTInfo(tokenId)` - Get SBT details (name, description, issuer, etc.)
- `balanceOf(userAddress)` - Get total SBT count

### Issuer Dashboard
- `isAuthorizedIssuer(msg.sender)` - Check authorization
- `getIssuerTemplates(issuerAddress)` - Get issuer's templates
- `getIssuerSessions(issuerAddress)` - Get issuer's sessions
- Read `SBTMinted` events filtered by issuer

### Template Management
- `createTemplate(name, description)` - Create new template
- `getTemplate(templateId)` - Get template details
- `updateTemplate(templateId, name, description)` - Update template
- `isTemplateActive(templateId)` - Check if template is active

### Session Management
- `createSession(templateId, maxMints, duration, title)` - Create session
- `getSession(sessionId)` - Get session details
- `isSessionClaimable(sessionId)` - Check if session accepts claims
- `getSessionStats(sessionId)` - Get mint statistics

### Claim Process (QR Code Flow) - **Self-Service**
1. User scans QR code with sessionId
2. Frontend calls `isSessionClaimable(sessionId)` to validate
3. User connects wallet
4. **User** calls `claimFromSession(sessionId)` - **Instant self-service minting**
5. SBT minted directly to user's wallet
6. Listen for `SBTMinted` event confirmation

### Batch Minting
- Validate session and wallet addresses
- **Issuer** calls `batchMintFromSession(addresses[], sessionId)`
- Monitor transaction progress and events

## Data Structures

### SBT Data (On-Chain)
```json
{
  "name": "Monad Bitz 2025 Bangkok",
  "description": "Soulbound Token for Developer who intercept with Chao and Monad",
  "issuer": "0x1234567890123456789012345678901234567890",
  "mintedAt": 1737376800,
  "templateId": 1,
  "sessionId": "0xabc123...",
  "revoked": false
}
```

### Template Data Structure
```json
{
  "templateId": 1,
  "name": "Monad Bitz 2025 Bangkok",
  "description": "Soulbound Token for Developer who intercept with Chao and Monad",
  "issuer": "0x1234567890123456789012345678901234567890",
  "createdAt": 1737376800,
  "active": true
}
```

### Session Data Structure
```json
{
  "sessionId": "0xabc123...",
  "templateId": 1,
  "maxMints": 100,
  "currentMints": 25,
  "endTimestamp": 1737463200,
  "issuer": "0x1234567890123456789012345678901234567890",
  "active": true,
  "title": "Monad Bitz 2025 Event Registration"
}
```

### Contract Configuration
- **Network**: Monad (EVM Compatible)
- **RPC URL**: https://rpc.monad.xyz
- **Currency**: MON
- **Contracts Location**: `packages/hardhat/contracts/`
- **Deployment Scripts**: `packages/hardhat/deploy/`

## Environment Variables
```
NEXT_PUBLIC_MONAD_RPC_URL
NEXT_PUBLIC_SBT_TOKEN_ADDRESS
NEXT_PUBLIC_SBT_TEMPLATE_ADDRESS
NEXT_PUBLIC_SBT_SESSION_ADDRESS
NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS
```

## UI Design Guidelines
- **Primary Colors**: Blue gradient (#667eea to #764ba2)
- **Layout**: Mobile-first, card-based design
- **Components**: Hover effects, shadows, rounded corners
- **Responsive**: 320px-768px (mobile), 768px-1024px (tablet), 1024px+ (desktop)

## File Structure
```
packages/
├── hardhat/               # Smart contracts
│   ├── contracts/
│   │   ├── SBTToken.sol          # Main ERC721 with template/session support
│   │   ├── SBTTemplate.sol       # Template management
│   │   ├── SBTSession.sol        # Session management with unique IDs
│   │   └── IssuerRegistry.sol    # Issuer authorization
│   ├── deploy/
│   └── test/
└── nextjs/               # Frontend
    ├── app/              # Next.js App Router pages
    │   ├── page.tsx      # Home
    │   ├── client/       # Client dashboard
    │   ├── issuer/       # Issuer dashboard
    │   ├── create/       # Create template
    │   ├── session/      # Create session
    │   ├── qr/           # QR code display
    │   ├── claim/        # QR claim page
    │   └── batch/        # Batch minting
    ├── components/
    ├── hooks/
    └── contracts/        # Contract ABIs and addresses
```

## Development Phases
1. **Phase 1** (1h): Setup scaffold-eth2, configure Monad, basic contracts, RainbowKit
2. **Phase 2** (1h): Template/Session system, deploy to Monad, client dashboard
3. **Phase 3** (1h): Create template/session forms, issuer authorization, session workflow
4. **Phase 4** (1h): QR code generation with unique session IDs, batch minting, UI polish

## New Workflow
1. **Issuer Creates Template** → `createTemplate(name, description)` → Template stored on-chain
2. **Issuer Creates Session** → `createSession(templateId, maxMints, duration, title)` → Unique session ID generated
3. **Generate QR Code** → QR contains session ID and claim URL (`/claim/:sessionId`)
4. **User Scans QR** → Redirected to claim page with session validation
5. **User Submits Claim** → Frontend validates session, user connects wallet
6. **Issuer Processes Claims** → Issuer calls `mintFromSession(userAddress, sessionId)` (issuer-only)
7. **Batch Processing** → Issuer uses `batchMintFromSession(addresses[], sessionId)` for multiple recipients

## Success Criteria
- ✅ Wallet connects to Monad network
- ✅ Smart contracts deploy and verify on Monad (4 contracts: SBTToken, SBTTemplate, SBTSession, IssuerRegistry)
- ✅ Template creation and management system
- ✅ Session creation with unique ID generation
- ✅ QR code claim workflow with session validation
- ✅ Issuer-only minting from templates and sessions
- ✅ Batch minting from sessions
- ✅ Client dashboard displays on-chain SBT data (name, description, issuer, timestamps)
- ✅ Proper gas estimation for all transactions