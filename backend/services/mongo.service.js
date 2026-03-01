const { MongoClient } = require("mongodb");
require("dotenv").config();

class MongoDBService {
  constructor() {
    this.client = null;
    this.connection = null;
    this.db = null;
    this.connectPromise = null;
    this.optional = process.env.MONGODB_REQUIRED !== "true";
  }

  async connect() {
    if (this.db) return this.db;
    if (this.connectPromise) return this.connectPromise;

    const uri = process.env.MONGODB_URI || "";
    const dbName = process.env.MONGODB_DB_NAME || "deedlock_holmes";

    if (!uri) {
      const error = new Error("Missing MONGODB_URI");
      if (this.optional) {
        console.warn(`MongoDB optional mode: ${error.message}`);
        return null;
      }
      throw error;
    }

    const tlsInsecure = (process.env.MONGODB_TLS_INSECURE ?? "true") === "true";
    const forceIpv4 = process.env.MONGODB_FORCE_IPV4 === "true";

    this.connectPromise = (async () => {
      this.client = new MongoClient(uri, {
        maxPoolSize: 10,
        retryWrites: true,
        serverSelectionTimeoutMS: 12000,
        tls: true,
        tlsAllowInvalidCertificates: tlsInsecure,
        tlsAllowInvalidHostnames: tlsInsecure,
        family: forceIpv4 ? 4 : undefined,
      });
      console.log(
        `MongoDB connect options: tls=true, tlsAllowInvalidCertificates=${tlsInsecure}, forceIpv4=${forceIpv4}`,
      );
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.connection = this.db;
      console.log(`Connected to MongoDB (${dbName})`);

      await Promise.all([
        this.db.collection("auth_users").createIndex({ provider: 1, provider_user_id: 1 }, { unique: true }),
        this.db.collection("auth_events").createIndex({ created_at: -1 }),
        this.db.collection("property_analytics").createIndex({ created_at: -1 }),
        this.db.collection("property_records").createIndex({ property_id: 1, created_at: -1 }),
        this.db.collection("verification_logs").createIndex({ property_id: 1, created_at: -1 }),
      ]);

      return this.db;
    })();

    try {
      return await this.connectPromise;
    } catch (error) {
      this.client = null;
      this.db = null;
      this.connection = null;
      if (this.optional) {
        console.warn(`MongoDB optional mode: ${error.message}`);
        return null;
      }
      throw error;
    } finally {
      this.connectPromise = null;
    }
  }

  async getDb() {
    if (this.db) return this.db;
    return this.connect();
  }

