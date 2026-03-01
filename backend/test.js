const axios = require("axios");

const API_URL = process.env.API_URL || "http://localhost:3001/api";

async function runTests() {
  console.log("Running Backend Tests...\n");

  try {
    console.log("1. Testing health endpoint...");
    const health = await axios.get(`${API_URL}/health`);
    console.log("Health check passed");
    console.log("  Status:", health.data.status);
    console.log("  Solana:", health.data.solana.connected ? "Connected" : "Disconnected");
    console.log("  MongoDB:", health.data.database.connected ? "Connected" : "Disconnected");
    console.log();

    console.log("2. Testing property registration...");
    const testProperty = {
      propertyId: `PROP_TEST_${Date.now()}`,
      address: "789 Test St, Philadelphia, PA",
      ownerId: "OWN_TEST",
      ownerName: "Test Owner",
      deedHash: `test_hash_${Math.random().toString(36).substring(7)}`,
      salePrice: 275000
    };

    const registerRes = await axios.post(`${API_URL}/properties/register`, testProperty);
    console.log("Property registered");
    console.log("  Transaction:", registerRes.data.blockchain.transactionSignature);
    console.log("  Fraud Risk:", registerRes.data.fraudAnalysis.riskLevel);
    console.log();

    console.log("3. Testing property retrieval...");
    const getRes = await axios.get(`${API_URL}/properties/${testProperty.propertyId}`);
    console.log("Property retrieved");
    console.log("  Address:", getRes.data.data.address);
    console.log("  Owner:", getRes.data.data.ownerName);
    console.log();

    console.log("4. Testing AI fraud detection...");
    const fraudRes = await axios.post(`${API_URL}/ai/fraud-check`, {
      propertyId: testProperty.propertyId
    });
    console.log("Fraud check completed");
    console.log("  Risk Score:", fraudRes.data.data.riskScore);
    console.log("  Risk Level:", fraudRes.data.data.riskLevel);
    console.log();

    console.log("5. Testing analytics...");
    const analyticsRes = await axios.get(`${API_URL}/analytics`);
    console.log("Analytics retrieved");
    console.log("  Total Properties:", analyticsRes.data.data.TOTAL_PROPERTIES);
    console.log("  Unique Owners:", analyticsRes.data.data.UNIQUE_OWNERS);
    console.log();

    console.log("All tests passed!\n");
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

runTests();

