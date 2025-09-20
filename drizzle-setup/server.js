import express from 'express';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const port = 4000;

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { prepare: false });

app.get('/', async (req, res) => {
  try {
    // Get auth users
    const authUsers = await sql`
      SELECT id, email, created_at 
      FROM auth.users 
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Get profiles  
    const profiles = await sql`
      SELECT p.*, au.email 
      FROM profiles p
      LEFT JOIN auth.users au ON p.user_id = au.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `;

    // Get organizations
    const organizations = await sql`
      SELECT id, name, slug, created_at 
      FROM organizations 
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Viewer</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .section { margin: 30px 0; }
            h2 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 5px; }
            .id { font-family: monospace; font-size: 0.9em; }
            .email { color: #0066cc; }
            .date { color: #666; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <h1>🎯 Database Viewer - Drizzle ORM Data</h1>
        
        <div class="section">
            <h2>👤 Auth Users (Supabase)</h2>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Created At</th>
                </tr>
                ${authUsers.map(user => `
                <tr>
                    <td class="id">${user.id}</td>
                    <td class="email">${user.email}</td>
                    <td class="date">${new Date(user.created_at).toLocaleString()}</td>
                </tr>
                `).join('')}
            </table>
        </div>

        <div class="section">
            <h2>📋 Profiles</h2>
            <table>
                <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Phone</th>
                    <th>Active</th>
                    <th>Created At</th>
                </tr>
                ${profiles.map(profile => `
                <tr>
                    <td class="id">${profile.id}</td>
                    <td class="id">${profile.user_id}</td>
                    <td class="email">${profile.email || 'N/A'}</td>
                    <td>${profile.full_name || 'N/A'}</td>
                    <td>${profile.phone || 'N/A'}</td>
                    <td>${profile.is_active ? '✅' : '❌'}</td>
                    <td class="date">${new Date(profile.created_at).toLocaleString()}</td>
                </tr>
                `).join('')}
            </table>
        </div>

        <div class="section">
            <h2>🏢 Organizations</h2>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Created At</th>
                </tr>
                ${organizations.map(org => `
                <tr>
                    <td class="id">${org.id}</td>
                    <td>${org.name}</td>
                    <td>${org.slug}</td>
                    <td class="date">${new Date(org.created_at).toLocaleString()}</td>
                </tr>
                `).join('')}
            </table>
        </div>

        <div class="section">
            <h2>🔄 Refresh Data</h2>
            <button onclick="location.reload()">🔄 Refresh</button>
        </div>

        <script>
            console.log('✅ Database Viewer loaded successfully!');
            console.log('📊 Auth Users:', ${JSON.stringify(authUsers.length)});
            console.log('📋 Profiles:', ${JSON.stringify(profiles.length)});
            console.log('🏢 Organizations:', ${JSON.stringify(organizations.length)});
        </script>
    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`
      <h1>❌ Database Error</h1>
      <pre>${error.message}</pre>
      <p><a href="/">Try again</a></p>
    `);
  }
});

app.listen(port, () => {
  console.log(`🚀 Database Viewer running at http://localhost:${port}`);
  console.log(`📊 Viewing data for:`);
  console.log(`   - User ID: 2a1e3816-0893-4111-8bd4-a19949808df1`);
  console.log(`   - Organization ID: b7a05c98-9fc5-4aef-b92f-bfa0586bf495`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  await sql.end();
  process.exit(0);
});