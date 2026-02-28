const { PublicKey, SystemProgram } = require("@solana/web3.js");
const { BN } = require("@coral-xyz/anchor");
const { getProgram } = require("../config/blockchain");

class SolanaService {
  constructor() {
    this.program = getProgram();
    this.getPropertyPDA = this.getPropertyPDA.bind(this);
    this.registerProperty = this.registerProperty.bind(this);
    this.getProperty = this.getProperty.bind(this);
    this.getAllProperties = this.getAllProperties.bind(this);
    this.transferProperty = this.transferProperty.bind(this);
    this.verifyDeed = this.verifyDeed.bind(this);
    this.getNetworkInfo = this.getNetworkInfo.bind(this);
    this.registerOnChain = this.registerOnChain.bind(this);
  }

  async getPropertyPDA(propertyId) {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("property"), Buffer.from(propertyId)],
      this.program.programId
    );
    return { pda, bump };
  }

  async registerProperty(propertyData) {
    try {
      console.log("Registering property:", propertyData.propertyId);

      const { propertyId, address, ownerId, ownerName, deedHash, salePrice } = propertyData;
      const { pda } = await this.getPropertyPDA(propertyId);
      const authority = this.program.provider.wallet.publicKey;

      const tx = await this.program.methods
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
      const { pda } = await this.getPropertyPDA(propertyId);
      const propertyAccount = await this.program.account.property.fetch(pda);

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
      const properties = await this.program.account.property.all();

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
      const { pda } = await this.getPropertyPDA(propertyId);
      const authority = this.program.provider.wallet.publicKey;

      const tx = await this.program.methods
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
    const version = await this.program.provider.connection.getVersion();
    const slot = await this.program.provider.connection.getSlot();

    return {
      network: process.env.SOLANA_NETWORK,
      rpcUrl: process.env.SOLANA_RPC_URL,
      programId: this.program.programId.toBase58(),
      version,
      currentSlot: slot
    };
  }

  async registerOnChain({ deedHash, propertyAddress, ownerName, confidence, fraudRisk }) {
    const authority = this.program.provider.wallet.publicKey;
    const [propertyPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("property"), authority.toBuffer(), Buffer.from(deedHash)],
      this.program.programId
    );

    const txSig = await this.program.methods
      .registerProperty(propertyAddress, ownerName, deedHash, confidence, fraudRisk)
      .accounts({
        property: propertyPda,
        authority,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    return {
      txSig,
      propertyPda: propertyPda.toBase58(),
      explorerUrl: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
    };
  }
}

module.exports = new SolanaService();
