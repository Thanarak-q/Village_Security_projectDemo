# Village Security System - Microservices Architecture (Project-Specific)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    📱 USER INTERFACE LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  🛡️ Guard App        👥 Resident App      ⚙️ Admin Dashboard      │
│  (LINE LIFF)         (LINE LIFF)          (Next.js Web)            │
│  • Check-in/out      • Approve visitors   • Manage users           │
│  • Scan ID cards     • Manage houses      • View reports           │
│  • Verify plates     • Family members     • System monitoring     │
└─────────────────────────────────────────────────────────────────────┘
                              ▲                 ▲
                              │                 │
┌─────────────────────────────────────────────────────────────────────┐
│                  🌐 ROUTING & API GATEWAY LAYER                   │
├─────────────────────────────────────────────────────────────────────┤
│  🔒 Caddy Server      📊 Rate Limiting     🔐 Authentication       │
│  • SSL/TLS           • 100 req/min        • JWT validation         │
│  • WebSocket proxy   • DDoS protection   • Role-based access     │
│  • Load balancing    • IP whitelist       • Session management     │
└─────────────────────────────────────────────────────────────────────┘
             ▲            ▲             ▲              ▲
             │            │             │              │
┌─────────────────────────────────────────────────────────────────────┐
│                    🔧 MICROSERVICES LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  🔑 Auth Service      👤 User Service       📝 Visitor Service     │
│  • JWT tokens        • User profiles       • Visitor records       │
│  • LINE LIFF auth    • Role management     • Approval workflow     │
│  • RBAC (3 roles)    • Preferences         • Status tracking       │
│                                                                    │
│  🛡️ Guard Service     👥 Resident Service   ⚙️ Admin Service        │
│  • Check-in process  • Visitor approvals   • User management      │
│  • ID verification   • House management    • Village settings     │
│  • Plate scanning    • Family members      • Reports & analytics  │
│                                                                    │
│  📢 Notification Service                                            │
│  • WebSocket (real-time)  • LINE push notifications               │
│  • Email/SMS alerts       • Role-based routing                    │
└─────────────────────────────────────────────────────────────────────┘
             ▲            ▲             ▲              ▲
             │            │             │              │
┌─────────────────────────────────────────────────────────────────────┐
│                    💾 DATA STORAGE LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│  🗄️ PostgreSQL Databases (per service):                           │
│   • auth_db      • user_db      • visitor_db    • admin_db         │
│   • guard_db     • resident_db  • notification_db                  │
│                                                                    │
│  ⚡ Redis Cache:                                                   │
│   • Session store  • Query cache  • Rate limiting                  │
│                                                                    │
│  📁 Object Storage (S3/MinIO):                                     │
│   • ID card images  • License plate images  • Report exports      │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔧 Detailed Service Design

### 1. Authentication Service (Auth-Service)

#### Service Responsibilities
- JWT token generation and validation
- LINE LIFF authentication for mobile users
- Role-based access control (RBAC) for Guard/Resident/Admin
- Session management
- Password policies

#### Database Schema
```sql
-- Users table (consolidated for all roles)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    line_user_id VARCHAR(255) UNIQUE,
    line_display_name VARCHAR(255),
    line_profile_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('guard', 'resident', 'admin')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('verified', 'pending', 'disable')),
    village_key VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Guards table (specific to guard role)
CREATE TABLE guards (
    guard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) UNIQUE,
    line_display_name VARCHAR(255),
    line_profile_url TEXT,
    email VARCHAR(255) NOT NULL UNIQUE,
    fname VARCHAR(255) NOT NULL,
    lname VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    village_key VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    hired_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Residents table (specific to resident role)
CREATE TABLE residents (
    resident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) UNIQUE,
    line_display_name VARCHAR(255),
    line_profile_url TEXT,
    email VARCHAR(255) NOT NULL UNIQUE,
    fname VARCHAR(255) NOT NULL,
    lname VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    village_key VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    move_in_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admins table (specific to admin role)
CREATE TABLE admins (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    email VARCHAR(255),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    village_key VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'superadmin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints
```typescript
// Authentication endpoints
POST   /api/v1/auth/login          # User login (all roles)
POST   /api/v1/auth/logout         # User logout
POST   /api/v1/auth/refresh        # Token refresh
POST   /api/v1/auth/verify         # Token verification

