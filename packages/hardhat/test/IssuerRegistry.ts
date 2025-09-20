import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { IssuerRegistry } from "../typechain-types";

describe("IssuerRegistry", function () {
  let issuerRegistry: IssuerRegistry;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const IssuerRegistryFactory = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistryFactory.deploy(await owner.getAddress());
    await issuerRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await issuerRegistry.owner()).to.equal(await owner.getAddress());
    });

    it("Should add owner as initial authorized issuer", async function () {
      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(await owner.getAddress());
      expect(isAuthorized).to.be.true;
    });

    it("Should have initial issuer count of 1", async function () {
      const count = await issuerRegistry.getAuthorizedIssuerCount();
      expect(count).to.equal(1);
    });
  });

  describe("Adding Issuers", function () {
    it("Should allow owner to add new issuer", async function () {
      const addr1Address = await addr1.getAddress();

      await expect(issuerRegistry.addIssuer(addr1Address, "Test Issuer", "Test Org"))
        .to.emit(issuerRegistry, "IssuerAdded");

      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(addr1Address);
      expect(isAuthorized).to.be.true;

      const issuerInfo = await issuerRegistry.getIssuerInfo(addr1Address);
      expect(issuerInfo.name).to.equal("Test Issuer");
      expect(issuerInfo.organization).to.equal("Test Org");
      expect(issuerInfo.authorized).to.be.true;
    });

    it("Should revert when non-owner tries to add issuer", async function () {
      const addr1Address = await addr1.getAddress();

      await expect(
        issuerRegistry.connect(addr1).addIssuer(addr1Address, "Test Issuer", "Test Org")
      ).to.be.revertedWithCustomError(issuerRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should revert when adding invalid address", async function () {
      await expect(
        issuerRegistry.addIssuer(ethers.ZeroAddress, "Test Issuer", "Test Org")
      ).to.be.revertedWith("IssuerRegistry: Invalid issuer address");
    });

    it("Should revert when adding empty name", async function () {
      const addr1Address = await addr1.getAddress();

      await expect(
        issuerRegistry.addIssuer(addr1Address, "", "Test Org")
      ).to.be.revertedWith("IssuerRegistry: Name cannot be empty");
    });

    it("Should revert when adding existing issuer", async function () {
      const addr1Address = await addr1.getAddress();

      await issuerRegistry.addIssuer(addr1Address, "Test Issuer", "Test Org");

      await expect(
        issuerRegistry.addIssuer(addr1Address, "Test Issuer 2", "Test Org 2")
      ).to.be.revertedWith("IssuerRegistry: Issuer already exists");
    });
  });

  describe("Removing Issuers", function () {
    beforeEach(async function () {
      const addr1Address = await addr1.getAddress();
      await issuerRegistry.addIssuer(addr1Address, "Test Issuer", "Test Org");
    });

    it("Should allow owner to remove issuer", async function () {
      const addr1Address = await addr1.getAddress();

      await expect(issuerRegistry.removeIssuer(addr1Address))
        .to.emit(issuerRegistry, "IssuerRemoved");

      const isAuthorized = await issuerRegistry.isAuthorizedIssuer(addr1Address);
      expect(isAuthorized).to.be.false;
    });

    it("Should revert when removing non-existent issuer", async function () {
      const addr2Address = await addr2.getAddress();

      await expect(
        issuerRegistry.removeIssuer(addr2Address)
      ).to.be.revertedWith("IssuerRegistry: Issuer not found");
    });

    it("Should revert when trying to remove owner", async function () {
      const ownerAddress = await owner.getAddress();

      await expect(
        issuerRegistry.removeIssuer(ownerAddress)
      ).to.be.revertedWith("IssuerRegistry: Cannot remove owner");
    });

    it("Should revert when non-owner tries to remove issuer", async function () {
      const addr1Address = await addr1.getAddress();

      await expect(
        issuerRegistry.connect(addr1).removeIssuer(addr1Address)
      ).to.be.revertedWithCustomError(issuerRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Updating Issuers", function () {
    beforeEach(async function () {
      const addr1Address = await addr1.getAddress();
      await issuerRegistry.addIssuer(addr1Address, "Test Issuer", "Test Org");
    });

    it("Should allow owner to update issuer info", async function () {
      const addr1Address = await addr1.getAddress();

      await expect(issuerRegistry.updateIssuer(addr1Address, "Updated Issuer", "Updated Org"))
        .to.emit(issuerRegistry, "IssuerUpdated");

      const issuerInfo = await issuerRegistry.getIssuerInfo(addr1Address);
      expect(issuerInfo.name).to.equal("Updated Issuer");
      expect(issuerInfo.organization).to.equal("Updated Org");
    });

    it("Should revert when updating non-existent issuer", async function () {
      const addr2Address = await addr2.getAddress();

      await expect(
        issuerRegistry.updateIssuer(addr2Address, "Updated Issuer", "Updated Org")
      ).to.be.revertedWith("IssuerRegistry: Issuer not found");
    });

    it("Should revert when updating with empty name", async function () {
      const addr1Address = await addr1.getAddress();

      await expect(
        issuerRegistry.updateIssuer(addr1Address, "", "Updated Org")
      ).to.be.revertedWith("IssuerRegistry: Name cannot be empty");
    });
  });

  describe("Querying Issuers", function () {
    beforeEach(async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();

      await issuerRegistry.addIssuer(addr1Address, "Issuer 1", "Org 1");
      await issuerRegistry.addIssuer(addr2Address, "Issuer 2", "Org 2");
    });

    it("Should return all authorized issuers", async function () {
      const allIssuers = await issuerRegistry.getAllIssuers();
      expect(allIssuers.length).to.equal(3); // Owner + 2 added issuers

      expect(allIssuers).to.include(await owner.getAddress());
      expect(allIssuers).to.include(await addr1.getAddress());
      expect(allIssuers).to.include(await addr2.getAddress());
    });

    it("Should return correct issuer count", async function () {
      const count = await issuerRegistry.getAuthorizedIssuerCount();
      expect(count).to.equal(3);
    });

    it("Should exclude removed issuers from getAllIssuers", async function () {
      const addr1Address = await addr1.getAddress();
      await issuerRegistry.removeIssuer(addr1Address);

      const allIssuers = await issuerRegistry.getAllIssuers();
      expect(allIssuers.length).to.equal(2);
      expect(allIssuers).to.not.include(addr1Address);
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await issuerRegistry.pause();
      expect(await issuerRegistry.paused()).to.be.true;

      await issuerRegistry.unpause();
      expect(await issuerRegistry.paused()).to.be.false;
    });

    it("Should prevent actions when paused", async function () {
      await issuerRegistry.pause();

      const addr1Address = await addr1.getAddress();

      await expect(
        issuerRegistry.addIssuer(addr1Address, "Test Issuer", "Test Org")
      ).to.be.revertedWithCustomError(issuerRegistry, "EnforcedPause");
    });

    it("Should revert when non-owner tries to pause", async function () {
      await expect(
        issuerRegistry.connect(addr1).pause()
      ).to.be.revertedWithCustomError(issuerRegistry, "OwnableUnauthorizedAccount");
    });
  });
});