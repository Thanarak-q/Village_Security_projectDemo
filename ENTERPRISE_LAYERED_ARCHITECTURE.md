# Village Security System - Enterprise Layered Architecture (Detailed)

## 🏗️ Current Architecture Analysis

### Existing Structure
```
Village Security Project
├── backend/          # ElysiaJS API Server
├── frontend/         # Next.js React App
├── websocket/        # Bun WebSocket Service
└── docker-compose.yml # Container Orchestration
```

## 🎯 Enterprise Layered Architecture Pattern

### 1. Comprehensive Layered Architecture Design

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Web Client Layer          │  Mobile Client Layer      │  Admin Client Layer     │
│  ┌─────────────────────┐   │  ┌─────────────────────┐   │  ┌─────────────────────┐ │
│  │ Next.js Frontend    │   │  │ React Native App   │   │  │ Admin Dashboard     │ │
│  │ ├─ React Components │   │  │ ├─ Native UI       │   │  │ ├─ Analytics UI     │ │
│  │ ├─ Tailwind CSS     │   │  │ ├─ Push Notify    │   │  │ ├─ Report Builder   │ │
│  │ ├─ State Management │   │  │ ├─ Offline Sync    │   │  │ ├─ User Management  │ │
│  │ └─ PWA Features     │   │  │ └─ Camera Access  │   │  │ └─ System Monitor   │ │
│  └─────────────────────┘   │  └─────────────────────┘   │  └─────────────────────┘ │
│                            │                            │                        │
│  External Integration Layer │  Third-party Integration   │  API Documentation     │
│  ├─ LINE LIFF SDK         │  ├─ LINE Bot API           │  ├─ Swagger/OpenAPI    │
│  ├─ Google Maps API       │  ├─ Firebase Push          │  ├─ Postman Collection  │
│  ├─ Payment Gateway       │  ├─ SMS Gateway            │  └─ GraphQL Playground │
│  └─ Social Login          │  └─ Email Service         │                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Load Balancer & SSL Termination  │  Reverse Proxy & Routing  │  Security Layer  │
│  ┌─────────────────────────────┐  │  ┌─────────────────────┐   │  ┌─────────────┐ │
│  │ Nginx/HAProxy              │  │  │ Caddy Server        │   │  │ Rate Limit  │ │
│  │ ├─ SSL/TLS Termination     │  │  │ ├─ Route Management │   │  │ ├─ DDoS Prot │ │
│  │ ├─ Health Checks           │   │  │ ├─ Load Balancing  │   │  │ ├─ CORS      │ │
│  │ ├─ Circuit Breaker         │   │  │ ├─ WebSocket Proxy │   │  │ ├─ Auth     │ │
│  │ └─ Failover Logic          │   │  │ └─ Static Files    │   │  │ └─ Validation│ │
│  └─────────────────────────────┘  │  └─────────────────────┘   │  └─────────────┘ │
│                                   │                            │                  │
│  API Management & Monitoring      │  Content Delivery         │  Request/Response │
│  ├─ API Versioning              │  ├─ CDN Integration        │  ├─ Compression   │
│  ├─ Request/Response Logging    │  ├─ Static Asset Cache    │  ├─ Transformation│
│  ├─ Performance Metrics         │  ├─ Image Optimization    │  └─ Error Handling│
│  └─ API Analytics               │  └─ Gzip Compression      │                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  API Controllers & Handlers     │  Business Services        │  Integration Layer │
│  ┌─────────────────────────┐   │  ┌─────────────────────┐   │  ┌─────────────┐   │
│  │ REST API Controllers    │   │  │ Core Business Logic │   │  │ External APIs│   │
│  │ ├─ AuthController       │   │  │ ├─ UserService      │   │  │ ├─ LINE API  │   │
│  │ ├─ VisitorController    │   │  │ ├─ VillageService  │   │  │ ├─ Payment   │   │
│  │ ├─ AdminController      │   │  │ ├─ VisitorService  │   │  │ ├─ SMS/Email │   │
│  │ ├─ ReportController     │   │  │ ├─ NotificationSvc  │   │  │ └─ Maps API  │   │
│  │ └─ FileController       │   │  │ └─ AuditService    │   │  └─────────────┘   │
│  └─────────────────────────┘   │  └─────────────────────┘   │                   │
│                                │                            │                   │
│  WebSocket Handlers            │  Event Handlers            │  Background Jobs  │
│  ├─ Real-time Notifications   │  ├─ Domain Events          │  ├─ Queue Workers │
│  ├─ Live Updates              │  ├─ Event Sourcing         │  ├─ Scheduled Tasks│
│  ├─ Connection Management     │  ├─ CQRS Implementation    │  ├─ Data Sync     │
│  └─ Message Broadcasting      │  └─ Event Store            │  └─ Cleanup Jobs  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS LOGIC LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Domain Services & Use Cases     │  Business Rules Engine    │  Workflow Engine   │
│  ┌───────────────────────────┐   │  ┌─────────────────────┐  │  ┌─────────────┐  │
│  │ Core Domain Logic         │   │  │ Rule Engine         │  │  │ Workflow Mgmt│  │
│  │ ├─ User Management        │   │  │ ├─ Access Control   │  │  │ ├─ Approval  │  │
│  │ ├─ Village Management     │   │  │ ├─ Business Rules   │  │  │ ├─ Escalation│  │
│  │ ├─ Visitor Management     │   │  │ ├─ Validation Rules  │  │  │ ├─ Notify   │  │
│  │ ├─ Security Management    │   │  │ └─ Policy Engine    │  │  │ └─ Audit    │  │
│  │ └─ Notification Management│   │  └─────────────────────┘  │  └─────────────┘  │
│  └───────────────────────────┘   │                           │                   │
│                                  │  Business Process Mgmt   │  State Management │
│  Domain Events & Commands         │  ├─ Process Orchestration│  ├─ State Machine │
│  ├─ Command Pattern              │  ├─ Business Process     │  ├─ Event Sourcing│
│  ├─ Event Sourcing               │  ├─ Workflow Definition  │  ├─ CQRS Pattern  │
│  ├─ CQRS Implementation          │  └─ Process Monitoring   │  └─ Saga Pattern   │
│  └─ Domain Model                  │                           │                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA ACCESS LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Repository Pattern & ORM      │  Data Services Layer      │  Cache Layer        │
│  ┌─────────────────────────┐   │  ┌─────────────────────┐   │  ┌─────────────┐    │
│  │ Repository Interfaces   │   │  │ Data Access Objects │   │  │ Redis Cache │    │
│  │ ├─ UserRepository       │   │  │ ├─ UserDAO          │   │  │ ├─ Session  │    │
│  │ ├─ VillageRepository    │   │  │ ├─ VillageDAO      │   │  │ ├─ Query    │    │
│  │ ├─ VisitorRepository    │   │  │ ├─ VisitorDAO      │   │  │ ├─ Rate Limit│   │
│  │ ├─ NotificationRepo     │   │  │ └─ AuditDAO        │   │  │ └─ Temp Data │    │
│  │ └─ AuditRepository       │   │  └─────────────────────┘   │  └─────────────┘    │
│  └─────────────────────────┘   │                           │                     │
│                                │  Data Transformation     │  Search Engine      │
│  ORM & Database Abstraction    │  ├─ Entity Mapping        │  ├─ Elasticsearch   │
│  ├─ Drizzle ORM                │  ├─ Data Validation       │  ├─ Full-text Search│
│  ├─ Query Builder              │  ├─ Data Serialization   │  ├─ Analytics      │
│  ├─ Migration Management       │  └─ Data Aggregation      │  └─ Reporting      │
│  └─ Connection Pooling         │                           │                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Database Layer              │  External Services        │  Monitoring & Logging│
│  ┌─────────────────────┐     │  ┌─────────────────────┐   │  ┌─────────────┐     │
│  │ PostgreSQL Cluster  │     │  │ Third-party APIs    │   │  │ Application │     │
│  │ ├─ Primary DB       │     │  │ ├─ LINE Platform    │   │  │ Monitoring  │     │
│  │ ├─ Read Replicas    │     │  │ ├─ Payment Gateway  │   │  │ ├─ Metrics  │     │
│  │ ├─ Backup Strategy  │     │  │ ├─ SMS/Email Service│   │  │ ├─ Tracing  │     │
│  │ └─ Data Archiving   │     │  │ └─ Maps Service     │   │  │ └─ Profiling│     │
│  └─────────────────────┘     │  └─────────────────────┘   │  └─────────────┘     │
│                               │                           │                     │
│  File Storage & CDN           │  Message Queue            │  Security Services   │
│  ├─ Object Storage (S3)      │  ├─ Redis Pub/Sub         │  ├─ Secret Management│
│  ├─ CDN Distribution         │  ├─ RabbitMQ             │  ├─ Certificate Mgmt │
│  ├─ Image Processing          │  ├─ Event Streaming     │  ├─ Encryption      │
│  └─ Backup & Recovery         │  └─ Dead Letter Queue    │  └─ Audit Logging   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 Detailed Layer Analysis & Implementation

