# LINE Flex Message Service

This service provides rich, interactive LINE flex messages for the Village Security project. It includes pre-built templates for various notification scenarios and integrates with the existing notification system.

## Features

- 🎨 **Rich Visual Templates**: Beautiful, interactive flex message layouts
- 🔔 **Visitor Notifications**: Approval requests and results
- 🚨 **Security Alerts**: Emergency and suspicious activity notifications
- 👋 **Welcome Messages**: New resident onboarding
- 🔗 **Action Buttons**: Direct links to relevant pages
- 📱 **Mobile Optimized**: Designed for LINE mobile interface

## Message Types

### 1. Visitor Approval Request
- **Purpose**: Notify guards when a visitor requests entry
- **Features**: Visitor details, house information, approval button
- **API Endpoint**: `POST /api/line/send-visitor-approval`

### 2. Approval Result Notification
- **Purpose**: Inform residents about visitor approval/rejection
- **Features**: Status display, reason (if rejected), timestamp
- **API Endpoint**: `POST /api/line/send-approval-result`

### 3. Security Alert
- **Purpose**: Broadcast security incidents to relevant personnel
- **Features**: Severity levels, location, description, action button
- **API Endpoint**: `POST /api/line/send-security-alert`

### 4. Welcome Message
- **Purpose**: Greet new residents and guide them to features
- **Features**: Village information, feature highlights, quick start button
- **API Endpoint**: `POST /api/line/send-welcome`

## Quick Start

### 1. Environment Setup

Make sure you have the following environment variables configured:

```bash
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Basic Usage

```typescript
import { flexMessageService } from '../routes/(line)/flexMessage';

// Create and send a visitor approval message
const visitorData = {
  visitorName: 'สมชาย ใจดี',
  visitorPhone: '081-234-5678',
  houseNumber: '123/45',
  residentName: 'สมหญิง รักบ้าน',
  purpose: 'เยี่ยมเยียนครอบครัว',
  entryTime: '14:30 น.',
  villageName: 'หมู่บ้านสุขสันต์',
  visitorId: 'visitor_001'
};

const flexMessage = flexMessageService.createVisitorApprovalMessage(visitorData);
const success = await flexMessageService.sendFlexMessage('USER_ID', flexMessage);
```

### 3. Using the Notification Service

```typescript
import { notificationService } from '../services/notificationService';

// Send visitor approval request
await notificationService.sendVisitorApprovalFlexMessage('USER_ID', visitorData);

// Send approval result
await notificationService.sendApprovalResultFlexMessage('USER_ID', approvalData);

// Send security alert
await notificationService.sendSecurityAlertFlexMessage('USER_ID', alertData);

// Send welcome message
await notificationService.sendWelcomeFlexMessage('USER_ID', 'สมชาย ใจดี', 'หมู่บ้านสุขสันต์');
```

## API Endpoints

### Send Visitor Approval Request

```http
POST /api/line/send-visitor-approval
Content-Type: application/json

{
  "userId": "U1234567890abcdef",
  "data": {
    "visitorName": "สมชาย ใจดี",
    "visitorPhone": "081-234-5678",
    "houseNumber": "123/45",
    "residentName": "สมหญิง รักบ้าน",
    "purpose": "เยี่ยมเยียนครอบครัว",
    "entryTime": "14:30 น.",
    "villageName": "หมู่บ้านสุขสันต์",
    "visitorId": "visitor_001",
    "imageUrl": "https://example.com/photo.jpg" // Optional
  }
}
```

### Send Approval Result

```http
POST /api/line/send-approval-result
Content-Type: application/json

{
  "userId": "U1234567890abcdef",
  "data": {
    "visitorName": "สมชาย ใจดี",
    "houseNumber": "123/45",
    "residentName": "สมหญิง รักบ้าน",
    "status": "approved", // or "rejected"
    "reason": "ไม่พบข้อมูลผู้เยี่ยม", // Optional, for rejections
    "villageName": "หมู่บ้านสุขสันต์"
  }
}
```

### Send Security Alert

```http
POST /api/line/send-security-alert
Content-Type: application/json

{
  "userId": "U1234567890abcdef",
  "data": {
    "alertType": "suspicious", // "suspicious", "emergency", "maintenance"
    "location": "ประตูหลัก",
    "description": "พบบุคคลแปลกหน้าเดินวนเวียนบริเวณประตูหลัก",
    "timestamp": "15:45 น.",
    "villageName": "หมู่บ้านสุขสันต์",
    "severity": "medium" // "low", "medium", "high", "critical"
  }
}
```

### Send Welcome Message

```http
POST /api/line/send-welcome
Content-Type: application/json

