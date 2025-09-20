import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { IssuerRegistry, SBTToken } from "../typechain-types";

describe("SBTToken", function () {
  let issuerRegistry: IssuerRegistry;
  let sbtToken: SBTToken;
  let owner: Signer;
  let issuer1: Signer;
  let issuer2: Signer;
  let user1: Signer;
  let user2: Signer;
  let nonIssuer: Signer;

  const sampleTokenURI = "ipfs://QmSampleTokenURI123";
  const sampleTokenURI2 = "ipfs://QmSampleTokenURI456";

  beforeEach(async function () {
    [owner, issuer1, issuer2, user1, user2, nonIssuer] = await ethers.getSigners();

    // Deploy IssuerRegistry
    const IssuerRegistryFactory = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistryFactory.deploy(await owner.getAddress());
    await issuerRegistry.waitForDeployment();

    // Deploy SBTToken
    const SBTTokenFactory = await ethers.getContractFactory("SBTToken");
    sbtToken = await SBTTokenFactory.deploy(
      await owner.getAddress(),
      await issuerRegistry.getAddress()
    );
    await sbtToken.waitForDeployment();

    // Add issuers to registry
    await issuerRegistry.addIssuer(await issuer1.getAddress(), "Issuer 1", "Organization 1");
    await issuerRegistry.addIssuer(await issuer2.getAddress(), "Issuer 2", "Organization 2");
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await sbtToken.name()).to.equal("Soulbound Token");
      expect(await sbtToken.symbol()).to.equal("SBT");
    });

    it("Should set the correct owner", async function () {
      expect(await sbtToken.owner()).to.equal(await owner.getAddress());
    });

    it("Should reference the correct IssuerRegistry", async function () {
      expect(await sbtToken.issuerRegistry()).to.equal(await issuerRegistry.getAddress());
    });

    it("Should start with token ID 1", async function () {
      expect(await sbtToken.getNextTokenId()).to.equal(1);
    });
  });

  describe("Minting SBTs", function () {
    it("Should allow authorized issuer to mint SBT", async function () {
      const user1Address = await user1.getAddress();
      const issuer1Address = await issuer1.getAddress();

      await expect(sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI))
        .to.emit(sbtToken, "SBTMinted");

      expect(await sbtToken.ownerOf(1)).to.equal(user1Address);
      expect(await sbtToken.tokenURI(1)).to.equal(sampleTokenURI);
      expect(await sbtToken.tokenIssuer(1)).to.equal(issuer1Address);
      expect(await sbtToken.balanceOf(user1Address)).to.equal(1);
    });

    it("Should revert when non-authorized issuer tries to mint", async function () {
      const user1Address = await user1.getAddress();

      await expect(
        sbtToken.connect(nonIssuer).mintSBT(user1Address, sampleTokenURI)
      ).to.be.revertedWith("SBTToken: Not an authorized issuer");
    });

    it("Should revert when minting to zero address", async function () {
      await expect(
        sbtToken.connect(issuer1).mintSBT(ethers.ZeroAddress, sampleTokenURI)
      ).to.be.revertedWith("SBTToken: Cannot mint to zero address");
    });

    it("Should revert when minting with empty token URI", async function () {
      const user1Address = await user1.getAddress();

      await expect(
        sbtToken.connect(issuer1).mintSBT(user1Address, "")
      ).to.be.revertedWith("SBTToken: Token URI cannot be empty");
    });

    it("Should prevent duplicate SBTs from same issuer", async function () {
      const user1Address = await user1.getAddress();

      await sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI);

      await expect(
        sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI2)
      ).to.be.revertedWith("SBTToken: User already has token from this issuer");
    });

    it("Should allow different issuers to mint to same user", async function () {
      const user1Address = await user1.getAddress();

      await sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI);
      await sbtToken.connect(issuer2).mintSBT(user1Address, sampleTokenURI2);

      expect(await sbtToken.balanceOf(user1Address)).to.equal(2);
    });
  });

  describe("Batch Minting", function () {
    it("Should allow batch minting to multiple users", async function () {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();
      const recipients = [user1Address, user2Address];
      const tokenURIs = [sampleTokenURI, sampleTokenURI2];

      await expect(sbtToken.connect(issuer1).batchMintSBT(recipients, tokenURIs))
        .to.emit(sbtToken, "BatchSBTMinted");

      expect(await sbtToken.balanceOf(user1Address)).to.equal(1);
      expect(await sbtToken.balanceOf(user2Address)).to.equal(1);
      expect(await sbtToken.ownerOf(1)).to.equal(user1Address);
      expect(await sbtToken.ownerOf(2)).to.equal(user2Address);
    });

    it("Should revert when arrays have different lengths", async function () {
      const user1Address = await user1.getAddress();
      const recipients = [user1Address];
      const tokenURIs = [sampleTokenURI, sampleTokenURI2];

      await expect(
        sbtToken.connect(issuer1).batchMintSBT(recipients, tokenURIs)
      ).to.be.revertedWith("SBTToken: Arrays length mismatch");
    });

    it("Should revert when batch size is too large", async function () {
      const recipients = new Array(101).fill(await user1.getAddress());
      const tokenURIs = new Array(101).fill(sampleTokenURI);

      await expect(
        sbtToken.connect(issuer1).batchMintSBT(recipients, tokenURIs)
      ).to.be.revertedWith("SBTToken: Batch size too large");
    });

    it("Should revert when batch array is empty", async function () {
      await expect(
        sbtToken.connect(issuer1).batchMintSBT([], [])
      ).to.be.revertedWith("SBTToken: Empty recipients array");
    });
  });

  describe("Revoking SBTs", function () {
    beforeEach(async function () {
      const user1Address = await user1.getAddress();
      await sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI);
    });

    it("Should allow issuer to revoke their SBT", async function () {
      await expect(sbtToken.connect(issuer1).revokeSBT(1))
        .to.emit(sbtToken, "SBTRevoked");

      expect(await sbtToken.tokenRevoked(1)).to.be.true;
    });

    it("Should allow owner to revoke any SBT", async function () {
      await expect(sbtToken.connect(owner).revokeSBT(1))
        .to.emit(sbtToken, "SBTRevoked");

      expect(await sbtToken.tokenRevoked(1)).to.be.true;
    });

    it("Should revert when unauthorized user tries to revoke", async function () {
      await expect(
        sbtToken.connect(issuer2).revokeSBT(1)
      ).to.be.revertedWith("SBTToken: Not authorized to revoke");
    });

    it("Should revert when trying to revoke non-existent token", async function () {
      await expect(
        sbtToken.connect(issuer1).revokeSBT(999)
      ).to.be.revertedWith("SBTToken: Token does not exist");
    });

    it("Should allow re-minting after revocation", async function () {
      const user1Address = await user1.getAddress();

      await sbtToken.connect(issuer1).revokeSBT(1);

      // Should be able to mint again after revocation
      await expect(
        sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI2)
      ).to.not.be.reverted;
    });
  });

  describe("Non-transferable Properties", function () {
    beforeEach(async function () {
      const user1Address = await user1.getAddress();
      await sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI);
    });

    it("Should revert on transfer attempts", async function () {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      await expect(
        sbtToken.connect(user1).transferFrom(user1Address, user2Address, 1)
      ).to.be.revertedWith("SBTToken: Soulbound tokens cannot be transferred");
    });

    it("Should revert on safeTransferFrom attempts", async function () {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      await expect(
        sbtToken.connect(user1)["safeTransferFrom(address,address,uint256)"](user1Address, user2Address, 1)
      ).to.be.revertedWith("SBTToken: Soulbound tokens cannot be transferred");
    });

    it("Should revert on approve attempts", async function () {
      const user2Address = await user2.getAddress();

      await expect(
        sbtToken.connect(user1).approve(user2Address, 1)
      ).to.be.revertedWith("SBTToken: Soulbound tokens cannot be approved");
    });

    it("Should revert on setApprovalForAll attempts", async function () {
      const user2Address = await user2.getAddress();

      await expect(
        sbtToken.connect(user1).setApprovalForAll(user2Address, true)
      ).to.be.revertedWith("SBTToken: Soulbound tokens cannot be approved");
    });

    it("Should always return zero address for getApproved", async function () {
      expect(await sbtToken.getApproved(1)).to.equal(ethers.ZeroAddress);
    });

    it("Should always return false for isApprovedForAll", async function () {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();
      expect(await sbtToken.isApprovedForAll(user1Address, user2Address)).to.be.false;
    });
  });

  describe("Querying Functions", function () {
    beforeEach(async function () {
      const user1Address = await user1.getAddress();
      const user2Address = await user2.getAddress();

      await sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI);
      await sbtToken.connect(issuer2).mintSBT(user1Address, sampleTokenURI2);
      await sbtToken.connect(issuer1).mintSBT(user2Address, sampleTokenURI);
    });

    it("Should return user's SBT token IDs", async function () {
      const user1Address = await user1.getAddress();
      const tokenIds = await sbtToken.getUserSBTs(user1Address);

      expect(tokenIds.length).to.equal(2);
      expect(tokenIds).to.include(1n);
      expect(tokenIds).to.include(2n);
    });

    it("Should return SBT information", async function () {
      const [owner, issuer, mintTime, revoked, tokenURI] = await sbtToken.getSBTInfo(1);

      expect(owner).to.equal(await user1.getAddress());
      expect(issuer).to.equal(await issuer1.getAddress());
      expect(revoked).to.be.false;
      expect(tokenURI).to.equal(sampleTokenURI);
      expect(mintTime).to.be.gt(0);
    });

    it("Should revert when querying non-existent token info", async function () {
      await expect(
        sbtToken.getSBTInfo(999)
      ).to.be.revertedWith("SBTToken: Token does not exist");
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await sbtToken.pause();
      expect(await sbtToken.paused()).to.be.true;

      await sbtToken.unpause();
      expect(await sbtToken.paused()).to.be.false;
    });

    it("Should prevent minting when paused", async function () {
      await sbtToken.pause();

      const user1Address = await user1.getAddress();

      await expect(
        sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI)
      ).to.be.revertedWithCustomError(sbtToken, "EnforcedPause");
    });

    it("Should prevent revoking when paused", async function () {
      const user1Address = await user1.getAddress();
      await sbtToken.connect(issuer1).mintSBT(user1Address, sampleTokenURI);

      await sbtToken.pause();

      await expect(
        sbtToken.connect(issuer1).revokeSBT(1)
      ).to.be.revertedWithCustomError(sbtToken, "EnforcedPause");
    });

    it("Should revert when non-owner tries to pause", async function () {
      await expect(
        sbtToken.connect(issuer1).pause()
      ).to.be.revertedWithCustomError(sbtToken, "OwnableUnauthorizedAccount");
    });
  });
});