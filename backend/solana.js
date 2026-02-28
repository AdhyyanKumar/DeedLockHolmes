const fs = require("fs");
const anchor = require("@coral-xyz/anchor");
const { PublicKey, Connection, SystemProgram, Keypair } = require("@solana/web3.js");

function loadKeypair(path) {
  const secret = JSON.parse(fs.readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function loadIdl(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

async function registerOnChain({ deedHash, propertyAddress, ownerName, confidence, fraudRisk }) {
  const rpc = process.env.SOLANA_RPC;
  const walletPath = process.env.WALLET_PATH;
  const idlPath = process.env.IDL_PATH;
  const programIdStr = process.env.PROGRAM_ID;

  const connection = new Connection(rpc, "confirmed");
  const kp = loadKeypair(walletPath);

  const wallet = new anchor.Wallet(kp);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed"
  });
  anchor.setProvider(provider);

  const idl = loadIdl(idlPath);
  const programId = new PublicKey(programIdStr);
  const program = new anchor.Program(idl, programId, provider);

  const [propertyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("property"), kp.publicKey.toBuffer(), Buffer.from(deedHash)],
    programId
  );

  const txSig = await program.methods
    .registerProperty(propertyAddress, ownerName, deedHash, confidence, fraudRisk)
    .accounts({
      property: propertyPda,
      authority: kp.publicKey,
      systemProgram: SystemProgram.programId
    })
    .signers([kp])
    .rpc();

  return { txSig, propertyPda: propertyPda.toBase58() };
}

module.exports = { registerOnChain };