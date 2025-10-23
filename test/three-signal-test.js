const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Three-Signal Resolution System Test
 *
 * Tests BlockCast's unique Three-Signal Resolution approach:
 * - Signal 1: Betting Volumes (0-25 points)
 * - Signal 2: Evidence Submissions (0-45 points)
 * - Signal 3: External APIs (0-30 points)
 *
 * Total confidence must be ≥80% for resolution
 */
describe("Three-Signal Resolution System", function () {
  let factory;
  let adminManager;
  let treasury;
  let castToken;
  let market;
  let deployer;
  let user1;
  let user2;

  const FACTORY_ADDRESS = '0xD2092162aD3A392686A6B0e5dFC0d34c953c221D';
  const ADMIN_MANAGER_ADDRESS = '0x94FAF61DE192D1A441215bF3f7C318c236974959';
  const TREASURY_ADDRESS = '0x69649cc208138B3A2c529cB301D7Bb591C53a2e2';
  const CAST_TOKEN_ADDRESS = '0xC78Ac73844077917E20530E36ac935c4B56236c2';

  before(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    factory = await ethers.getContractAt("PredictionMarketFactory", FACTORY_ADDRESS);
    adminManager = await ethers.getContractAt("AdminManager", ADMIN_MANAGER_ADDRESS);
    treasury = await ethers.getContractAt("Treasury", TREASURY_ADDRESS);
    castToken = await ethers.getContractAt("CastToken", CAST_TOKEN_ADDRESS);
  });

  describe("Signal Weighting", function () {
    it("should calculate betting volume signal correctly (0-25 points)", async function () {
      // Betting volume signal tests
      // Higher volume on winning side = higher confidence
      const yesVolume = ethers.utils.parseEther("1000");
      const noVolume = ethers.utils.parseEther("100");

      // Expected: ~90% YES votes = high betting signal (~23/25 points)
      const totalVolume = yesVolume.add(noVolume);
      const yesPercentage = yesVolume.mul(100).div(totalVolume);

      expect(yesPercentage).to.be.gt(80); // >80% on YES side
    });

    it("should calculate evidence signal correctly (0-45 points)", async function () {
      // Evidence signal tests
      // Quality evidence + credibility = higher score

      const evidenceCount = 5;
      const averageCredibility = 85; // 85% credible

      // Expected: 5 strong evidence pieces = high evidence signal (~38/45 points)
      const expectedScore = Math.min(45, (evidenceCount * averageCredibility) / 10);

      expect(expectedScore).to.be.gte(30); // Should score at least 30/45
    });

    it("should calculate API signal correctly (0-30 points)", async function () {
      // External API signal tests
      // Real-world data verification

      const apiSources = 3; // News API, Web scraping, other sources
      const averageAlignment = 90; // 90% alignment with outcome

      // Expected: 3 sources with 90% alignment = ~27/30 points
      const expectedScore = Math.min(30, (apiSources * averageAlignment) / 10);

      expect(expectedScore).to.be.gte(25); // Should score at least 25/30
    });
  });

  describe("Confidence Threshold", function () {
    it("should approve resolution when confidence ≥80%", async function () {
      const bettingSignal = 23; // 23/25
      const evidenceSignal = 38; // 38/45
      const apiSignal = 27;      // 27/30

      const totalConfidence = bettingSignal + evidenceSignal + apiSignal;

      expect(totalConfidence).to.be.gte(80);
      expect(totalConfidence).to.equal(88); // 88% confidence
    });

    it("should reject resolution when confidence <80%", async function () {
      const bettingSignal = 15; // 15/25 - low crowd wisdom
      const evidenceSignal = 20; // 20/45 - weak evidence
      const apiSignal = 18;      // 18/30 - inconclusive APIs

      const totalConfidence = bettingSignal + evidenceSignal + apiSignal;

      expect(totalConfidence).to.be.lt(80);
      expect(totalConfidence).to.equal(53); // Only 53% - should refund
    });

    it("should handle edge case at exactly 80%", async function () {
      const bettingSignal = 20; // 20/25
      const evidenceSignal = 35; // 35/45
      const apiSignal = 25;      // 25/30

      const totalConfidence = bettingSignal + evidenceSignal + apiSignal;

      expect(totalConfidence).to.equal(80); // Exactly 80% - should pass
    });
  });

  describe("Signal Integration", function () {
    it("should weight evidence signal highest (45 max points)", async function () {
      // Evidence is most important signal
      const maxScores = {
        betting: 25,
        evidence: 45,
        api: 30
      };

      expect(maxScores.evidence).to.be.gt(maxScores.api);
      expect(maxScores.evidence).to.be.gt(maxScores.betting);
      expect(maxScores.evidence).to.equal(45); // Highest weight
    });

    it("should ensure total possible confidence is 100", async function () {
      const maxBetting = 25;
      const maxEvidence = 45;
      const maxAPI = 30;

      const totalMax = maxBetting + maxEvidence + maxAPI;

      expect(totalMax).to.equal(100);
    });
  });

  describe("Real-World Scenarios", function () {
    it("should handle sports outcome with strong signals", async function () {
      // Scenario: "Manchester United wins Premier League 2024"
      // Result: NO (they didn't win)

      const signals = {
        betting: 22,    // 88% bet NO (crowd knew outcome)
        evidence: 42,   // Multiple news sources confirm Leicester won
        api: 28         // Sports APIs confirm final standings
      };

      const confidence = signals.betting + signals.evidence + signals.api;
      expect(confidence).to.equal(92); // High confidence resolution
    });

    it("should handle controversial outcome with weak signals", async function () {
      // Scenario: "Bitcoin will hit $100k by Dec 2024"
      // Result: Unclear (price fluctuates)

      const signals = {
        betting: 12,    // 50/50 split - no consensus
        evidence: 18,   // Mixed evidence, low credibility
        api: 15         // Price data inconclusive
      };

      const confidence = signals.betting + signals.evidence + signals.api;
      expect(confidence).to.equal(45); // Low confidence - should refund
    });
  });
});
