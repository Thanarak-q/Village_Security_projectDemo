// Simple test script for role swapping functionality
const testRoleSwap = async () => {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('Testing role swap functionality...\n');
  
  // Test 1: Get all users first
  console.log('1. Fetching all users...');
  try {
    const response = await fetch(`${baseUrl}/userTable`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.total.residents} residents and ${data.total.guards} guards`);
      
      // Test 2: Try to swap a resident to guard (if any residents exist)
      if (data.data.residents.length > 0) {
        const resident = data.data.residents[0];
        console.log(`\n2. Testing resident to guard conversion for: ${resident.fname} ${resident.lname}`);
        
        const swapResponse = await fetch(`${baseUrl}/changeUserRole`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: resident.id,
            currentRole: 'resident',
            newRole: 'guard',
            status: 'verified'
          }),
        });
        
        const swapResult = await swapResponse.json();
        console.log('Swap result:', swapResult);
        
        if (swapResult.success) {
          console.log('✅ Resident to guard conversion successful!');
          
          // Test 3: Try to swap the guard back to resident
          console.log(`\n3. Testing guard back to resident conversion for: ${resident.fname} ${resident.lname}`);
          
          const swapBackResponse = await fetch(`${baseUrl}/changeUserRole`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: swapResult.data.guard_id,
              currentRole: 'guard',
              newRole: 'resident',
              status: 'verified',
              houseNumber: resident.house_address || 'Test House 123'
            }),
          });
          
          const swapBackResult = await swapBackResponse.json();
          console.log('Swap back result:', swapBackResult);
          
          if (swapBackResult.success) {
            console.log('✅ Guard to resident conversion successful!');
          } else {
            console.log('❌ Guard to resident conversion failed:', swapBackResult.error);
          }
        } else {
          console.log('❌ Resident to guard conversion failed:', swapResult.error);
        }
      } else {
        console.log('No residents found to test with');
      }
      
      // Test 4: Try to swap a guard to resident (if any guards exist)
      if (data.data.guards.length > 0) {
        const guard = data.data.guards[0];
        console.log(`\n4. Testing guard to resident conversion for: ${guard.fname} ${guard.lname}`);
        
        const swapResponse = await fetch(`${baseUrl}/changeUserRole`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: guard.id,
            currentRole: 'guard',
            newRole: 'resident',
            status: 'verified',
            houseNumber: 'Test House 456'
          }),
        });
        
        const swapResult = await swapResponse.json();
        console.log('Swap result:', swapResult);
        
        if (swapResult.success) {
          console.log('✅ Guard to resident conversion successful!');
        } else {
          console.log('❌ Guard to resident conversion failed:', swapResult.error);
        }
      } else {
        console.log('No guards found to test with');
      }
      
    } else {
      console.log('Failed to fetch users:', data.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testRoleSwap(); 