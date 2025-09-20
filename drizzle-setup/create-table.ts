import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { prepare: false });

async function createUsersTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT,
        phone VARCHAR(256)
      )
    `;
    console.log('✅ Table "users" created successfully!');
    
    // Insert some test data
    await sql`
      INSERT INTO users (full_name, phone) 
      VALUES 
        ('João Silva', '(11) 99999-0001'),
        ('Maria Santos', '(11) 99999-0002')
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Test data inserted!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await sql.end();
  }
}

createUsersTable();