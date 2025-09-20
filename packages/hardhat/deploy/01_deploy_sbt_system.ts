import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the complete SBT System with Template and Session support:
 * 1. IssuerRegistry - Manages authorized SBT issuers
 * 2. SBTTemplate - Template management for reusable SBT configurations
 * 3. SBTSession - Time-limited minting sessions with unique IDs
 * 4. SBTToken - Soulbound Token (non-transferable ERC721) with template/session support
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySBTSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying SBT System contracts...");
  console.log("📍 Deployer address:", deployer);

  // Deploy IssuerRegistry first (required by other contracts)
  console.log("\n📋 Deploying IssuerRegistry...");
  const issuerRegistryDeployment = await deploy("IssuerRegistry", {
    from: deployer,
    args: [deployer], // Owner address
    log: true,
    autoMine: true,
  });

  console.log("✅ IssuerRegistry deployed at:", issuerRegistryDeployment.address);

  // Deploy SBTTemplate (depends on IssuerRegistry)
  console.log("\n📝 Deploying SBTTemplate...");
  const sbtTemplateDeployment = await deploy("SBTTemplate", {
    from: deployer,
    args: [issuerRegistryDeployment.address], // IssuerRegistry address
    log: true,
    autoMine: true,
  });

  console.log("✅ SBTTemplate deployed at:", sbtTemplateDeployment.address);

  // Deploy SBTSession (depends on IssuerRegistry and SBTTemplate)
  console.log("\n⏰ Deploying SBTSession...");
  const sbtSessionDeployment = await deploy("SBTSession", {
    from: deployer,
    args: [
      issuerRegistryDeployment.address, // IssuerRegistry address
      sbtTemplateDeployment.address     // SBTTemplate address
    ],
    log: true,
    autoMine: true,
  });

  console.log("✅ SBTSession deployed at:", sbtSessionDeployment.address);

  // Deploy SBTToken (depends on all previous contracts)
  console.log("\n🏷️  Deploying SBTToken...");
  const sbtTokenDeployment = await deploy("SBTToken", {
    from: deployer,
    args: [
      deployer,                           // Owner address
      issuerRegistryDeployment.address,   // IssuerRegistry address
      sbtTemplateDeployment.address,      // SBTTemplate address
      sbtSessionDeployment.address        // SBTSession address
    ],
    log: true,
    autoMine: true,
  });

  console.log("✅ SBTToken deployed at:", sbtTokenDeployment.address);

  // Get deployed contracts for verification and initialization
  const issuerRegistry = await hre.ethers.getContract<Contract>("IssuerRegistry", deployer);
  const sbtTemplate = await hre.ethers.getContract<Contract>("SBTTemplate", deployer);
  const sbtSession = await hre.ethers.getContract<Contract>("SBTSession", deployer);
  const sbtToken = await hre.ethers.getContract<Contract>("SBTToken", deployer);

  // Initialize the system
  console.log("\n🔧 Initializing SBT System...");

  try {
    // Add deployer as an authorized issuer for testing
    console.log("Adding deployer as authorized issuer...");
    const addIssuerTx = await issuerRegistry.addIssuer(
      deployer,
      "System Admin",
      "Initial system administrator for testing"
    );
    await addIssuerTx.wait();
    console.log("✅ Added deployer as authorized issuer");
  } catch (error) {
    console.log("⚠️ Deployer might already be an authorized issuer");
  }

  try {
    // Set SBTToken contract address in SBTSession for access control
    console.log("Setting SBTToken contract address in SBTSession...");
    const setSBTTokenTx = await sbtSession.setSBTTokenContract(sbtTokenDeployment.address);
    await setSBTTokenTx.wait();
    console.log("✅ SBTToken contract address set in SBTSession");
  } catch (error) {
    console.log("⚠️ Error setting SBTToken contract address:", error);
  }

  // Verify deployment by checking initial state
  console.log("\n🔍 Verifying deployment...");

  try {
    // Check IssuerRegistry
    const isOwnerAuthorized = await issuerRegistry.isAuthorizedIssuer(deployer);
    console.log("✅ Deployer is authorized issuer:", isOwnerAuthorized);

    const issuerCount = await issuerRegistry.getAuthorizedIssuerCount();
    console.log("✅ Authorized issuer count:", issuerCount.toString());

    // Check SBTTemplate
    const totalTemplates = await sbtTemplate.getTotalTemplates();
    console.log("✅ Total templates created:", totalTemplates.toString());

    // Check SBTToken
    const tokenName = await sbtToken.name();
    const tokenSymbol = await sbtToken.symbol();
    const nextTokenId = await sbtToken.getNextTokenId();

    console.log("✅ SBT Token name:", tokenName);
    console.log("✅ SBT Token symbol:", tokenSymbol);
    console.log("✅ Next token ID:", nextTokenId.toString());

    // Verify contract connections
    const tokenIssuerRegistry = await sbtToken.issuerRegistry();
    const tokenTemplate = await sbtToken.sbtTemplate();
    const tokenSession = await sbtToken.sbtSession();

    console.log("✅ SBTToken connected to IssuerRegistry:", tokenIssuerRegistry === issuerRegistryDeployment.address);
    console.log("✅ SBTToken connected to SBTTemplate:", tokenTemplate === sbtTemplateDeployment.address);
    console.log("✅ SBTToken connected to SBTSession:", tokenSession === sbtSessionDeployment.address);

  } catch (error) {
    console.error("❌ Error during verification:", error);
  }

  console.log("\n🎉 SBT System deployment completed successfully!");
  console.log("📋 IssuerRegistry:", issuerRegistryDeployment.address);
  console.log("📝 SBTTemplate:", sbtTemplateDeployment.address);
  console.log("⏰ SBTSession:", sbtSessionDeployment.address);
  console.log("🏷️  SBTToken:", sbtTokenDeployment.address);

  console.log("\n📝 Next steps:");
  console.log("1. Create templates using SBTTemplate.createTemplate()");
  console.log("2. Create sessions using SBTSession.createSession()");
  console.log("3. Mint tokens using SBTToken.mintFromSession() or batchMintFromSession()");
  console.log("4. Generate QR codes linking to session IDs for user claims");
  console.log("5. Update frontend contracts configuration with deployed addresses");
};

export default deploySBTSystem;

// Tags for selective deployment
deploySBTSystem.tags = ["SBTSystem", "IssuerRegistry", "SBTTemplate", "SBTSession", "SBTToken"];