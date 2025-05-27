require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

client.connect()
  .then(() => console.log('✅ Connected to Supabase/PostgreSQL'))
  .catch(err => console.error('❌ Supabase connection error:', err));

// Create infractions table if not exists
async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS infractions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      punisher_id TEXT NOT NULL,
      punishment TEXT NOT NULL,
      reason TEXT NOT NULL,
      proof TEXT,
      appealable TEXT,
      approved_by TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await client.query(query);
}
createTable();

module.exports = {
  client,

  addInfraction: async ({
    user_id,
    punisher_id,
    punishment,
    reason,
    proof = null,
    appealable = null,
    approved_by = null,
  }) => {
    const query = `
      INSERT INTO infractions (user_id, punisher_id, punishment, reason, proof, appealable, approved_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const values = [user_id, punisher_id, punishment, reason, proof, appealable, approved_by];
    const res = await client.query(query, values);
    return res.rows[0].id;
  },

  getInfractionsByUser: async (user_id) => {
    const query = `SELECT * FROM infractions WHERE user_id = $1 ORDER BY timestamp DESC`;
    const res = await client.query(query, [user_id]);
    return res.rows;
  },

  deleteInfraction: async (id) => {
    const query = `DELETE FROM infractions WHERE id = $1`;
    await client.query(query, [id]);
  },
};
