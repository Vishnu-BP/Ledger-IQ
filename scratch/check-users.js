const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config();

async function checkUsers() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const sql = postgres(connectionString);

  try {
    const businesses = await sql`SELECT id, name, user_id FROM businesses`;
    console.log('Businesses and their User IDs:');
    businesses.forEach(b => {
      console.log(`- ${b.name} (ID: ${b.id}) -> User: ${b.user_id}`);
    });

  } catch (err) {
    console.error("Error checking users:", err);
  } finally {
    await sql.end();
  }
}

checkUsers();