// LINE LIFF endpoints (for Guard & Resident)
POST   /api/v1/auth/liff/verify    # LINE ID token verification
POST   /api/v1/auth/liff/callback  # LINE OAuth callback

// Role-specific endpoints
GET    /api/v1/auth/guard/profile  # Get guard profile
GET    /api/v1/auth/resident/profile # Get resident profile
GET    /api/v1/auth/admin/profile  # Get admin profile

// RBAC endpoints
GET    /api/v1/auth/permissions    # Get user permissions
POST   /api/v1/auth/check          # Check permission
```

### 2. User Management Service (User-Service)

#### Service Responsibilities
- User profile management for all roles
- User registration and onboarding
- Role-specific user data management
- User preferences and settings
- User activity tracking

#### Service Architecture
```typescript
// user-service/src/
├── controllers/
│   ├── user.controller.ts         # General user CRUD operations
│   ├── guard.controller.ts        # Guard-specific operations
│   ├── resident.controller.ts     # Resident-specific operations
│   └── admin.controller.ts         # Admin-specific operations
├── services/
│   ├── user.service.ts            # Core user logic
│   ├── guard.service.ts            # Guard management
│   ├── resident.service.ts         # Resident management
│   ├── admin.service.ts            # Admin management
│   └── onboarding.service.ts      # User onboarding
├── models/
│   ├── user.model.ts              # Base user entity
│   ├── guard.model.ts             # Guard entity
│   ├── resident.model.ts          # Resident entity
│   └── admin.model.ts             # Admin entity
└── repositories/
    ├── user.repository.ts         # User data access
    ├── guard.repository.ts        # Guard data access
    ├── resident.repository.ts     # Resident data access
    └── admin.repository.ts        # Admin data access
```

#### API Endpoints
```typescript
// General user endpoints
GET    /api/v1/users               # Get users list (filtered by role)
GET    /api/v1/users/:id           # Get user by ID
POST   /api/v1/users               # Create new user
PUT    /api/v1/users/:id           # Update user
DELETE /api/v1/users/:id           # Delete user

// Guard-specific endpoints
GET    /api/v1/guards              # Get guards list
GET    /api/v1/guards/:id          # Get guard by ID
POST   /api/v1/guards              # Create new guard
PUT    /api/v1/guards/:id          # Update guard
GET    /api/v1/guards/:id/shifts   # Get guard shifts

// Resident-specific endpoints
GET    /api/v1/residents           # Get residents list
GET    /api/v1/residents/:id       # Get resident by ID
POST   /api/v1/residents           # Create new resident
PUT    /api/v1/residents/:id       # Update resident
GET    /api/v1/residents/:id/houses # Get resident houses

// Admin-specific endpoints
GET    /api/v1/admins              # Get admins list
GET    /api/v1/admins/:id          # Get admin by ID
POST   /api/v1/admins              # Create new admin
PUT    /api/v1/admins/:id          # Update admin
GET    /api/v1/admins/:id/villages # Get admin villages
```

### 3. Guard Service (Guard-Service)

#### Service Responsibilities
- Visitor check-in/check-out process
- ID card verification and scanning
- License plate scanning and verification
- Visitor logging and record keeping
- Guard shift management
- Real-time visitor status updates

#### Service Architecture
```typescript
// guard-service/src/
├── controllers/
│   ├── checkin.controller.ts      # Check-in operations
│   ├── verification.controller.ts  # ID verification
│   ├── logging.controller.ts       # Visitor logging
│   └── shift.controller.ts         # Shift management
├── services/
│   ├── checkin.service.ts          # Check-in logic
│   ├── verification.service.ts     # ID verification
│   ├── logging.service.ts          # Visitor logging
│   ├── shift.service.ts            # Shift management
│   └── notification.service.ts     # Real-time notifications
├── models/
│   ├── checkin.model.ts           # Check-in entity
│   ├── verification.model.ts      # Verification entity
│   ├── shift.model.ts             # Shift entity
│   └── log.model.ts               # Log entity
├── processors/
│   ├── id-processor.ts            # ID card processing
│   ├── license-processor.ts        # License plate processing
│   └── image-processor.ts         # Image processing
└── repositories/
    ├── checkin.repository.ts      # Check-in data access
    ├── verification.repository.ts # Verification data access
    └── shift.repository.ts        # Shift data access
