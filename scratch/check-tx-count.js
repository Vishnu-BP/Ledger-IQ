const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config();

async function checkTransactions() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const sql = postgres(connectionString);

  try {
    const businessId = '77b46256-f4ad-4b78-909e-1ab2242a1bb4';
    const txCount = await sql`SELECT count(*) FROM transactions WHERE business_id = ${businessId}`;
    console.log(`Transactions for SACHIN K S (${businessId}): ${txCount[0].count}`);

  } catch (err) {
    console.error("Error checking tx:", err);
  } finally {
    await sql.end();
  }
}

checkTransactions();
