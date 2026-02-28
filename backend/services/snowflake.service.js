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
          resolve(conn);
        }
      });
    });
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
