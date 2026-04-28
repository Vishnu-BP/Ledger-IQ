import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import dotenv from 'dotenv';

dotenv.config();

async function checkDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not found");
    return;
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    const transactions = await db.query.transactions.findMany();
    console.log(`Found ${transactions.length} transactions`);
    
    const businesses = await db.query.businesses.findMany();
    console.log(`Found ${businesses.length} businesses`);

    if (businesses.length > 0) {
      console.log('Sample Business:', businesses[0].id, businesses[0].name);
    }

  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await client.end();
  }
}

checkDb();
