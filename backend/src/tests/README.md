# LINE Flex Message Service Tests

This directory contains comprehensive tests for the LINE Flex Message Service, including unit tests, integration tests, and manual testing scripts.

## Test Files

### 1. `flexMessage.test.ts`
**Unit and Integration Tests**
- Tests all flex message creation methods
- Tests API endpoint functionality
- Tests error handling and edge cases
- Tests performance and concurrent operations
- Uses mocked LINE API calls

### 2. `manualFlexMessageTest.ts`
**Manual Testing Script**
- Tests with real LINE API
- Sends actual messages to LINE users
- Tests all message types and scenarios
- Includes batch sending and error handling tests

### 3. `setup.ts`
**Test Environment Setup**
- Configures global test environment
- Sets up mocks and environment variables
- Configures test timeouts and options

## Running Tests

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file with:
   ```bash
   LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **Update Test Configuration**
   - Edit `manualFlexMessageTest.ts`
   - Update `USER_ID` constant with a real LINE user ID
   - Update `VILLAGE_NAME` if needed

### Test Commands

#### Unit Tests Only
```bash
# Run all unit tests
npm run test

# Run only flex message tests
npm run test:flex

# Run tests in watch mode
npm run test:watch
npm run test:flex:watch
```

#### Manual Tests (Real LINE API)
```bash
# Run manual tests with real LINE API
npm run test:manual

# Run complete test suite (unit + manual)
npm run test:all
```

#### Using Test Script
```bash
# Make script executable (first time only)
chmod +x scripts/test-flex-messages.sh

# Run complete test suite
./scripts/test-flex-messages.sh
```

## Test Coverage

### Unit Tests (`flexMessage.test.ts`)

#### ✅ Message Creation Tests
- [x] Visitor approval message creation
- [x] Approval result message creation (approved/rejected)
- [x] Security alert message creation
- [x] Welcome message creation
- [x] Message structure validation
- [x] Content validation

#### ✅ API Integration Tests
- [x] Successful message sending
- [x] API error handling
- [x] Network error handling
- [x] Missing token handling
- [x] Invalid user ID handling

#### ✅ Error Handling Tests
- [x] Empty data handling
- [x] Special characters handling
- [x] Long text handling
- [x] Invalid input validation

#### ✅ Performance Tests
- [x] Message creation speed
- [x] Concurrent message sending
- [x] Batch operations

### Manual Tests (`manualFlexMessageTest.ts`)

#### ✅ Real API Tests
- [x] Visitor approval message
- [x] Approval result message (approved)
- [x] Approval result message (rejected)
- [x] Security alert message
- [x] Emergency alert message
- [x] Welcome message

#### ✅ Severity Level Tests
- [x] Low severity alerts
- [x] Medium severity alerts
- [x] High severity alerts
- [x] Critical severity alerts

#### ✅ Alert Type Tests
- [x] Suspicious activity alerts
- [x] Emergency alerts
- [x] Maintenance alerts

#### ✅ Advanced Tests
- [x] Batch sending
- [x] Error handling
- [x] Direct message creation
- [x] Concurrent operations

## Test Data

### Sample Visitor Data
```typescript
const testVisitorData = {
  visitorName: 'สมชาย ใจดี',
  visitorPhone: '081-234-5678',
  houseNumber: '123/45',
  residentName: 'สมหญิง รักบ้าน',
  purpose: 'เยี่ยมเยียนครอบครัว',
  entryTime: '14:30 น.',
  villageName: 'หมู่บ้านสุขสันต์',
  visitorId: 'test_visitor_001'
};
```

### Sample Security Alert Data
```typescript
const testSecurityAlert = {
  alertType: 'suspicious',
  location: 'ประตูหลัก',
  description: 'พบบุคคลแปลกหน้าเดินวนเวียนบริเวณประตูหลัก',
  timestamp: '15:45 น.',
  villageName: 'หมู่บ้านสุขสันต์',
  severity: 'medium'
};
```

## Expected Results

### Unit Tests
- All tests should pass ✅
- No console errors
- Fast execution (< 5 seconds)

### Manual Tests
- Messages should appear in LINE app 📱
- All message types should render correctly
- Action buttons should work
- No API errors in console

## Troubleshooting

### Common Issues

#### 1. "LINE_CHANNEL_ACCESS_TOKEN not set"
```bash
# Add to .env file
LINE_CHANNEL_ACCESS_TOKEN=your_actual_token_here
```

#### 2. "Failed to send flex message"
- Check if token is valid
- Verify user ID is correct
- Ensure user has added bot as friend
- Check LINE API rate limits

#### 3. "Tests timeout"
- Increase timeout in `setup.ts`
- Check network connectivity
- Verify LINE API is accessible

#### 4. "Module not found" errors
```bash
# Install missing dependencies
npm install vitest @vitest/ui tsx
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=flex-message:* npm run test:manual
```

### Test Environment

Check test environment:
```bash
# Verify environment variables
echo $LINE_CHANNEL_ACCESS_TOKEN
echo $FRONTEND_URL

# Check Node.js version
node --version

# Check npm packages
npm list vitest tsx
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Flex Message Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:flex
        env:
          LINE_CHANNEL_ACCESS_TOKEN: ${{ secrets.LINE_CHANNEL_ACCESS_TOKEN }}
          FRONTEND_URL: ${{ secrets.FRONTEND_URL }}
```

## Performance Benchmarks

### Expected Performance
- **Message Creation**: < 1ms per message
- **API Calls**: < 2 seconds per message
- **Batch Operations**: < 5 seconds for 10 messages
- **Concurrent Operations**: < 10 seconds for 10 concurrent messages

### Memory Usage
- **Unit Tests**: < 50MB
- **Manual Tests**: < 100MB
- **Batch Tests**: < 200MB

## Contributing

### Adding New Tests

1. **Unit Tests**: Add to `flexMessage.test.ts`
2. **Manual Tests**: Add to `manualFlexMessageTest.ts`
3. **Test Data**: Update sample data in test files
4. **Documentation**: Update this README

### Test Naming Convention
- Unit tests: `describe('Feature', () => { it('should do something', () => {}) })`
- Manual tests: `async function testFeatureName()`

### Test Structure
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle normal case', () => {
    // Test implementation
  });

  it('should handle error case', () => {
    // Error test implementation
  });
});
```

## Support

For test-related issues:
1. Check this README
2. Review test logs
3. Verify environment setup
4. Check LINE API documentation
5. Contact development team
