const snowflake = require("snowflake-sdk");
require("dotenv").config();

class SnowflakeService {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }

    return new Promise((resolve, reject) => {
      console.log("Connecting to Snowflake...");

      this.connection = snowflake.createConnection({
        account: process.env.SNOWFLAKE_ACCOUNT || process.env.SF_ACCOUNT,
        username: process.env.SNOWFLAKE_USERNAME || process.env.SF_USER,
        password: process.env.SNOWFLAKE_PASSWORD || process.env.SF_PASSWORD,
        database: process.env.SNOWFLAKE_DATABASE || process.env.SF_DATABASE,
        schema: process.env.SNOWFLAKE_SCHEMA || process.env.SF_SCHEMA,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE || process.env.SF_WAREHOUSE,
        role: process.env.SNOWFLAKE_ROLE || process.env.SF_ROLE
      });

      this.connection.connect((err, conn) => {
        if (err) {
          console.error("Unable to connect to Snowflake:", err.message);
          reject(err);
        } else {
          console.log("Successfully connected to Snowflake");
          console.log(
            "Database:",
            process.env.SNOWFLAKE_DATABASE || process.env.SF_DATABASE
          );
          console.log("Schema:", process.env.SNOWFLAKE_SCHEMA || process.env.SF_SCHEMA);
          this.ensureSchema()
            .then(() => resolve(conn))
            .catch(reject);
        }
      });
    });
  }

  async ensureSchema() {
    const statements = [
      `
        CREATE TABLE IF NOT EXISTS AUTH_USERS (
          provider STRING,
          provider_user_id STRING,
          email STRING,
          name STRING,
          given_name STRING,
          family_name STRING,
          picture STRING,
          email_verified BOOLEAN,
          last_login_at TIMESTAMP_NTZ,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS AUTH_EVENTS (
          id STRING,
          provider STRING,
          provider_user_id STRING,
          email STRING,
          name STRING,
          event_type STRING,
          redirect_path STRING,
          ip_address STRING,
          user_agent STRING,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS PROPERTY_ANALYTICS (
          id STRING,
          property_address STRING,
          owner_name STRING,
          deed_hash STRING,
          gemini_confidence FLOAT,
          fraud_risk FLOAT,
          tx_signature STRING,
          property_pda STRING,
          notes STRING,
          registered_by_provider STRING,
          registered_by_provider_user_id STRING,
          registered_by_email STRING,
          registered_by_name STRING,
          created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
      `,
      "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS property_pda STRING",
      "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS notes STRING",
      "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_provider STRING",
      "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_provider_user_id STRING",
      "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_email STRING",
      "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_name STRING",
      "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()",
    ];

    for (const statement of statements) {
      await this.executeQuery(statement);
    }
  }

  async executeQuery(sqlText, binds = []) {
    if (!this.connection) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("Query execution failed:", err.message);
            reject(err);
          } else {
            console.log(`Query executed: ${rows?.length || 0} rows returned`);
            resolve(rows || []);
          }
        }
      });
    });
  }

  async storePropertyRecord(propertyData) {
    try {
      const query = `
        INSERT INTO PROPERTY_RECORDS 
        (property_id, address, owner_id, owner_name, deed_hash, sale_price, 
         transaction_signature, blockchain_timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
      `;

      const binds = [
        propertyData.propertyId,
        propertyData.address,
        propertyData.ownerId,
        propertyData.ownerName,
        propertyData.deedHash,
        propertyData.salePrice,
        propertyData.transactionSignature,
        propertyData.timestamp
      ];

      await this.executeQuery(query, binds);

      return {
        success: true,
        message: "Property record stored in Snowflake"
      };
    } catch (error) {
      console.error("Error storing property in Snowflake:", error);
      throw error;
    }
  }

  async upsertAuthUser(user) {
    await this.executeQuery(
      `
        DELETE FROM AUTH_USERS
        WHERE provider = ? AND provider_user_id = ?
      `,
      [user.provider, user.provider_user_id]
    );

    await this.executeQuery(
      `
        INSERT INTO AUTH_USERS
          (
            provider,
            provider_user_id,
            email,
            name,
            given_name,
            family_name,
            picture,
            email_verified,
            last_login_at,
            created_at
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
      `,
      [
        user.provider,
        user.provider_user_id,
        user.email,
        user.name,
        user.given_name,
        user.family_name,
        user.picture,
        user.email_verified
      ]
    );
  }

  async insertAuthEvent(event) {
    await this.executeQuery(
      `
        INSERT INTO AUTH_EVENTS
          (
            id,
            provider,
            provider_user_id,
            email,
            name,
            event_type,
            redirect_path,
            ip_address,
            user_agent,
            created_at
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
      `,
      [
        event.id,
        event.provider,
        event.provider_user_id,
        event.email,
        event.name,
        event.event_type,
        event.redirect_path,
        event.ip_address,
        event.user_agent
      ]
    );
  }

  async insertPropertyAnalytics(record) {
    await this.executeQuery(
      `
        INSERT INTO PROPERTY_ANALYTICS
          (
            id,
            property_address,
            owner_name,
            deed_hash,
            gemini_confidence,
            fraud_risk,
            tx_signature,
            property_pda,
            notes,
            registered_by_provider,
            registered_by_provider_user_id,
            registered_by_email,
            registered_by_name,
            created_at
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
      `,
      [
        record.id,
        record.property_address,
        record.owner_name,
        record.deed_hash,
        record.gemini_confidence,
        record.fraud_risk,
        record.tx_signature,
        record.property_pda,
        record.notes,
        record.registered_by_provider,
        record.registered_by_provider_user_id,
        record.registered_by_email,
        record.registered_by_name
      ]
    );
  }

  async listPropertyAnalytics(limit = 100) {
    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
    const query = `
      SELECT
        id,
        property_address,
        owner_name,
        deed_hash,
        gemini_confidence,
        fraud_risk,
        tx_signature,
        property_pda,
        notes,
        registered_by_provider,
        registered_by_provider_user_id,
        registered_by_email,
        registered_by_name,
        created_at
      FROM PROPERTY_ANALYTICS
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

    return this.executeQuery(query);
  }

  async getPropertyAnalytics() {
    try {
      const query = "SELECT * FROM PROPERTY_ANALYTICS";
      const results = await this.executeQuery(query);
      return results[0] || {};
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  }

  async getTransactionHistory(propertyId) {
    try {
      const query = `
        SELECT *
        FROM PROPERTY_RECORDS
        WHERE property_id = ?
        ORDER BY created_at DESC
      `;

      const results = await this.executeQuery(query, [propertyId]);
      return results;
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      throw error;
    }
  }

  async searchProperties(searchTerm) {
    try {
      const query = `
        SELECT *
        FROM PROPERTY_RECORDS
        WHERE address ILIKE ? 
           OR owner_name ILIKE ? 
           OR property_id ILIKE ?
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const searchPattern = `%${searchTerm}%`;
      const results = await this.executeQuery(query, [
        searchPattern,
        searchPattern,
        searchPattern
      ]);

      return results;
    } catch (error) {
      console.error("Error searching properties:", error);
      throw error;
    }
  }

  async logVerification(propertyId, providedHash, recordedHash, isValid) {
    try {
      const query = `
        INSERT INTO VERIFICATION_LOGS 
        (property_id, provided_hash, recorded_hash, is_valid)
        VALUES (?, ?, ?, ?)
      `;

      await this.executeQuery(query, [propertyId, providedHash, recordedHash, isValid]);

      return { success: true };
    } catch (error) {
      console.error("Error logging verification:", error);
      throw error;
    }
  }

  async storeAIAnalysis(propertyId, analysisType, result, riskScore = null) {
    try {
      const query = `
        INSERT INTO AI_ANALYSIS 
        (property_id, analysis_type, analysis_result, risk_score)
        VALUES (?, ?, PARSE_JSON(?), ?)
      `;

      await this.executeQuery(query, [
        propertyId,
        analysisType,
        JSON.stringify(result),
        riskScore
      ]);

      return { success: true };
    } catch (error) {
      console.error("Error storing AI analysis:", error);
      throw error;
    }
  }

  disconnect() {
    if (this.connection) {
      this.connection.destroy((err) => {
        if (err) {
          console.error("Unable to disconnect from Snowflake:", err);
        } else {
          console.log("Disconnected from Snowflake");
        }
      });
      this.connection = null;
    }
  }
}

module.exports = new SnowflakeService();
