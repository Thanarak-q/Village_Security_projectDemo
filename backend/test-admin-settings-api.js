// Test script for Admin Settings API
// Run with: node test-admin-settings-api.js

const BASE_URL = 'http://localhost:3001/api';

// Mock admin data for testing
const mockAdminId = 'test-admin-id'; // Replace with actual admin ID from your database
const mockToken = 'your-jwt-token-here'; // Replace with actual JWT token

// Test functions
async function testGetAdminProfile() {
  console.log('\n🧪 Testing GET /admin/profile/:admin_id');
  
  try {
    const response = await fetch(`${BASE_URL}/admin/profile/${mockAdminId}`, {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Get admin profile successful');
    } else {
      console.log('❌ Get admin profile failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing get admin profile:', error.message);
  }
}

async function testUpdateAdminProfile() {
  console.log('\n🧪 Testing PUT /admin/profile/:admin_id');
  
  const updateData = {
    username: 'updated_username',
    email: 'updated@example.com',
    phone: '086-999-8888'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/admin/profile/${mockAdminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Update admin profile successful');
    } else {
      console.log('❌ Update admin profile failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing update admin profile:', error.message);
  }
}

async function testChangeAdminPassword() {
  console.log('\n🧪 Testing PUT /admin/password/:admin_id');
  
  const passwordData = {
    currentPassword: 'old_password',
    newPassword: 'new_password_123'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/admin/password/${mockAdminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Change admin password successful');
    } else {
      console.log('❌ Change admin password failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing change admin password:', error.message);
  }
}

async function testUpdateAdminSettings() {
  console.log('\n🧪 Testing PUT /admin/settings/:admin_id');
  
  const settingsData = {
    username: 'final_username',
    email: 'final@example.com',
    phone: '086-777-6666',
    currentPassword: 'new_password_123',
    newPassword: 'final_password_456'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/admin/settings/${mockAdminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settingsData)
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Update admin settings successful');
    } else {
      console.log('❌ Update admin settings failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing update admin settings:', error.message);
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log('\n🧪 Testing validation errors');
  
  // Test empty username
  try {
    const response = await fetch(`${BASE_URL}/admin/profile/${mockAdminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: '' })
    });
    
    const data = await response.json();
    console.log('Empty username validation:', data.error);
  } catch (error) {
    console.error('Error testing empty username validation:', error.message);
  }
  
  // Test short password
  try {
    const response = await fetch(`${BASE_URL}/admin/password/${mockAdminId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        currentPassword: 'old_password',
        newPassword: '123' 
      })
    });
    
    const data = await response.json();
    console.log('Short password validation:', data.error);
  } catch (error) {
    console.error('Error testing short password validation:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Admin Settings API Tests...');
  console.log('📝 Note: Make sure the server is running and update mockAdminId and mockToken with real values');
  
  await testGetAdminProfile();
  await testUpdateAdminProfile();
  await testChangeAdminPassword();
  await testUpdateAdminSettings();
  await testValidationErrors();
  
  console.log('\n✨ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testGetAdminProfile,
  testUpdateAdminProfile,
  testChangeAdminPassword,
  testUpdateAdminSettings,
  testValidationErrors,
  runAllTests
}; 