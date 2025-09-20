# SBT System POC - Claude Development Rules

## Project Overview
**SBT System POC** - Soulbound Token System Proof of Concept for Nomad Bitz 2025
- **Duration**: 3-4 hours hackathon project
- **Deployment**: Monad Testnet/Mainnet
- **Tech Stack**: Scaffold-ETH2, Next.js, React, TypeScript, Solidity, Hardhat, RainbowKit, Wagmi

## Architecture
- **Type**: Full Stack DApp
- **Frontend**: Next.js with Scaffold-ETH2 (App Router, not Pages Router)
- **Backend**: Smart Contracts on Monad (EVM Compatible)
- **Wallet**: RainbowKit integration
- **Storage**: On-chain + IPFS for metadata
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
**Standard**: ERC721 with non-transferable modification
**Key Functions**:
- `mintSBT(address to, string memory tokenURI)`
- `batchMintSBT(address[] memory recipients, string[] memory tokenURIs)`
- `revokeSBT(uint256 tokenId)`
- `tokenURI(uint256 tokenId)`
- `balanceOf(address owner)`
- `ownerOf(uint256 tokenId)`

**Events**:
- `SBTMinted(address indexed recipient, uint256 indexed tokenId, string tokenURI)`
- `SBTRevoked(uint256 indexed tokenId)`
- `IssuerAdded(address indexed issuer)`
- `IssuerRemoved(address indexed issuer)`

### IssuerRegistry.sol (`contracts/IssuerRegistry.sol`)
**Purpose**: Manage authorized issuers
**Key Functions**:
- `addIssuer(address issuer, string memory name)`
- `removeIssuer(address issuer)`
- `isAuthorizedIssuer(address issuer)`
- `getIssuerInfo(address issuer)`

## Frontend Pages Structure

### Routes & Features
1. **Home** (`/`) - Entry point with wallet connection and role selection
2. **Client Dashboard** (`/client`) - Display user's SBT collection from blockchain
3. **Issuer Dashboard** (`/issuer`) - Issuer SBT management interface
4. **Create SBT** (`/create`) - Create SBT metadata and prepare for minting
5. **Mint** (`/mint`) - Choose distribution method after metadata preparation
6. **QR Display** (`/qr/:metadataHash`) - Display QR code for claiming SBT
7. **Claim Page** (`/claim/:metadataHash`) - Participants claim SBT via QR scan
8. **Batch Deposit** (`/batch/:metadataHash`) - Bulk SBT minting via CSV

## Scaffold-ETH Contract Interaction Rules

### ALWAYS use these hooks for contract interactions:

#### Reading Contract Data
```typescript
const { data: someData } = useScaffoldReadContract({
  contractName: "SBTToken", // or "IssuerRegistry"
  functionName: "functionName",
  args: [arg1, arg2], // optional
});
```

#### Writing Contract Data
```typescript
const { writeContractAsync } = useScaffoldWriteContract({
  contractName: "SBTToken"
});

// Usage
await writeContractAsync({
  functionName: "mintSBT",
  args: [address, tokenURI],
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
- `balanceOf(userAddress)`
- `tokenOfOwnerByIndex(userAddress, index)`
- `tokenURI(tokenId)` → IPFS metadata

### Issuer Dashboard
- `isAuthorizedIssuer(msg.sender)`
- Read `SBTMinted` events filtered by issuer
- `revokeSBT(tokenId)`

### Claim Process
- Check `balanceOf(userAddress)` for duplicates
- Call `mintSBT(userAddress, tokenURI)`
- Listen for `SBTMinted` event

### Batch Minting
- Validate wallet addresses
- Call `batchMintSBT(addresses[], tokenURIs[])`
- Monitor transaction progress

## Data Structures

### SBT Metadata (IPFS)
```json
{
  "name": "string",
  "description": "string",
  "image": "string (IPFS hash)",
  "attributes": [
    {"trait_type": "Event", "value": "Nomad Bitz 2025 Bangkok"},
    {"trait_type": "Type", "value": "Certificate"},
    {"trait_type": "Amount", "value": "100"},
    {"trait_type": "Issuer", "value": "Nomad Bitz Organization"},
    {"trait_type": "Issue Date", "value": "2025-09-20"}
  ]
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
NEXT_PUBLIC_SBT_CONTRACT_ADDRESS
NEXT_PUBLIC_ISSUER_REGISTRY_ADDRESS
NEXT_PUBLIC_IPFS_GATEWAY
PINATA_API_KEY
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
│   │   ├── SBTToken.sol
│   │   └── IssuerRegistry.sol
│   ├── deploy/
│   └── test/
└── nextjs/               # Frontend
    ├── app/              # Next.js App Router pages
    ├── components/
    ├── hooks/
    └── contracts/        # Contract ABIs and addresses
```

## Development Phases
1. **Phase 1** (1h): Setup scaffold-eth2, configure Monad, basic SBTToken.sol, RainbowKit
2. **Phase 2** (1h): IssuerRegistry.sol, deploy to Monad, client dashboard, getUserSBTs()
3. **Phase 3** (1h): Create SBT form, IPFS upload, mintSBT, issuer authorization
4. **Phase 4** (1h): QR code generation, batch minting, UI polish, testing

## Success Criteria
- ✅ Wallet connects to Monad network
- ✅ Smart contracts deploy and verify on Monad
- ✅ SBT minting with IPFS metadata
- ✅ QR code claim workflow
- ✅ Batch minting with CSV
- ✅ Client dashboard displays blockchain SBTs
- ✅ Proper gas estimation for all transactions