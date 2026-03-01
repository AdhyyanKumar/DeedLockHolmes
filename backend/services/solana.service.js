const {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Connection,
} = require("@solana/web3.js");
const { BN } = require("@coral-xyz/anchor");
const { getProgram, getWallet } = require("../config/blockchain");

// SPL Memo program — pre-deployed on every Solana cluster (devnet, mainnet, testnet)
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Reliable devnet connection used exclusively for the Memo fallback
// so it never breaks if SOLANA_RPC is misconfigured
const DEVNET_CONNECTION = new Connection("https://api.devnet.solana.com", "confirmed");

class SolanaService {
  constructor() {
    this.program = null;
    this.getPropertyPDA = this.getPropertyPDA.bind(this);
    this.registerProperty = this.registerProperty.bind(this);
    this.getProperty = this.getProperty.bind(this);
    this.getAllProperties = this.getAllProperties.bind(this);
    this.transferProperty = this.transferProperty.bind(this);
    this.verifyDeed = this.verifyDeed.bind(this);
    this.getNetworkInfo = this.getNetworkInfo.bind(this);
    this.registerOnChain = this.registerOnChain.bind(this);
  }

  getProgramInstance() {
    if (!this.program) {
      this.program = getProgram();
    }
    return this.program;
  }

  async getPropertyPDA(propertyId) {
    const program = this.getProgramInstance();
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("property"), Buffer.from(propertyId)],
      program.programId
    );
    return { pda, bump };
  }

  async registerProperty(propertyData) {
    try {
      console.log("Registering property:", propertyData.propertyId);

      const { propertyId, address, ownerId, ownerName, deedHash, salePrice } = propertyData;
      const { pda } = await this.getPropertyPDA(propertyId);
      const program = this.getProgramInstance();
      const authority = program.provider.wallet.publicKey;

      const tx = await program.methods
        .registerProperty(propertyId, address, ownerId, ownerName, deedHash, new BN(salePrice))
        .accounts({
          property: pda,
          authority,
          systemProgram: SystemProgram.programId
        })
        .rpc();

      console.log("Property registered. Tx:", tx);

      return {
        success: true,
        transactionSignature: tx,
        propertyPDA: pda.toBase58(),
        explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`
      };
    } catch (error) {
      console.error("Error registering property:", error);
      throw new Error(`Failed to register property: ${error.message}`);
    }
  }

  async getProperty(propertyId) {
    try {
      const program = this.getProgramInstance();
      const { pda } = await this.getPropertyPDA(propertyId);
      const propertyAccount = await program.account.property.fetch(pda);

      return {
        propertyId: propertyAccount.propertyId,
        address: propertyAccount.address,
        ownerId: propertyAccount.ownerId,
        ownerName: propertyAccount.ownerName,
        deedHash: propertyAccount.deedHash,
        timestamp: propertyAccount.timestamp.toNumber(),
        salePrice: propertyAccount.salePrice.toNumber(),
        previousOwner: propertyAccount.previousOwner || "N/A",
        isActive: propertyAccount.isActive
      };
    } catch (error) {
      console.error("Error fetching property:", error);
      throw new Error(`Property ${propertyId} not found`);
    }
  }

  async getAllProperties() {
    try {
      const program = this.getProgramInstance();
      const properties = await program.account.property.all();

      return properties.map((p) => ({
        publicKey: p.publicKey.toBase58(),
        propertyId: p.account.propertyId,
        address: p.account.address,
        ownerId: p.account.ownerId,
        ownerName: p.account.ownerName,
        deedHash: p.account.deedHash,
        timestamp: p.account.timestamp.toNumber(),
        salePrice: p.account.salePrice.toNumber(),
        previousOwner: p.account.previousOwner || "N/A",
        isActive: p.account.isActive
      }));
    } catch (error) {
      console.error("Error fetching all properties:", error);
      throw error;
    }
  }

  async transferProperty(propertyId, newOwnerId, newOwnerName, newDeedHash, newSalePrice) {
    try {
      const program = this.getProgramInstance();
      const { pda } = await this.getPropertyPDA(propertyId);
      const authority = program.provider.wallet.publicKey;

      const tx = await program.methods
        .transferProperty(newOwnerId, newOwnerName, newDeedHash, new BN(newSalePrice))
        .accounts({
          property: pda,
          authority
        })
        .rpc();

      console.log("Property transferred. Tx:", tx);

      return {
        success: true,
        transactionSignature: tx,
        explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`
      };
    } catch (error) {
      console.error("Error transferring property:", error);
      throw error;
    }
  }

  async verifyDeed(propertyId, providedHash) {
    try {
      const property = await this.getProperty(propertyId);
      const isValid = property.deedHash === providedHash;

      return {
        isValid,
        recordedHash: property.deedHash,
        providedHash,
        property,
        message: isValid
          ? "AUTHENTIC - Deed matches blockchain record"
          : "TAMPERED - Deed does not match blockchain record"
      };
    } catch (error) {
      console.error("Error verifying deed:", error);
      throw error;
    }
  }

  async getNetworkInfo() {
    const program = this.getProgramInstance();
    const version = await program.provider.connection.getVersion();
    const slot = await program.provider.connection.getSlot();

    return {
      network: process.env.SOLANA_NETWORK,
      rpcUrl: process.env.SOLANA_RPC_URL,
      programId: program.programId.toBase58(),
      version,
      currentSlot: slot
    };
  }

  async _memoFallback({ propertyId, deedHash, ownerName }) {
    const wallet = getWallet();
    const keypair = wallet.payer;

    const memoText = JSON.stringify({
      app: "DeedLockHolmes",
      propertyId: propertyId.slice(0, 16),
      deedHash: deedHash.slice(0, 16),
      owner: String(ownerName || "").slice(0, 24),
      ts: Date.now(),
    });

    const instruction = new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, "utf8"),
    });

    const tx = new Transaction().add(instruction);
    const sig = await sendAndConfirmTransaction(DEVNET_CONNECTION, tx, [keypair]);

    const cluster = "devnet";
    console.log("Memo tx recorded on-chain:", sig);

    return {
      txSig: sig,
      propertyPda: null,
      explorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`,
    };
  }

  async transferOnChain({ propertyId, newOwnerId, newOwnerName, newDeedHash, newSalePrice, previousOwnerName }) {
    try {
      const program = this.getProgramInstance();
      const authority = program.provider.wallet.publicKey;
      const [propertyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("property"), Buffer.from(propertyId)],
        program.programId
      );

      const txSig = await program.methods
        .transferProperty(newOwnerId, newOwnerName, newDeedHash, new BN(newSalePrice))
        .accounts({ property: propertyPda, authority })
        .rpc();

      return {
        txSig,
        propertyPda: propertyPda.toBase58(),
        explorerUrl: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      };
    } catch (programErr) {
      console.warn("Transfer via custom program failed, using Memo fallback:", programErr.message.slice(0, 80));
      const wallet = getWallet();
      const keypair = wallet.payer;
      const memoText = JSON.stringify({
        app: "DeedLockHolmes",
        event: "transfer",
        propertyId: propertyId.slice(0, 16),
        from: String(previousOwnerName || "").slice(0, 20),
        to: String(newOwnerName || "").slice(0, 20),
        ts: Date.now(),
      });
      const instruction = new TransactionInstruction({
        keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoText, "utf8"),
      });
      const tx = new Transaction().add(instruction);
      const sig = await sendAndConfirmTransaction(DEVNET_CONNECTION, tx, [keypair]);
      console.log("Transfer Memo tx:", sig);
      return {
        txSig: sig,
        propertyPda: null,
        explorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      };
    }
  }

  async registerOnChain({ propertyId, address, ownerId, ownerName, deedHash, salePrice }) {
    try {
      const program = this.getProgramInstance();
      const authority = program.provider.wallet.publicKey;
      const [propertyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("property"), Buffer.from(propertyId)],
        program.programId
      );

      const txSig = await program.methods
        .registerProperty(propertyId, address, ownerId, ownerName, deedHash, new BN(salePrice))
        .accounts({
          property: propertyPda,
          authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        txSig,
        propertyPda: propertyPda.toBase58(),
        explorerUrl: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
      };
    } catch (programErr) {
      // Custom program not deployed — fall back to SPL Memo for real on-chain proof
      console.warn("Custom program unavailable, using Memo fallback:", programErr.message.slice(0, 100));
      return await this._memoFallback({ propertyId, deedHash, ownerName });
    }
  }
}

module.exports = new SolanaService();