  async upsertAuthUser(user) {
    const db = await this.getDb();
    if (!db) return;

    await db.collection("auth_users").updateOne(
      {
        provider: user.provider,
        provider_user_id: user.provider_user_id,
      },
      {
        $set: {
          email: user.email,
          name: user.name,
          given_name: user.given_name,
          family_name: user.family_name,
          picture: user.picture,
          email_verified: user.email_verified,
          last_login_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async insertAuthEvent(event) {
    const db = await this.getDb();
    if (!db) return;

    await db.collection("auth_events").insertOne({
      ...event,
      created_at: new Date(),
    });
  }

  async insertPropertyAnalytics(record) {
    const db = await this.getDb();
    if (!db) return;

    await db.collection("property_analytics").insertOne({
      ID: record.id,
      PROPERTY_ADDRESS: record.property_address,
      OWNER_NAME: record.owner_name,
      DEED_HASH: record.deed_hash,
      GEMINI_CONFIDENCE: record.gemini_confidence,
      FRAUD_RISK: record.fraud_risk,
      TX_SIGNATURE: record.tx_signature,
      PROPERTY_PDA: record.property_pda,
      NOTES: record.notes,
      REGISTERED_BY_PROVIDER: record.registered_by_provider,
      REGISTERED_BY_PROVIDER_USER_ID: record.registered_by_provider_user_id,
      REGISTERED_BY_EMAIL: record.registered_by_email,
      REGISTERED_BY_NAME: record.registered_by_name,
      CREATED_AT: new Date(),
    });
  }

  async listPropertyAnalytics(limit = 100) {
    const db = await this.getDb();
    if (!db) return [];

    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
    return db
      .collection("property_analytics")
      .find({})
      .sort({ CREATED_AT: -1 })
      .limit(safeLimit)
      .toArray();
  }

  async listPropertyAnalyticsByUser(user, limit = 100) {
    const db = await this.getDb();
    if (!db) return [];

    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
    const provider = String(user?.provider || "").trim();
    const providerUserId = String(user?.provider_user_id || "").trim();
    const email = String(user?.email || "").trim();

    const orConditions = [];
    if (provider && providerUserId) {
      orConditions.push({
        REGISTERED_BY_PROVIDER: provider,
        REGISTERED_BY_PROVIDER_USER_ID: providerUserId,
      });
    }
    if (email) {
      orConditions.push({ REGISTERED_BY_EMAIL: email });
    }

    if (orConditions.length === 0) return [];

    return db
      .collection("property_analytics")
      .find({ $or: orConditions })
      .sort({ CREATED_AT: -1 })
      .limit(safeLimit)
      .toArray();
  }

  async getPropertyAnalytics() {
    const db = await this.getDb();
    if (!db) return {};

    const results = await db
      .collection("property_analytics")
      .find({})
      .sort({ CREATED_AT: -1 })
      .limit(1)
      .toArray();

    return results[0] || {};
  }

  async storePropertyRecord(propertyData) {
    const db = await this.getDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    await db.collection("property_records").insertOne({
      property_id: propertyData.propertyId,
      address: propertyData.address,
      owner_id: propertyData.ownerId,
      owner_name: propertyData.ownerName,
      deed_hash: propertyData.deedHash,
      sale_price: propertyData.salePrice,
      transaction_signature: propertyData.transactionSignature,
      blockchain_timestamp: propertyData.timestamp,
      created_at: new Date(),
    });

    return { success: true, message: "Property record stored in MongoDB" };
  }

  async getTransactionHistory(propertyId) {
    const db = await this.getDb();
    if (!db) return [];

    return db
      .collection("property_records")
      .find({ property_id: propertyId })
      .sort({ created_at: -1 })
      .toArray();
  }

  async findPropertyAnalyticsById(propertyId) {
    const db = await this.getDb();
    if (!db) return null;
    return db.collection("property_analytics").findOne({ ID: propertyId });
  }

  async findPropertyByAddress(address) {
    const db = await this.getDb();
    if (!db) return null;
    const safe = String(address || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return db.collection("property_analytics").findOne({
      PROPERTY_ADDRESS: { $regex: `^${safe}$`, $options: "i" },
    });
  }

  async updatePropertyOwner(propertyId, { newOwnerName, newOwnerEmail, previousOwnerName, txSignature }) {
    const db = await this.getDb();
    if (!db) return;
    await db.collection("property_analytics").updateOne(
      { ID: propertyId },
      {
        $set: {
          OWNER_NAME: newOwnerName,
          REGISTERED_BY_EMAIL: newOwnerEmail,
          REGISTERED_BY_NAME: newOwnerName,
          PREVIOUS_OWNER_NAME: previousOwnerName,
          TX_SIGNATURE: txSignature,
          UPDATED_AT: new Date(),
        },
        $inc: { TRANSFER_COUNT: 1 },
      }
    );
  }

  async searchProperties(searchTerm) {
    const db = await this.getDb();
    if (!db) return [];

    const safe = String(searchTerm || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "i");

    return db
      .collection("property_records")
      .find({
        $or: [{ address: re }, { owner_name: re }, { property_id: re }],
      })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();
  }

  async logVerification(propertyId, providedHash, recordedHash, isValid) {
    const db = await this.getDb();
    if (!db) return { success: false };

    await db.collection("verification_logs").insertOne({
      property_id: propertyId,
      provided_hash: providedHash,
      recorded_hash: recordedHash,
      is_valid: isValid,
      created_at: new Date(),
    });

    return { success: true };
  }

  async storeAIAnalysis(propertyId, analysisType, result, riskScore = null) {
    const db = await this.getDb();
    if (!db) return { success: false };

    await db.collection("ai_analysis").insertOne({
      property_id: propertyId,
      analysis_type: analysisType,
      analysis_result: result,
      risk_score: riskScore,
      created_at: new Date(),
    });

    return { success: true };
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.connection = null;
    }
  }
}

module.exports = new MongoDBService();