```

#### API Endpoints
```typescript
// Check-in/out endpoints
POST   /api/v1/guard/checkin       # Visitor check-in
POST   /api/v1/guard/checkout      # Visitor check-out
GET    /api/v1/guard/visitors      # Get current visitors
GET    /api/v1/guard/visitors/:id  # Get visitor details

// Verification endpoints
POST   /api/v1/guard/verify/id     # Verify ID card
POST   /api/v1/guard/verify/license # Verify license plate
POST   /api/v1/guard/scan          # Scan documents

// Logging endpoints
GET    /api/v1/guard/logs          # Get guard logs
POST   /api/v1/guard/logs          # Create log entry
GET    /api/v1/guard/logs/:id      # Get specific log

// Shift management
GET    /api/v1/guard/shifts        # Get guard shifts
POST   /api/v1/guard/shifts        # Create shift
PUT    /api/v1/guard/shifts/:id    # Update shift
```

#### Guard Workflow Implementation
```typescript
// Guard Check-in Workflow
export class GuardCheckinWorkflow {
    constructor(
        private visitorService: VisitorService,
        private verificationService: VerificationService,
        private notificationService: NotificationService,
        private auditService: AuditService
    ) {}

    async processCheckin(checkinData: CheckinData): Promise<CheckinResult> {
        const { visitorId, guardId, idCardImage, licenseImage } = checkinData;

        try {
            // Step 1: Verify ID card
            const idVerification = await this.verificationService.verifyIdCard(idCardImage);
            if (!idVerification.isValid) {
                throw new VerificationError('Invalid ID card');
            }

            // Step 2: Verify license plate (if provided)
            let licenseVerification = null;
            if (licenseImage) {
                licenseVerification = await this.verificationService.verifyLicensePlate(licenseImage);
            }

            // Step 3: Create visitor record
            const visitorRecord = await this.visitorService.createRecord({
                visitorId,
                guardId,
                idCardData: idVerification.data,
                licenseData: licenseVerification?.data,
                entryTime: new Date(),
                status: 'pending'
            });

            // Step 4: Notify resident
            await this.notificationService.notifyResident(visitorRecord);

            // Step 5: Log audit event
            await this.auditService.log({
                action: 'VISITOR_CHECKIN',
                guardId,
                visitorId,
                timestamp: new Date()
            });

            return {
                success: true,
                visitorRecord,
                message: 'Visitor checked in successfully'
            };

        } catch (error) {
            await this.auditService.log({
                action: 'VISITOR_CHECKIN_FAILED',
                guardId,
                visitorId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
}
```

### 4. Resident Service (Resident-Service)

#### Service Responsibilities
- Visitor approval/rejection
- House and family member management
- Visitor history tracking
- Resident preferences and settings
- LINE LIFF integration for mobile access

#### Service Architecture
```typescript
// resident-service/src/
├── controllers/
│   ├── approval.controller.ts      # Visitor approval
│   ├── house.controller.ts         # House management
│   ├── family.controller.ts        # Family member management
│   └── history.controller.ts       # Visitor history
├── services/
│   ├── approval.service.ts         # Approval logic
│   ├── house.service.ts            # House management
│   ├── family.service.ts           # Family management
│   ├── history.service.ts          # History tracking
│   └── liff.service.ts             # LINE LIFF integration
├── models/
│   ├── approval.model.ts           # Approval entity
│   ├── house.model.ts              # House entity
│   ├── family.model.ts             # Family entity
│   └── history.model.ts            # History entity
└── repositories/
    ├── approval.repository.ts      # Approval data access
    ├── house.repository.ts         # House data access
    └── family.repository.ts        # Family data access
```

#### API Endpoints
```typescript
// Approval endpoints
GET    /api/v1/resident/pending     # Get pending visitors
POST   /api/v1/resident/approve/:id # Approve visitor
POST   /api/v1/resident/reject/:id  # Reject visitor
GET    /api/v1/resident/approvals   # Get approval history

// House management
GET    /api/v1/resident/houses      # Get resident houses
POST   /api/v1/resident/houses      # Add house
PUT    /api/v1/resident/houses/:id  # Update house
DELETE /api/v1/resident/houses/:id  # Remove house

// Family management
GET    /api/v1/resident/family      # Get family members
POST   /api/v1/resident/family      # Add family member
PUT    /api/v1/resident/family/:id  # Update family member
DELETE /api/v1/resident/family/:id  # Remove family member

// History and preferences
GET    /api/v1/resident/history     # Get visitor history
GET    /api/v1/resident/preferences # Get preferences
PUT    /api/v1/resident/preferences # Update preferences
```

#### Resident Approval Workflow
```typescript
// Resident Approval Workflow
export class ResidentApprovalWorkflow {
    constructor(
        private visitorService: VisitorService,
        private notificationService: NotificationService,
        private auditService: AuditService
    ) {}

    async processApproval(approvalData: ApprovalData): Promise<ApprovalResult> {
        const { visitorId, residentId, decision, reason } = approvalData;

        try {
            // Step 1: Update visitor status
            const visitor = await this.visitorService.updateStatus(visitorId, decision);

            // Step 2: Send notification to guard
            await this.notificationService.notifyGuard({
                visitorId,
                decision,
                residentId,
                timestamp: new Date()
            });

            // Step 3: Send notification to visitor (if approved)
            if (decision === 'approved') {
                await this.notificationService.notifyVisitor({
                    visitorId,
                    message: 'Your visit has been approved',
                    timestamp: new Date()
                });
            }

            // Step 4: Log audit event
            await this.auditService.log({
                action: 'VISITOR_APPROVAL',
                residentId,
                visitorId,
                decision,
                reason,
                timestamp: new Date()
            });

            return {
                success: true,
                visitor,
                message: `Visitor ${decision} successfully`
            };

        } catch (error) {
            await this.auditService.log({
                action: 'VISITOR_APPROVAL_FAILED',
                residentId,
                visitorId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
}
```

### 5. Admin Service (Admin-Service)

#### Service Responsibilities
- User management (Guard, Resident, Admin)
- Village settings and configuration
- System monitoring and analytics
- Reports and data export
- System administration

#### Service Architecture
```typescript
// admin-service/src/
├── controllers/
│   ├── user-management.controller.ts # User management
│   ├── village.controller.ts         # Village management
│   ├── monitoring.controller.ts      # System monitoring
│   ├── reports.controller.ts         # Reports and analytics
│   └── settings.controller.ts       # System settings
├── services/
│   ├── user-management.service.ts    # User management logic
│   ├── village.service.ts            # Village management
│   ├── monitoring.service.ts         # System monitoring
│   ├── reports.service.ts            # Reports generation
│   └── settings.service.ts           # Settings management
├── models/
│   ├── user-management.model.ts      # User management entity
│   ├── village.model.ts              # Village entity
│   ├── monitoring.model.ts           # Monitoring entity
│   └── report.model.ts               # Report entity
└── repositories/
    ├── user-management.repository.ts # User management data access
    ├── village.repository.ts         # Village data access
    └── monitoring.repository.ts      # Monitoring data access
```

#### API Endpoints
```typescript
// User management endpoints
GET    /api/v1/admin/users           # Get all users
GET    /api/v1/admin/users/:id       # Get user by ID
POST   /api/v1/admin/users           # Create user
PUT    /api/v1/admin/users/:id       # Update user
DELETE /api/v1/admin/users/:id       # Delete user
POST   /api/v1/admin/users/:id/activate # Activate user
POST   /api/v1/admin/users/:id/deactivate # Deactivate user

// Village management
GET    /api/v1/admin/villages        # Get villages
POST   /api/v1/admin/villages        # Create village
PUT    /api/v1/admin/villages/:id    # Update village
DELETE /api/v1/admin/villages/:id    # Delete village

// System monitoring
GET    /api/v1/admin/monitoring      # Get system status
GET    /api/v1/admin/monitoring/metrics # Get system metrics
GET    /api/v1/admin/monitoring/logs # Get system logs

// Reports and analytics
GET    /api/v1/admin/reports         # Get available reports
POST   /api/v1/admin/reports         # Generate report
GET    /api/v1/admin/reports/:id     # Get specific report
GET    /api/v1/admin/analytics       # Get analytics data

// System settings
GET    /api/v1/admin/settings        # Get system settings
PUT    /api/v1/admin/settings        # Update system settings
```

### 6. Visitor Service (Visitor-Service)

#### Service Responsibilities
- Visitor record management
- Visitor status tracking
- Image and document handling
- Visitor history and analytics
- Integration with Guard and Resident services

#### Database Schema
```sql
-- Visitor records table
CREATE TABLE visitor_records (
    visitor_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES residents(resident_id),
    guard_id UUID REFERENCES guards(guard_id),
    house_id UUID REFERENCES houses(house_id),
    id_card_image TEXT,
    license_image TEXT,
    visitor_name VARCHAR(255),
    visitor_id_card VARCHAR(255),
    license_plate VARCHAR(255),
    entry_time TIMESTAMP DEFAULT NOW(),
    exit_time TIMESTAMP,
    record_status VARCHAR(50) DEFAULT 'pending' CHECK (record_status IN ('approved', 'pending', 'rejected')),
    visit_purpose TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Visitor statistics table
CREATE TABLE visitor_statistics (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_key VARCHAR(100),
    date DATE,
    total_visitors INTEGER DEFAULT 0,
    approved_visitors INTEGER DEFAULT 0,
    rejected_visitors INTEGER DEFAULT 0,
    pending_visitors INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints
```typescript
// Visitor record endpoints
GET    /api/v1/visitors              # Get visitor records
GET    /api/v1/visitors/:id          # Get visitor by ID
POST   /api/v1/visitors              # Create visitor record
PUT    /api/v1/visitors/:id          # Update visitor record
DELETE /api/v1/visitors/:id          # Delete visitor record

// Status management
PUT    /api/v1/visitors/:id/status   # Update visitor status
GET    /api/v1/visitors/status/:status # Get visitors by status

// Analytics endpoints
GET    /api/v1/visitors/analytics    # Get visitor analytics
GET    /api/v1/visitors/statistics   # Get visitor statistics
GET    /api/v1/visitors/reports      # Get visitor reports
```

### 7. Notification Service (Notification-Service)

#### Service Responsibilities
- Real-time WebSocket notifications
- Push notifications via LINE
- Email notifications
- SMS notifications
- Role-specific notification routing

#### Service Architecture
```typescript
// notification-service/src/
├── controllers/
│   ├── notification.controller.ts   # Notification endpoints
│   ├── websocket.controller.ts     # WebSocket handling
│   └── template.controller.ts      # Template management
├── services/
│   ├── notification.service.ts     # Core notification logic
│   ├── websocket.service.ts        # WebSocket management
│   ├── line.service.ts             # LINE push notifications
│   ├── email.service.ts            # Email service
│   └── sms.service.ts              # SMS service
├── channels/
│   ├── guard.channel.ts            # Guard notifications
│   ├── resident.channel.ts         # Resident notifications
│   └── admin.channel.ts            # Admin notifications
└── templates/
    ├── guard.templates.ts          # Guard notification templates
    ├── resident.templates.ts       # Resident notification templates
    └── admin.templates.ts          # Admin notification templates
```

#### Role-Specific Notification Routing
```typescript
// Notification Routing by Role
export class NotificationRouter {
    constructor(
        private websocketService: WebSocketService,
        private lineService: LineService,
        private emailService: EmailService,
        private smsService: SmsService
    ) {}

    async sendNotification(notification: Notification): Promise<void> {
        const { recipientId, recipientRole, type, data } = notification;

        switch (recipientRole) {
            case 'guard':
                await this.sendToGuard(recipientId, type, data);
                break;
            case 'resident':
                await this.sendToResident(recipientId, type, data);
                break;
            case 'admin':
                await this.sendToAdmin(recipientId, type, data);
                break;
        }
    }

    private async sendToGuard(guardId: string, type: string, data: any): Promise<void> {
        // WebSocket notification for real-time updates
        await this.websocketService.sendToUser(guardId, {
            type: 'GUARD_NOTIFICATION',
            data: { type, ...data }
        });

        // LINE push notification
        await this.lineService.sendPushNotification(guardId, {
            title: 'Guard Notification',
            message: this.getGuardMessage(type, data)
        });
    }

    private async sendToResident(residentId: string, type: string, data: any): Promise<void> {
        // WebSocket notification
        await this.websocketService.sendToUser(residentId, {
            type: 'RESIDENT_NOTIFICATION',
            data: { type, ...data }
        });

        // LINE push notification
        await this.lineService.sendPushNotification(residentId, {
            title: 'Resident Notification',
            message: this.getResidentMessage(type, data)
        });
    }

    private async sendToAdmin(adminId: string, type: string, data: any): Promise<void> {
        // WebSocket notification
        await this.websocketService.sendToUser(adminId, {
            type: 'ADMIN_NOTIFICATION',
            data: { type, ...data }
        });

        // Email notification for important admin events
        if (this.isImportantAdminEvent(type)) {
            await this.emailService.sendEmail(adminId, {
                subject: 'Admin Alert',
                body: this.getAdminEmailBody(type, data)
            });
        }
    }
}
```

## 🔄 Inter-Service Communication Patterns

### 1. Guard-Resident Communication Flow

```
Guard Service → Visitor Service → Resident Service → Notification Service
     │              │                │                    │
     │              │                │                    │
     ▼              ▼                ▼                    ▼
Check-in      Create Record    Send Approval    Notify Resident
Process       with Status      Request         via LINE/WebSocket
```

### 2. Admin Monitoring Flow

```
Admin Service → All Services → Audit Service → Report Service
     │              │              │              │
     │              │              │              │
     ▼              ▼              ▼              ▼
Request Data   Send Metrics    Log Activities   Generate Reports
```

### 3. Event-Driven Communication

```typescript
// Event Types for Village Security System
export enum EventType {
    // Guard Events
    VISITOR_CHECKIN = 'VISITOR_CHECKIN',
    VISITOR_CHECKOUT = 'VISITOR_CHECKOUT',
    ID_VERIFICATION = 'ID_VERIFICATION',
    
    // Resident Events
    VISITOR_APPROVAL = 'VISITOR_APPROVAL',
    VISITOR_REJECTION = 'VISITOR_REJECTION',
    HOUSE_UPDATE = 'HOUSE_UPDATE',
    
    // Admin Events
    USER_CREATED = 'USER_CREATED',
    USER_UPDATED = 'USER_UPDATED',
    VILLAGE_SETTINGS_CHANGED = 'VILLAGE_SETTINGS_CHANGED',
    
    // System Events
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}

// Event Handler Implementation
export class VillageSecurityEventHandler {
    constructor(
        private notificationService: NotificationService,
        private auditService: AuditService,
        private reportService: ReportService
    ) {}

    @EventHandler(EventType.VISITOR_CHECKIN)
    async handleVisitorCheckin(event: VisitorCheckinEvent): Promise<void> {
        // Notify resident about visitor
        await this.notificationService.sendToResident(event.residentId, {
            type: 'VISITOR_CHECKIN',
            data: {
                visitorName: event.visitorName,
                entryTime: event.entryTime,
                guardName: event.guardName
            }
        });

        // Log audit event
        await this.auditService.log({
            action: 'VISITOR_CHECKIN',
            guardId: event.guardId,
            residentId: event.residentId,
            visitorId: event.visitorId,
            timestamp: event.timestamp
        });
    }

    @EventHandler(EventType.VISITOR_APPROVAL)
    async handleVisitorApproval(event: VisitorApprovalEvent): Promise<void> {
        // Notify guard about approval
        await this.notificationService.sendToGuard(event.guardId, {
            type: 'VISITOR_APPROVAL',
            data: {
                visitorId: event.visitorId,
                decision: event.decision,
                residentName: event.residentName
            }
        });

        // Update visitor status
        await this.visitorService.updateStatus(event.visitorId, event.decision);

        // Log audit event
        await this.auditService.log({
            action: 'VISITOR_APPROVAL',
            residentId: event.residentId,
            visitorId: event.visitorId,
            decision: event.decision,
            timestamp: event.timestamp
        });
    }
}
```

## 🗄️ Data Management Strategy

### 1. Database per Service Pattern

```yaml
# Database assignments for Village Security System
auth-service:        auth_db          # Users, roles, permissions
user-service:        user_db          # User profiles, preferences
guard-service:       guard_db         # Guard shifts, check-ins
resident-service:    resident_db      # Resident houses, family
admin-service:       admin_db         # Admin settings, monitoring
visitor-service:     visitor_db       # Visitor records, statistics
notification-service: notification_db # Notification templates, delivery
audit-service:       audit_db         # Audit logs, compliance
```

### 2. Cross-Service Data Synchronization

```typescript
// Saga Pattern for User Registration
export class UserRegistrationSaga {
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private notificationService: NotificationService,
        private auditService: AuditService
    ) {}

    async execute(userData: CreateUserDTO): Promise<void> {
        const sagaId = generateUUID();
        
        try {
            // Step 1: Create user in auth-service
            const user = await this.authService.createUser(userData);
            
            // Step 2: Create profile in user-service
            await this.userService.createProfile({
                userId: user.id,
                role: user.role,
                villageKey: user.villageKey
            });
            
            // Step 3: Send welcome notification
            await this.notificationService.sendWelcomeNotification(user);
            
            // Step 4: Log audit event
            await this.auditService.log({
                action: 'USER_REGISTRATION',
                userId: user.id,
                role: user.role,
                timestamp: new Date()
            });
            
        } catch (error) {
            // Compensating actions
            await this.compensate(sagaId, error);
        }
    }

    private async compensate(sagaId: string, error: Error): Promise<void> {
        console.log(`Saga ${sagaId} failed: ${error.message}`);
        // Implement compensating actions to rollback changes
    }
}
```

## 🔒 Security Architecture

### 1. Role-Based Access Control (RBAC)

```typescript
// RBAC Implementation
export class RBACService {
    private rolePermissions = {
        'guard': [
            'visitor.read',
            'visitor.create',
            'visitor.update',
            'checkin.create',
            'checkout.create',
            'verification.create'
        ],
        'resident': [
            'visitor.read',
            'visitor.approve',
            'visitor.reject',
            'house.read',
            'house.update',
            'family.read',
            'family.update'
        ],
        'admin': [
            'user.read',
            'user.create',
            'user.update',
            'user.delete',
            'village.read',
            'village.create',
            'village.update',
            'village.delete',
            'system.monitor',
            'reports.generate'
        ]
    };

    hasPermission(userRole: string, permission: string): boolean {
        const permissions = this.rolePermissions[userRole] || [];
        return permissions.includes(permission);
    }

    canAccessResource(userRole: string, resource: string, action: string): boolean {
        const permission = `${resource}.${action}`;
        return this.hasPermission(userRole, permission);
    }
}
```

### 2. Service-to-Service Authentication

```yaml
# Istio Authorization Policy for Village Security
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: village-security-policy
spec:
  rules:
  # Guard service can access visitor service
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/guard-service"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/v1/visitors/*"]
  
  # Resident service can access visitor service
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/resident-service"]
    to:
    - operation:
        methods: ["GET", "PUT"]
        paths: ["/api/v1/visitors/*"]
  
  # Admin service can access all services
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/admin-service"]
    to:
    - operation:
        methods: ["GET", "POST", "PUT", "DELETE"]
        paths: ["/api/v1/*"]
```

## 📊 Monitoring & Observability

### 1. Role-Specific Metrics

```typescript
// Metrics for Village Security System
export class VillageSecurityMetrics {
    // Guard metrics
    private guardCheckins = new Counter({
        name: 'guard_checkins_total',
        help: 'Total number of visitor check-ins',
        labelNames: ['guard_id', 'village_key']
    });

    private guardVerificationTime = new Histogram({
        name: 'guard_verification_duration_seconds',
        help: 'Time taken for ID verification',
        labelNames: ['guard_id', 'verification_type']
    });

    // Resident metrics
    private residentApprovals = new Counter({
        name: 'resident_approvals_total',
        help: 'Total number of visitor approvals',
        labelNames: ['resident_id', 'decision']
    });

    private approvalResponseTime = new Histogram({
        name: 'approval_response_duration_seconds',
        help: 'Time taken to respond to visitor requests',
        labelNames: ['resident_id']
    });

    // Admin metrics
    private adminActions = new Counter({
        name: 'admin_actions_total',
        help: 'Total number of admin actions',
        labelNames: ['admin_id', 'action_type']
    });

    private systemHealth = new Gauge({
        name: 'system_health_score',
        help: 'Overall system health score',
        labelNames: ['village_key']
    });

    // Record guard check-in
    recordGuardCheckin(guardId: string, villageKey: string): void {
        this.guardCheckins.labels(guardId, villageKey).inc();
    }

    // Record verification time
    recordVerificationTime(guardId: string, verificationType: string, duration: number): void {
        this.guardVerificationTime.labels(guardId, verificationType).observe(duration);
    }

    // Record resident approval
    recordResidentApproval(residentId: string, decision: string): void {
        this.residentApprovals.labels(residentId, decision).inc();
    }

    // Record approval response time
    recordApprovalResponseTime(residentId: string, duration: number): void {
        this.approvalResponseTime.labels(residentId).observe(duration);
    }

    // Record admin action
    recordAdminAction(adminId: string, actionType: string): void {
        this.adminActions.labels(adminId, actionType).inc();
    }

    // Update system health
    updateSystemHealth(villageKey: string, score: number): void {
        this.systemHealth.labels(villageKey).set(score);
    }
}
```

## 🚀 Deployment Strategy

### 1. Kubernetes Deployment for Village Security

```yaml
# guard-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guard-service
  labels:
    app: guard-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: guard-service
  template:
    metadata:
      labels:
        app: guard-service
    spec:
      containers:
      - name: guard-service
        image: village-security/guard-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: guard-db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: SERVICE_NAME
          value: "guard-service"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# resident-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resident-service
  labels:
    app: resident-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: resident-service
  template:
    metadata:
      labels:
        app: resident-service
    spec:
      containers:
      - name: resident-service
        image: village-security/resident-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: resident-db-secret
              key: url
        - name: LINE_CHANNEL_ID
          valueFrom:
            secretKeyRef:
              name: line-secret
              key: channel-id
        - name: SERVICE_NAME
          value: "resident-service"

---
# admin-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-service
  labels:
    app: admin-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: admin-service
  template:
    metadata:
      labels:
        app: admin-service
    spec:
      containers:
      - name: admin-service
        image: village-security/admin-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: admin-db-secret
              key: url
        - name: SERVICE_NAME
          value: "admin-service"
```

## 🎯 Benefits of This Microservices Architecture

### 1. Role-Specific Optimization
- **Guard Service**: Optimized for real-time check-in/out operations
- **Resident Service**: Optimized for mobile LINE LIFF integration
- **Admin Service**: Optimized for management and monitoring

### 2. Independent Scaling
- Scale Guard Service based on village traffic
- Scale Resident Service based on active residents
- Scale Admin Service based on administrative workload

### 3. Fault Isolation
- Guard service failure doesn't affect resident approvals
- Resident service failure doesn't affect admin operations
- Each service can be maintained independently

### 4. Technology Flexibility
- Use different technologies for different roles
- Guard service might use real-time processing libraries
- Resident service might use mobile-optimized frameworks
- Admin service might use analytics and reporting tools

## 📈 Migration Strategy

### Phase 1: Core Services (Weeks 1-4)
1. Extract Authentication Service
2. Extract User Management Service
3. Extract Visitor Service
4. Implement basic service communication

### Phase 2: Role-Specific Services (Weeks 5-8)
1. Extract Guard Service
2. Extract Resident Service
3. Extract Admin Service
4. Implement role-based workflows

### Phase 3: Supporting Services (Weeks 9-12)
1. Extract Notification Service
2. Extract Audit Service
3. Extract Report Service
4. Implement event-driven architecture

### Phase 4: Optimization (Weeks 13-16)
1. Performance optimization
2. Security hardening
3. Monitoring enhancement
4. Documentation completion

---

## 📝 Conclusion

การออกแบบ Microservices Architecture นี้ถูกปรับให้ตรงกับโครงสร้างของ Village Security Project โดยเน้นที่ 3 roles หลัก:

1. **Guard Service**: จัดการการ check-in/out ของผู้เยี่ยม
2. **Resident Service**: จัดการการอนุมัติผู้เยี่ยมและจัดการบ้าน
3. **Admin Service**: จัดการระบบและผู้ใช้ทั้งหมด

การออกแบบนี้จะทำให้ระบบมีความยืดหยุ่น สามารถขยายตัวได้ตามความต้องการของแต่ละ role และง่ายต่อการบำรุงรักษา
