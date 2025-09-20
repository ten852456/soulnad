import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the SBT System contracts:
 * 1. IssuerRegistry - Manages authorized SBT issuers
 * 2. SBTToken - Soulbound Token (non-transferable ERC721)
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySBTSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying SBT System contracts...");
  console.log("📍 Deployer address:", deployer);

  // Deploy IssuerRegistry first
  console.log("\n📋 Deploying IssuerRegistry...");
  const issuerRegistryDeployment = await deploy("IssuerRegistry", {
    from: deployer,
    args: [deployer], // Owner address
    log: true,
    autoMine: true,
  });

  console.log("✅ IssuerRegistry deployed at:", issuerRegistryDeployment.address);

  // Deploy SBTToken with reference to IssuerRegistry
  console.log("\n🏷️  Deploying SBTToken...");
  const sbtTokenDeployment = await deploy("SBTToken", {
    from: deployer,
    args: [deployer, issuerRegistryDeployment.address], // Owner and IssuerRegistry address
    log: true,
    autoMine: true,
  });

  console.log("✅ SBTToken deployed at:", sbtTokenDeployment.address);

  // Get deployed contracts for verification
  const issuerRegistry = await hre.ethers.getContract<Contract>("IssuerRegistry", deployer);
  const sbtToken = await hre.ethers.getContract<Contract>("SBTToken", deployer);

  // Verify deployment by checking initial state
  console.log("\n🔍 Verifying deployment...");

  try {
    // Check IssuerRegistry
    const isOwnerAuthorized = await issuerRegistry.isAuthorizedIssuer(deployer);
    console.log("✅ Deployer is authorized issuer:", isOwnerAuthorized);

    const issuerCount = await issuerRegistry.getAuthorizedIssuerCount();
    console.log("✅ Initial authorized issuer count:", issuerCount.toString());

    // Check SBTToken
    const tokenName = await sbtToken.name();
    const tokenSymbol = await sbtToken.symbol();
    const nextTokenId = await sbtToken.getNextTokenId();

    console.log("✅ SBT Token name:", tokenName);
    console.log("✅ SBT Token symbol:", tokenSymbol);
    console.log("✅ Next token ID:", nextTokenId.toString());

    // Verify contract connections
    const registryAddress = await sbtToken.issuerRegistry();
    console.log("✅ SBTToken connected to IssuerRegistry:", registryAddress === issuerRegistryDeployment.address);

  } catch (error) {
    console.error("❌ Error during verification:", error);
  }

  console.log("\n🎉 SBT System deployment completed successfully!");
  console.log("📋 IssuerRegistry:", issuerRegistryDeployment.address);
  console.log("🏷️  SBTToken:", sbtTokenDeployment.address);

  console.log("\n📝 Next steps:");
  console.log("1. Add additional authorized issuers using IssuerRegistry.addIssuer()");
  console.log("2. Mint SBTs using SBTToken.mintSBT() or batchMintSBT()");
  console.log("3. Update frontend contracts configuration with deployed addresses");
};

export default deploySBTSystem;

// Tags for selective deployment
deploySBTSystem.tags = ["SBTSystem", "IssuerRegistry", "SBTToken"];