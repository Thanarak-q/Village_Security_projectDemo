// Simple test script to add some admin activity logs for testing
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:1234@localhost:5432/SOFEWARE_EN'
});

async function addTestAdminLogs() {
  try {
    // First, get an admin ID
    const adminResult = await pool.query('SELECT admin_id, village_key FROM admins LIMIT 1');
    
    if (adminResult.rows.length === 0) {
      console.log('No admins found. Please run the seed script first.');
      return;
    }
    
    const admin = adminResult.rows[0];
    console.log('Using admin:', admin.admin_id, 'for village:', admin.village_key);
    
    // Add some test admin activity logs
    const testLogs = [
      {
        admin_id: admin.admin_id,
        action_type: 'user_management',
        description: 'Added new resident to the system',
        created_at: new Date()
      },
      {
        admin_id: admin.admin_id,
        action_type: 'house_management',
        description: 'Updated house information',
        created_at: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        admin_id: admin.admin_id,
        action_type: 'visitor_approval',
        description: 'Approved visitor entry',
        created_at: new Date(Date.now() - 7200000) // 2 hours ago
      }
    ];
    
    for (const log of testLogs) {
      await pool.query(
        'INSERT INTO admin_activity_logs (admin_id, action_type, description, created_at) VALUES ($1, $2, $3, $4)',
        [log.admin_id, log.action_type, log.description, log.created_at]
      );
    }
    
    console.log('Added test admin activity logs successfully!');
    
    // Verify the logs were added
    const verifyResult = await pool.query(
      'SELECT * FROM admin_activity_logs WHERE admin_id = $1 ORDER BY created_at DESC',
      [admin.admin_id]
    );
    
    console.log('Verification - Found logs:', verifyResult.rows.length);
    console.log('Logs:', verifyResult.rows);
    
  } catch (error) {
    console.error('Error adding test logs:', error);
  } finally {
    await pool.end();
  }
}

addTestAdminLogs();