{
  "userId": "U1234567890abcdef",
  "residentName": "สมชาย ใจดี",
  "villageName": "หมู่บ้านสุขสันต์"
}
```

## Data Types

### VisitorNotificationData
```typescript
interface VisitorNotificationData {
  visitorName: string;
  visitorPhone: string;
  houseNumber: string;
  residentName: string;
  purpose: string;
  entryTime: string;
  villageName: string;
  visitorId: string;
  imageUrl?: string; // Optional
}
```

### ApprovalNotificationData
```typescript
interface ApprovalNotificationData {
  visitorName: string;
  houseNumber: string;
  residentName: string;
  status: 'approved' | 'rejected';
  reason?: string; // Optional, for rejections
  villageName: string;
}
```

### SecurityAlertData
```typescript
interface SecurityAlertData {
  alertType: 'suspicious' | 'emergency' | 'maintenance';
  location: string;
  description: string;
  timestamp: string;
  villageName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

## Error Handling

The service includes comprehensive error handling:

- **Token Validation**: Checks for valid LINE Channel Access Token
- **API Errors**: Handles LINE API response errors
- **Network Issues**: Graceful handling of network failures
- **Retry Logic**: Built-in retry mechanisms for failed requests

## Integration Examples

### With Visitor Record System

```typescript
// When a visitor submits a request
export async function handleVisitorRequest(visitorData: any) {
  // Save to database
  const record = await saveVisitorRecord(visitorData);
  
  // Send flex message to guards
  const guards = await getActiveGuards(visitorData.villageKey);
  
  for (const guard of guards) {
    await notificationService.sendVisitorApprovalFlexMessage(
      guard.lineUserId,
      {
        visitorName: visitorData.name,
        visitorPhone: visitorData.phone,
        houseNumber: visitorData.houseNumber,
        residentName: visitorData.residentName,
        purpose: visitorData.purpose,
        entryTime: new Date().toLocaleTimeString('th-TH'),
        villageName: visitorData.villageName,
        visitorId: record.id
      }
    );
  }
}
```

### With Approval System

```typescript
// When guard approves/rejects visitor
export async function handleVisitorApproval(visitorId: string, status: 'approved' | 'rejected', reason?: string) {
  // Update database
  await updateVisitorStatus(visitorId, status, reason);
  
  // Get visitor and resident info
  const visitor = await getVisitorRecord(visitorId);
  const resident = await getResidentByHouse(visitor.houseNumber);
  
  // Send result to resident
  await notificationService.sendApprovalResultFlexMessage(
    resident.lineUserId,
    {
      visitorName: visitor.name,
      houseNumber: visitor.houseNumber,
      residentName: resident.name,
      status,
      reason,
      villageName: visitor.villageName
    }
  );
}
```

## Customization

### Adding New Message Types

1. Create a new method in `FlexMessageService` class
2. Define the data interface
3. Add API endpoint in `flexMessageRoutes`
4. Update the notification service if needed

### Styling Customization

The flex messages use LINE's design guidelines. You can customize:

- **Colors**: Update color values in message templates
- **Layout**: Modify the flex container structure
- **Content**: Adjust text and button configurations
- **Actions**: Change button actions and URIs

## Testing

Test the flex message functionality by submitting a visitor approval form through the guard interface. The system will automatically send flex messages to residents with LINE IDs in the specified house.

## Troubleshooting

### Common Issues

1. **"LINE Channel Access Token not configured"**
   - Check `LINE_CHANNEL_ACCESS_TOKEN` environment variable
   - Ensure token is valid and has proper permissions

2. **"Failed to send flex message"**
   - Verify user ID is correct
   - Check LINE API rate limits
   - Ensure user has added the bot as friend

3. **"Invalid data field"**
   - Validate all required fields are provided
   - Check data types match interface definitions

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=flex-message:*
```

## Security Considerations

- **Token Security**: Never expose LINE Channel Access Token in client-side code
- **User Validation**: Always validate user IDs before sending messages
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Data Privacy**: Ensure visitor data is handled according to privacy policies

## Performance Tips

- **Batch Sending**: Use `Promise.allSettled()` for multiple recipients
- **Caching**: Cache frequently used data (village names, user info)
- **Async Processing**: Use message queues for high-volume scenarios
- **Error Recovery**: Implement retry logic with exponential backoff

## Support

For issues or questions:
1. Check the flex message implementation in `/src/routes/(line)/flexMessage.ts`
2. Review LINE Flex Message documentation
3. Test with LINE's webhook simulator
4. Check server logs for detailed error messages
