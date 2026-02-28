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

async function execute(conn, sqlText, binds = []) {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => (err ? reject(err) : resolve({ stmt, rows })),
    });
  });
}

async function ensureSchema(conn) {
  await execute(
    conn,
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
  );

  await execute(
    conn,
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
        created_at TIMESTAMP_NTZ
      )
    `,
  );

  await execute(
    conn,
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
        created_at TIMESTAMP_NTZ
      )
    `,
  );

  await execute(conn, "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS property_pda STRING");
  await execute(conn, "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS notes STRING");
  await execute(
    conn,
    "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_provider STRING",
  );
  await execute(
    conn,
    "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_provider_user_id STRING",
  );
  await execute(
    conn,
    "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_email STRING",
  );
  await execute(
    conn,
    "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS registered_by_name STRING",
  );
  await execute(
    conn,
    "ALTER TABLE PROPERTY_ANALYTICS ADD COLUMN IF NOT EXISTS created_at TIMESTAMP_NTZ",
  );
}

async function upsertAuthUser(conn, user) {
  await execute(
    conn,
    `
      DELETE FROM AUTH_USERS
      WHERE provider = ? AND provider_user_id = ?
    `,
    [user.provider, user.provider_user_id],
  );

  await execute(
    conn,
    `
      INSERT INTO AUTH_USERS
        (provider, provider_user_id, email, name, given_name, family_name, picture, email_verified, last_login_at, created_at)
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
      user.email_verified,
    ],
  );
}

async function insertAuthEvent(conn, event) {
  await execute(
    conn,
    `
      INSERT INTO AUTH_EVENTS
        (id, provider, provider_user_id, email, name, event_type, redirect_path, ip_address, user_agent, created_at)
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
      event.user_agent,
    ],
  );
}

async function insertAnalyticsRow(conn, row) {
  const sqlText = `
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
  `;

  const binds = [
    row.id,
    row.property_address,
    row.owner_name,
    row.deed_hash,
    row.gemini_confidence,
    row.fraud_risk,
    row.tx_signature,
    row.property_pda,
    row.notes,
    row.registered_by_provider,
    row.registered_by_provider_user_id,
    row.registered_by_email,
    row.registered_by_name,
  ];

  const { stmt } = await execute(conn, sqlText, binds);
  return stmt;
}

async function listAnalyticsRows(conn, limit = 50) {
  const sanitizedLimit = Math.max(1, Math.min(500, Number(limit) || 50));
  const { rows } = await execute(
    conn,
    `
      SELECT
        id,
        property_address,
        owner_name,
        gemini_confidence,
        fraud_risk,
        property_pda,
        tx_signature,
        created_at
      FROM PROPERTY_ANALYTICS
      ORDER BY created_at DESC
      LIMIT ${sanitizedLimit}
    `,
  );

  return rows;
}

module.exports = {
  connectSnowflake,
  ensureSchema,
  insertAnalyticsRow,
  insertAuthEvent,
  listAnalyticsRows,
  upsertAuthUser,
};