### 2. Presentation Layer - Deep Dive

#### 2.1 Web Client Architecture
```typescript
// frontend/src/architecture/presentation/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── forms/                 # Form components with validation
│   ├── charts/                # Data visualization components
│   ├── tables/                # Data table components
│   └── layouts/                # Layout components
├── hooks/
│   ├── useAuth.ts             # Authentication hook
│   ├── useWebSocket.ts        # WebSocket connection hook
│   ├── useNotifications.ts    # Notification management
│   └── useVillageContext.ts   # Village context management
├── stores/
│   ├── authStore.ts           # Authentication state
│   ├── villageStore.ts        # Village selection state
│   └── notificationStore.ts   # Notification state
└── services/
    ├── apiClient.ts           # HTTP client with interceptors
    ├── websocketClient.ts     # WebSocket client
    └── cacheService.ts        # Client-side caching
```

#### 2.2 Mobile Client Architecture (React Native)
```typescript
// mobile/src/architecture/
├── screens/
│   ├── auth/                  # Authentication screens
│   ├── visitor/               # Visitor management screens
│   ├── guard/                 # Guard-specific screens
│   └── resident/              # Resident-specific screens
├── components/
│   ├── camera/                # Camera integration
│   ├── maps/                  # Map integration
│   └── notifications/         # Push notification handling
├── services/
│   ├── lineService.ts         # LINE LIFF integration
│   ├── cameraService.ts       # Camera and image processing
│   └── offlineService.ts     # Offline data synchronization
└── navigation/
    ├── authNavigator.ts       # Authentication flow
    ├── mainNavigator.ts       # Main app navigation
    └── tabNavigator.ts        # Tab-based navigation
```

