const snowflake = require("snowflake-sdk");

function connectSnowflake() {
  const conn = snowflake.createConnection({
    account: process.env.SF_ACCOUNT,
    username: process.env.SF_USER,
    password: process.env.SF_PASSWORD,
    warehouse: process.env.SF_WAREHOUSE,
    database: process.env.SF_DATABASE,
    schema: process.env.SF_SCHEMA,
    role: process.env.SF_ROLE
  });

  return new Promise((resolve, reject) => {
    conn.connect((err) => (err ? reject(err) : resolve(conn)));
  });
}

async function insertAnalyticsRow(conn, row) {
  const sqlText = `
    INSERT INTO PROPERTY_ANALYTICS
      (id, property_address, owner_name, deed_hash, gemini_confidence, fraud_risk, tx_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const binds = [
    row.id,
    row.property_address,
    row.owner_name,
    row.deed_hash,
    row.gemini_confidence,
    row.fraud_risk,
    row.tx_signature
  ];

  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, stmt) => (err ? reject(err) : resolve(stmt))
    });
  });
}

module.exports = { connectSnowflake, insertAnalyticsRow };