const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const { AnchorProvider, Program, Wallet } = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const idlPath = path.join(__dirname, "../idl/property_registry.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

const rpcUrl = process.env.SOLANA_RPC_URL || process.env.SOLANA_RPC;
if (!rpcUrl) {
  throw new Error("Missing SOLANA_RPC_URL (or SOLANA_RPC) in .env file");
}
const connection = new Connection(rpcUrl, {
  commitment: "confirmed"
});

function getWallet() {
  try {
    const secretKeyString = process.env.WALLET_PRIVATE_KEY;
    let keypair;
    if (secretKeyString) {
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      keypair = Keypair.fromSecretKey(secretKey);
    } else if (process.env.WALLET_PATH) {
      const keyData = JSON.parse(fs.readFileSync(process.env.WALLET_PATH, "utf8"));
      keypair = Keypair.fromSecretKey(Uint8Array.from(keyData));
    } else {
      throw new Error("WALLET_PRIVATE_KEY is missing");
    }
    console.log("Wallet loaded:", keypair.publicKey.toBase58());
    return new Wallet(keypair);
  } catch (error) {
    console.error("Failed to load wallet:", error.message);
    throw new Error("Invalid WALLET_PRIVATE_KEY in .env file");
  }
}

function getProvider() {
  const wallet = getWallet();
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });
}

function getProgram() {
  const provider = getProvider();
  const address = (process.env.PROGRAM_ID || idl.address || "").trim();
  if (!address) {
    throw new Error("Missing PROGRAM_ID and IDL address");
  }
  const programId = new PublicKey(address);
  return new Program(idl, programId, provider);
}

module.exports = {
  connection,
  getWallet,
  getProvider,
  getProgram,
  idl
};