#### 2.3 Admin Dashboard Architecture
```typescript
// admin-dashboard/src/architecture/
├── modules/
│   ├── analytics/             # Analytics and reporting
│   ├── userManagement/        # User administration
│   ├── systemMonitoring/      # System health monitoring
│   └── configuration/         # System configuration
├── components/
│   ├── charts/                # Advanced charting components
│   ├── dataGrids/             # Complex data grids
│   └── dashboards/            # Dashboard widgets
└── services/
    ├── analyticsService.ts    # Analytics data service
    ├── monitoringService.ts   # System monitoring
    └── reportService.ts       # Report generation
```

### 3. API Gateway Layer - Enterprise Implementation

#### 3.1 Load Balancer Configuration
```yaml
# nginx/nginx.conf
upstream backend_cluster {
    least_conn;
    server backend-1:3001 max_fails=3 fail_timeout=30s;
    server backend-2:3001 max_fails=3 fail_timeout=30s;
    server backend-3:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream websocket_cluster {
    ip_hash;  # Sticky sessions for WebSocket
    server websocket-1:3002;
    server websocket-2:3002;
    server websocket-3:3002;
}

server {
    listen 80;
    server_name village-security.com;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
    
    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 30s;
        
        # Health checks
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }
    
    # Authentication routes (stricter rate limiting)
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://backend_cluster;
    }
    
    # WebSocket routes
    location /ws {
        proxy_pass http://websocket_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

#### 3.2 Caddy Configuration (Alternative)
```caddyfile
# Caddyfile.production
{
    # Global options
    auto_https off
    log {
        output file /var/log/caddy/access.log
        format json
        level INFO
    }
    
    # Rate limiting
    rate_limit {
        zone static {
            key {remote_host}
            events 100
            window 1m
        }
    }
}

