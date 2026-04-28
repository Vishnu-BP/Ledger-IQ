const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config();

async function checkDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not found");
    return;
  }

  const sql = postgres(connectionString);

  try {
    const transactions = await sql`SELECT count(*) FROM transactions`;
    console.log(`Transactions count: ${transactions[0].count}`);
    
    const businesses = await sql`SELECT count(*) FROM businesses`;
    console.log(`Businesses count: ${businesses[0].count}`);

  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await sql.end();
  }
}

checkDb();