:80 {
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
    
    # API routes with load balancing
    reverse_proxy /api/* {
        to backend-1:3001 backend-2:3001 backend-3:3001
        health_uri /api/health
        health_interval 30s
        health_timeout 5s
        
        # Load balancing policy
        lb_policy round_robin
        
        # Health check configuration
        health_status 2xx
    }
    
    # WebSocket with sticky sessions
    reverse_proxy /ws {
        to websocket-1:3002 websocket-2:3002 websocket-3:3002
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
        
        # WebSocket specific headers
        header_up Connection "upgrade"
        header_up Upgrade "websocket"
    }
    
    # Frontend
    reverse_proxy / {
        to frontend:3000
    }
    
    # Enable compression
    encode gzip
    
    # Logging
    log {
        output file /var/log/caddy/api.log
        format json
        level INFO
    }
}
```

### 4. Application Layer - Service-Oriented Architecture

#### 4.1 Service Layer Implementation
```typescript
// backend/src/services/
export interface IService<T, K> {
    create(data: T): Promise<K>;
    findById(id: string): Promise<K | null>;
    update(id: string, data: Partial<T>): Promise<K>;
    delete(id: string): Promise<void>;
    findAll(filters?: any): Promise<K[]>;
}

// User Service Implementation
export class UserService implements IService<CreateUserDTO, User> {
    constructor(
        private userRepository: IUserRepository,
        private cacheService: ICacheService,
        private eventBus: IEventBus,
        private auditService: IAuditService
    ) {}
    
    async create(data: CreateUserDTO): Promise<User> {
        // Business logic validation
        await this.validateUserCreation(data);
        
        // Create user
        const user = await this.userRepository.create(data);
        
        // Cache the result
        await this.cacheService.set(`user:${user.id}`, user, 3600);
        
        // Publish domain event
        await this.eventBus.publish(new UserCreatedEvent(user));
        
        // Audit log
        await this.auditService.log({
            action: 'USER_CREATED',
            userId: user.id,
            details: { email: user.email, role: user.role }
        });
        
        return user;
    }
    
    async findById(id: string): Promise<User | null> {
        // Try cache first
        const cached = await this.cacheService.get(`user:${id}`);
        if (cached) return cached;
        
        // Fetch from database
        const user = await this.userRepository.findById(id);
        
        // Cache the result
        if (user) {
            await this.cacheService.set(`user:${id}`, user, 1800);
        }
        
        return user;
    }
    
    private async validateUserCreation(data: CreateUserDTO): Promise<void> {
        // Business rules validation
        if (data.role === 'admin' && !data.villageKey) {
            throw new BusinessRuleViolation('Admin users must be assigned to a village');
        }
        
        // Check for duplicate email
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new DuplicateEntityError('User with this email already exists');
        }
    }
}
```

#### 4.2 Controller Layer Implementation
```typescript
// backend/src/controllers/
export class UserController {
    constructor(
        private userService: UserService,
        private validator: IValidator,
        private logger: ILogger
    ) {}
    
    async createUser(req: Request, res: Response): Promise<void> {
        try {
            // Input validation
            const validationResult = await this.validator.validate(CreateUserSchema, req.body);
            if (!validationResult.isValid) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: validationResult.errors
                });
                return;
            }
            
            // Authorization check
            const currentUser = req.user;
            if (!this.canCreateUser(currentUser, req.body.role)) {
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }
            
            // Create user
            const user = await this.userService.create(req.body);
            
            // Log the action
            this.logger.info('User created', {
                userId: user.id,
                createdBy: currentUser.id,
                timestamp: new Date().toISOString()
            });
            
            res.status(201).json({
                success: true,
                data: user,
                message: 'User created successfully'
            });
            
        } catch (error) {
            this.handleError(error, res);
        }
    }
    
    private canCreateUser(currentUser: User, targetRole: string): boolean {
        const roleHierarchy = {
            'superadmin': ['admin', 'staff', 'guard', 'resident'],
            'admin': ['staff', 'guard', 'resident'],
            'staff': ['guard', 'resident'],
            'guard': [],
            'resident': []
        };
        
        return roleHierarchy[currentUser.role]?.includes(targetRole) || false;
    }
    
    private handleError(error: Error, res: Response): void {
        if (error instanceof BusinessRuleViolation) {
            res.status(422).json({ error: error.message });
        } else if (error instanceof DuplicateEntityError) {
            res.status(409).json({ error: error.message });
        } else {
            this.logger.error('Unexpected error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
```

### 5. Business Logic Layer - Domain-Driven Design

#### 5.1 Domain Model Implementation
```typescript
// backend/src/domains/user/entities/
export class User {
    private constructor(
        private readonly _id: UserId,
        private _email: Email,
        private _role: UserRole,
        private _status: UserStatus,
        private _villageKey: VillageKey | null,
        private _createdAt: Date,
        private _updatedAt: Date
    ) {}
    
    static create(data: CreateUserData): User {
        // Domain validation
        if (!data.email || !data.role) {
            throw new DomainError('Email and role are required');
        }
        
        // Business rule: Admin users must have village assignment
        if (data.role === 'admin' && !data.villageKey) {
            throw new BusinessRuleViolation('Admin users must be assigned to a village');
        }
        
        return new User(
            UserId.generate(),
            Email.create(data.email),
            UserRole.create(data.role),
            UserStatus.PENDING,
            data.villageKey ? VillageKey.create(data.villageKey) : null,
            new Date(),
            new Date()
        );
    }
    
    promoteToAdmin(villageKey: VillageKey): void {
        if (this._role.value === 'superadmin') {
            throw new BusinessRuleViolation('Superadmin cannot be promoted to admin');
        }
        
        this._role = UserRole.create('admin');
        this._villageKey = villageKey;
        this._updatedAt = new Date();
    }
    
    activate(): void {
        if (this._status === UserStatus.ACTIVE) {
            throw new BusinessRuleViolation('User is already active');
        }
        
        this._status = UserStatus.ACTIVE;
        this._updatedAt = new Date();
    }
    
    // Getters
    get id(): UserId { return this._id; }
    get email(): Email { return this._email; }
    get role(): UserRole { return this._role; }
    get status(): UserStatus { return this._status; }
    get villageKey(): VillageKey | null { return this._villageKey; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }
}
```

#### 5.2 Value Objects Implementation
```typescript
// backend/src/domains/user/value-objects/
export class Email {
    private constructor(private readonly _value: string) {}
    
    static create(email: string): Email {
        if (!this.isValid(email)) {
            throw new DomainError('Invalid email format');
        }
        return new Email(email.toLowerCase().trim());
    }
    
    private static isValid(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 255;
    }
    
    get value(): string { return this._value; }
    
    equals(other: Email): boolean {
        return this._value === other._value;
    }
}

export class UserRole {
    private constructor(private readonly _value: string) {}
    
    static create(role: string): UserRole {
        const validRoles = ['superadmin', 'admin', 'staff', 'guard', 'resident'];
        if (!validRoles.includes(role)) {
            throw new DomainError(`Invalid role: ${role}`);
        }
        return new UserRole(role);
    }
    
    get value(): string { return this._value; }
    
    hasPermission(permission: string): boolean {
        const rolePermissions = {
            'superadmin': ['*'],
            'admin': ['user.read', 'user.create', 'visitor.read', 'visitor.create', 'visitor.approve'],
            'staff': ['visitor.read', 'visitor.approve', 'user.read'],
            'guard': ['visitor.read', 'visitor.create'],
            'resident': ['visitor.read']
        };
        
        const permissions = rolePermissions[this._value] || [];
        return permissions.includes('*') || permissions.includes(permission);
    }
}
```

#### 5.3 Domain Events Implementation
```typescript
// backend/src/domains/user/events/
export abstract class DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly occurredOn: Date,
        public readonly eventType: string
    ) {}
}

export class UserCreatedEvent extends DomainEvent {
    constructor(
        public readonly user: User,
        public readonly createdBy: string
    ) {
        super(user.id.value, new Date(), 'UserCreated');
    }
}

export class UserPromotedEvent extends DomainEvent {
    constructor(
        public readonly userId: string,
        public readonly newRole: string,
        public readonly promotedBy: string
    ) {
        super(userId, new Date(), 'UserPromoted');
    }
}

// Event Handler
export class UserEventHandler {
    constructor(
        private notificationService: INotificationService,
        private auditService: IAuditService
    ) {}
    
    async handle(event: UserCreatedEvent): Promise<void> {
        // Send welcome notification
        await this.notificationService.sendWelcomeNotification(event.user);
        
        // Log audit event
        await this.auditService.log({
            action: 'USER_CREATED',
            userId: event.user.id.value,
            details: {
                email: event.user.email.value,
                role: event.user.role.value,
                createdBy: event.createdBy
            }
        });
    }
    
    async handle(event: UserPromotedEvent): Promise<void> {
        // Send promotion notification
        await this.notificationService.sendPromotionNotification(
            event.userId, 
            event.newRole
        );
        
        // Log audit event
        await this.auditService.log({
            action: 'USER_PROMOTED',
            userId: event.userId,
            details: {
                newRole: event.newRole,
                promotedBy: event.promotedBy
            }
        });
    }
}
```

### 6. Data Access Layer - Repository Pattern

#### 6.1 Repository Interface Definition
```typescript
// backend/src/repositories/interfaces/
export interface IUserRepository {
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findByVillage(villageKey: VillageKey): Promise<User[]>;
    findByRole(role: UserRole): Promise<User[]>;
    create(user: User): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: UserId): Promise<void>;
    exists(email: Email): Promise<boolean>;
    countByVillage(villageKey: VillageKey): Promise<number>;
}

export interface IVisitorRepository {
    findById(id: VisitorId): Promise<VisitorRecord | null>;
    findByVillage(villageKey: VillageKey): Promise<VisitorRecord[]>;
    findByStatus(status: VisitorStatus): Promise<VisitorRecord[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<VisitorRecord[]>;
    create(record: VisitorRecord): Promise<VisitorRecord>;
    update(record: VisitorRecord): Promise<VisitorRecord>;
    delete(id: VisitorId): Promise<void>;
    getStatistics(villageKey: VillageKey, period: string): Promise<VisitorStatistics>;
}
```

#### 6.2 Repository Implementation
```typescript
// backend/src/repositories/implementations/
export class PostgresUserRepository implements IUserRepository {
    constructor(
        private db: Database,
        private logger: ILogger
    ) {}
    
    async findById(id: UserId): Promise<User | null> {
        try {
            const result = await this.db.query(
                'SELECT * FROM users WHERE user_id = $1',
                [id.value]
            );
            
            if (result.rows.length === 0) return null;
            
            return this.mapToDomain(result.rows[0]);
        } catch (error) {
            this.logger.error('Error finding user by ID', { userId: id.value, error });
            throw new RepositoryError('Failed to find user by ID', error);
        }
    }
    
    async findByEmail(email: Email): Promise<User | null> {
        try {
            const result = await this.db.query(
                'SELECT * FROM users WHERE email = $1',
                [email.value]
            );
            
            if (result.rows.length === 0) return null;
            
            return this.mapToDomain(result.rows[0]);
        } catch (error) {
            this.logger.error('Error finding user by email', { email: email.value, error });
            throw new RepositoryError('Failed to find user by email', error);
        }
    }
    
    async create(user: User): Promise<User> {
        try {
            const result = await this.db.query(
                `INSERT INTO users (user_id, email, role, status, village_key, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    user.id.value,
                    user.email.value,
                    user.role.value,
                    user.status.value,
                    user.villageKey?.value || null,
                    user.createdAt,
                    user.updatedAt
                ]
            );
            
            return this.mapToDomain(result.rows[0]);
        } catch (error) {
            this.logger.error('Error creating user', { userId: user.id.value, error });
            throw new RepositoryError('Failed to create user', error);
        }
    }
    
    private mapToDomain(row: any): User {
        return User.reconstitute({
            id: row.user_id,
            email: row.email,
            role: row.role,
            status: row.status,
            villageKey: row.village_key,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }
}
```

### 7. Infrastructure Layer - Enterprise Implementation

#### 7.1 Database Configuration
```typescript
// backend/src/infrastructure/database/
export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private pool: Pool;
    
    private constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'village_security',
            user: process.env.DB_USER || 'admin',
            password: process.env.DB_PASSWORD || 'password',
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.setupEventHandlers();
    }
    
    static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    
    private setupEventHandlers(): void {
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
        
        this.pool.on('connect', (client) => {
            console.log('New client connected to database');
        });
        
        this.pool.on('remove', (client) => {
            console.log('Client removed from pool');
        });
    }
    
    async query(text: string, params?: any[]): Promise<QueryResult> {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: result.rowCount });
            return result;
        } catch (error) {
            console.error('Database query error', { text, error });
            throw error;
        }
    }
    
    async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }
    
    async close(): Promise<void> {
        await this.pool.end();
    }
}
```

#### 7.2 Cache Implementation
```typescript
// backend/src/infrastructure/cache/
export class RedisCacheService implements ICacheService {
    private client: Redis;
    private isConnected = false;
    
    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });
        
        this.setupEventHandlers();
    }
    
    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            console.log('Connected to Redis');
            this.isConnected = true;
        });
        
        this.client.on('error', (error) => {
            console.error('Redis connection error', error);
            this.isConnected = false;
        });
        
        this.client.on('reconnecting', () => {
            console.log('Reconnecting to Redis...');
        });
    }
    
    async set(key: string, value: any, ttl: number = 3600): Promise<void> {
        if (!this.isConnected) {
            console.warn('Redis not connected, skipping cache set');
            return;
        }
        
        try {
            const serializedValue = JSON.stringify(value);
            await this.client.setex(key, ttl, serializedValue);
        } catch (error) {
            console.error('Redis set error', { key, error });
        }
    }
    
    async get(key: string): Promise<any> {
        if (!this.isConnected) {
            console.warn('Redis not connected, skipping cache get');
            return null;
        }
        
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis get error', { key, error });
            return null;
        }
    }
    
    async delete(key: string): Promise<void> {
        if (!this.isConnected) {
            console.warn('Redis not connected, skipping cache delete');
            return;
        }
        
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Redis delete error', { key, error });
        }
    }
    
    async invalidatePattern(pattern: string): Promise<void> {
        if (!this.isConnected) {
            console.warn('Redis not connected, skipping cache invalidation');
            return;
        }
        
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            console.error('Redis pattern invalidation error', { pattern, error });
        }
    }
}
```

## 🎯 Key Architectural Principles

### 1. Separation of Concerns
- **Presentation Layer**: Handles user interface and user interactions
- **Application Layer**: Orchestrates business operations and coordinates between layers
- **Business Logic Layer**: Contains core business rules and domain logic
- **Data Access Layer**: Manages data persistence and retrieval
- **Infrastructure Layer**: Provides technical services and external integrations

### 2. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Abstractions don't depend on details
- Details depend on abstractions

### 3. Single Responsibility Principle
- Each layer has a single, well-defined responsibility
- Classes and modules have one reason to change
- Clear boundaries between different concerns

### 4. Open/Closed Principle
- Open for extension, closed for modification
- New features can be added without changing existing code
- Achieved through interfaces and dependency injection

## 🚀 Benefits of This Architecture

### 1. Maintainability
- Clear separation makes code easier to understand and modify
- Changes in one layer don't affect others
- Easier to debug and test individual components

### 2. Scalability
- Each layer can be scaled independently
- Load balancing can be applied at different levels
- Microservices can be extracted from layers

### 3. Testability
- Each layer can be tested in isolation
- Mock dependencies easily
- Unit tests, integration tests, and end-to-end tests

### 4. Flexibility
- Easy to swap implementations
- Technology choices can be made per layer
- Gradual migration and modernization

### 5. Security
- Security concerns are addressed at appropriate layers
- Input validation, authentication, authorization
- Audit logging and monitoring

## 📈 Performance Considerations

### 1. Caching Strategy
- **L1 Cache**: In-memory application cache
- **L2 Cache**: Redis distributed cache
- **CDN**: Static asset caching
- **Database**: Query result caching

### 2. Database Optimization
- Connection pooling
- Read replicas for read-heavy operations
- Proper indexing strategy
- Query optimization

### 3. Load Balancing
- Multiple application instances
- Health checks and failover
- Session affinity for WebSocket connections
- Geographic distribution

## 🔒 Security Architecture

### 1. Defense in Depth
- Multiple security layers
- Input validation at every entry point
- Authentication and authorization
- Audit logging and monitoring

### 2. Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### 3. Rate Limiting
- API endpoint rate limiting
- User-based rate limiting
- IP-based rate limiting
- DDoS protection

## 📊 Monitoring & Observability

### 1. Application Metrics
- Request/response times
- Error rates
- Business metrics
- Custom KPIs

### 2. Infrastructure Metrics
- CPU, memory, disk usage
- Network traffic
- Database performance
- Cache hit rates

### 3. Logging Strategy
- Structured logging
- Log aggregation
- Real-time monitoring
- Alerting

---

## 📝 Conclusion

การออกแบบ Layered Architecture นี้จะช่วยให้ Village Security System มี:

1. **Enterprise-Grade Architecture**: โครงสร้างที่แข็งแกร่งและพร้อมสำหรับการใช้งานจริง
2. **Maintainability**: ง่ายต่อการบำรุงรักษาและพัฒนาต่อ
3. **Scalability**: สามารถขยายตัวได้ตามความต้องการ
4. **Security**: มีความปลอดภัยในระดับสูง
5. **Performance**: ประสิทธิภาพที่ดีและเสถียร
6. **Testability**: สามารถทดสอบได้อย่างครอบคลุม

การนำไปใช้ควรทำเป็นขั้นตอนตาม Roadmap ที่กำหนด เพื่อให้มั่นใจว่าระบบจะทำงานได้อย่างมีประสิทธิภาพและปลอดภัยในระดับ Enterprise
