# Multiple Villages Support - Technical Implementation Details

## 🗄️ Database Schema Changes

### Current Schema (Limited)
```sql
-- Current residents table
CREATE TABLE residents (
  resident_id UUID PRIMARY KEY,
  village_id UUID REFERENCES villages(village_id), -- ❌ Only ONE village
  -- ... other fields
);

-- Current guards table  
CREATE TABLE guards (
  guard_id UUID PRIMARY KEY,
  village_id UUID REFERENCES villages(village_id), -- ❌ Only ONE village
  -- ... other fields
);
```

### Proposed Schema (Flexible)
```sql
-- Updated residents table (remove village_id)
CREATE TABLE residents (
  resident_id UUID PRIMARY KEY,
  -- village_id removed - now handled by relationship table
  -- ... other fields
);

-- Updated guards table (remove village_id)
CREATE TABLE guards (
  guard_id UUID PRIMARY KEY,
  -- village_id removed - now handled by relationship table
  -- ... other fields
);

-- New relationship table for residents
CREATE TABLE resident_villages (
  resident_village_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(resident_id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES villages(village_id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('verified', 'pending', 'disable')) DEFAULT 'pending',
  move_in_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  disable_at TIMESTAMP,
  
  -- Ensure unique resident-village combinations
  UNIQUE(resident_id, village_id)
);

-- New relationship table for guards
CREATE TABLE guard_villages (
  guard_village_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES guards(guard_id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES villages(village_id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('verified', 'pending', 'disable')) DEFAULT 'pending',
  hired_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  disable_at TIMESTAMP,
  
  -- Ensure unique guard-village combinations
  UNIQUE(guard_id, village_id)
);
```

### Indexes for Performance
```sql
-- Resident villages indexes
CREATE INDEX idx_resident_villages_resident_id ON resident_villages(resident_id);
CREATE INDEX idx_resident_villages_village_id ON resident_villages(village_id);
CREATE INDEX idx_resident_villages_status ON resident_villages(status);
CREATE INDEX idx_resident_villages_resident_status ON resident_villages(resident_id, status);
CREATE INDEX idx_resident_villages_village_status ON resident_villages(village_id, status);

-- Guard villages indexes
CREATE INDEX idx_guard_villages_guard_id ON guard_villages(guard_id);
CREATE INDEX idx_guard_villages_village_id ON guard_villages(village_id);
CREATE INDEX idx_guard_villages_status ON guard_villages(status);
CREATE INDEX idx_guard_villages_guard_status ON guard_villages(guard_id, status);
CREATE INDEX idx_guard_villages_village_status ON guard_villages(village_id, status);
```

## 🔄 Migration Script

### Step 1: Create New Tables
```sql
-- Migration: 0013_add_resident_guard_villages_tables.sql

-- Create resident_villages table
CREATE TABLE IF NOT EXISTS resident_villages (
  resident_village_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL,
  village_id UUID NOT NULL,
  status TEXT CHECK (status IN ('verified', 'pending', 'disable')) DEFAULT 'pending',
  move_in_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  disable_at TIMESTAMP
);

-- Create guard_villages table
CREATE TABLE IF NOT EXISTS guard_villages (
  guard_village_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL,
  village_id UUID NOT NULL,
  status TEXT CHECK (status IN ('verified', 'pending', 'disable')) DEFAULT 'pending',
  hired_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  disable_at TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE resident_villages 
ADD CONSTRAINT fk_resident_villages_resident_id 
FOREIGN KEY (resident_id) REFERENCES residents(resident_id) ON DELETE CASCADE;

ALTER TABLE resident_villages 
ADD CONSTRAINT fk_resident_villages_village_id 
FOREIGN KEY (village_id) REFERENCES villages(village_id) ON DELETE CASCADE;

ALTER TABLE guard_villages 
ADD CONSTRAINT fk_guard_villages_guard_id 
FOREIGN KEY (guard_id) REFERENCES guards(guard_id) ON DELETE CASCADE;

ALTER TABLE guard_villages 
ADD CONSTRAINT fk_guard_villages_village_id 
FOREIGN KEY (village_id) REFERENCES villages(village_id) ON DELETE CASCADE;

-- Add unique constraints
ALTER TABLE resident_villages ADD CONSTRAINT unique_resident_village UNIQUE(resident_id, village_id);
ALTER TABLE guard_villages ADD CONSTRAINT unique_guard_village UNIQUE(guard_id, village_id);
```

### Step 2: Migrate Existing Data
```sql
-- Migrate existing resident data
INSERT INTO resident_villages (resident_id, village_id, status, move_in_date, created_at, updated_at)
SELECT 
  resident_id,
  village_id,
  status,
  move_in_date,
  created_at,
  updated_at
FROM residents 
WHERE village_id IS NOT NULL;

-- Migrate existing guard data
INSERT INTO guard_villages (guard_id, village_id, status, hired_date, created_at, updated_at)
SELECT 
  guard_id,
  village_id,
  status,
  hired_date,
  created_at,
  updated_at
FROM guards 
WHERE village_id IS NOT NULL;
```

### Step 3: Create Indexes
```sql
-- Resident villages indexes
CREATE INDEX idx_resident_villages_resident_id ON resident_villages(resident_id);
CREATE INDEX idx_resident_villages_village_id ON resident_villages(village_id);
CREATE INDEX idx_resident_villages_status ON resident_villages(status);
CREATE INDEX idx_resident_villages_resident_status ON resident_villages(resident_id, status);

-- Guard villages indexes
CREATE INDEX idx_guard_villages_guard_id ON guard_villages(guard_id);
CREATE INDEX idx_guard_villages_village_id ON guard_villages(village_id);
CREATE INDEX idx_guard_villages_status ON guard_villages(status);
CREATE INDEX idx_guard_villages_guard_status ON guard_villages(guard_id, status);
```

## 🔧 Backend API Changes

### Updated Schema Types
```typescript
// Updated schema.ts
export const resident_villages = pgTable("resident_villages", {
  resident_village_id: uuid("resident_village_id").primaryKey().defaultRandom(),
  resident_id: uuid("resident_id").references(() => residents.resident_id).notNull(),
  village_id: uuid("village_id").references(() => villages.village_id).notNull(),
  status: text("status").$type<"verified" | "pending" | "disable">().default("pending"),
  move_in_date: date("move_in_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  disable_at: timestamp("disable_at"),
}, (table) => [
  index("idx_resident_villages_resident_id").on(table.resident_id),
  index("idx_resident_villages_village_id").on(table.village_id),
  index("idx_resident_villages_status").on(table.status),
  index("idx_resident_villages_resident_status").on(table.resident_id, table.status),
]);

export const guard_villages = pgTable("guard_villages", {
  guard_village_id: uuid("guard_village_id").primaryKey().defaultRandom(),
  guard_id: uuid("guard_id").references(() => guards.guard_id).notNull(),
  village_id: uuid("village_id").references(() => villages.village_id).notNull(),
  status: text("status").$type<"verified" | "pending" | "disable">().default("pending"),
  hired_date: date("hired_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  disable_at: timestamp("disable_at"),
}, (table) => [
  index("idx_guard_villages_guard_id").on(table.guard_id),
  index("idx_guard_villages_village_id").on(table.village_id),
  index("idx_guard_villages_status").on(table.status),
  index("idx_guard_villages_guard_status").on(table.guard_id, table.status),
]);
```

### Updated User Roles API
```typescript
// routes/userRoles.ts - Updated to handle multiple villages
export const userRolesRoutes = new Elysia({ prefix: "/api" })
  .get("/user/roles", async ({ currentUser, set }: any) => {
    try {
      const { line_user_id } = currentUser;
      
      // Get all resident roles across villages
      const residentRoles = await db
        .select({
          role: sql<string>`'resident'`,
          village_id: villages.village_id,
          village_name: villages.village_name,
          status: resident_villages.status,
        })
        .from(residents)
        .innerJoin(resident_villages, eq(residents.resident_id, resident_villages.resident_id))
        .innerJoin(villages, eq(resident_villages.village_id, villages.village_id))
        .where(
          and(
            eq(residents.line_user_id, line_user_id),
            isNull(residents.disable_at),
            isNull(resident_villages.disable_at)
          )
        );

      // Get all guard roles across villages
      const guardRoles = await db
        .select({
          role: sql<string>`'guard'`,
          village_id: villages.village_id,
          village_name: villages.village_name,
          status: guard_villages.status,
        })
        .from(guards)
        .innerJoin(guard_villages, eq(guards.guard_id, guard_villages.guard_id))
        .innerJoin(villages, eq(guard_villages.village_id, villages.village_id))
        .where(
          and(
            eq(guards.line_user_id, line_user_id),
            isNull(guards.disable_at),
            isNull(guard_villages.disable_at)
          )
        );

      const allRoles = [...residentRoles, ...guardRoles];

      return {
        success: true,
        roles: allRoles,
        total_villages: new Set(allRoles.map(r => r.village_id)).size,
        verified_roles: allRoles.filter(r => r.status === 'verified'),
        pending_roles: allRoles.filter(r => r.status === 'pending'),
      };
    } catch (error) {
      console.error('Error fetching user roles:', error);
      set.status = 500;
      return { success: false, error: 'Failed to fetch user roles' };
    }
  });
```

### Village Selection API
```typescript
// routes/villageSelection.ts - New API for village selection
export const villageSelectionRoutes = new Elysia({ prefix: "/api" })
  .post("/village/select", async ({ body, currentUser, set }: any) => {
    try {
      const { village_id, role } = body as { village_id: string, role: 'resident' | 'guard' };
      const { line_user_id } = currentUser;

      // Verify user has access to this village with the specified role
      let hasAccess = false;
      
      if (role === 'resident') {
        const residentVillage = await db
          .select()
          .from(resident_villages)
          .innerJoin(residents, eq(resident_villages.resident_id, residents.resident_id))
          .where(
            and(
              eq(residents.line_user_id, line_user_id),
              eq(resident_villages.village_id, village_id),
              isNull(residents.disable_at),
              isNull(resident_villages.disable_at)
            )
          )
          .limit(1);
        
        hasAccess = residentVillage.length > 0;
      } else if (role === 'guard') {
        const guardVillage = await db
          .select()
          .from(guard_villages)
          .innerJoin(guards, eq(guard_villages.guard_id, guards.guard_id))
          .where(
            and(
              eq(guards.line_user_id, line_user_id),
              eq(guard_villages.village_id, village_id),
              isNull(guards.disable_at),
              isNull(guard_villages.disable_at)
            )
          )
          .limit(1);
        
        hasAccess = guardVillage.length > 0;
      }

      if (!hasAccess) {
        set.status = 403;
        return { success: false, error: 'Access denied to this village' };
      }

      // Get village details
      const village = await db
        .select()
        .from(villages)
        .where(eq(villages.village_id, village_id))
        .limit(1);

      if (village.length === 0) {
        set.status = 404;
        return { success: false, error: 'Village not found' };
      }

      return {
        success: true,
        data: {
          village_id: village[0].village_id,
          village_name: village[0].village_name,
          village_key: village[0].village_key,
          role: role,
        },
      };
    } catch (error) {
      console.error('Error selecting village:', error);
      set.status = 500;
      return { success: false, error: 'Failed to select village' };
    }
  });
```

## 🎨 Frontend Changes

### Village Context Hook
```typescript
// hooks/useVillageContext.ts
import { createContext, useContext, useState, useEffect } from 'react';

interface VillageContextType {
  selectedVillage: Village | null;
  availableVillages: Village[];
  switchVillage: (villageId: string, role: 'resident' | 'guard') => Promise<void>;
  loading: boolean;
}

interface Village {
  village_id: string;
  village_name: string;
  village_key: string;
  role: 'resident' | 'guard';
  status: 'verified' | 'pending' | 'disable';
}

const VillageContext = createContext<VillageContextType | null>(null);

export const VillageProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [availableVillages, setAvailableVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(false);

  const switchVillage = async (villageId: string, role: 'resident' | 'guard') => {
    setLoading(true);
    try {
      const response = await fetch('/api/village/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ village_id: villageId, role }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedVillage(data.data);
        // Update local storage or session
        localStorage.setItem('selectedVillage', JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Error switching village:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VillageContext.Provider value={{
      selectedVillage,
      availableVillages,
      switchVillage,
      loading,
    }}>
      {children}
    </VillageContext.Provider>
  );
};

export const useVillageContext = () => {
  const context = useContext(VillageContext);
  if (!context) {
    throw new Error('useVillageContext must be used within VillageProvider');
  }
  return context;
};
```

### Village Selection Component
```typescript
// components/VillageSelector.tsx
import { useState } from 'react';
import { useVillageContext } from '@/hooks/useVillageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Shield, CheckCircle, Clock, XCircle } from 'lucide-react';

interface VillageSelectorProps {
  userRoles: Array<{
    role: string;
    village_id: string;
    village_name: string;
    status: string;
  }>;
}

export const VillageSelector = ({ userRoles }: VillageSelectorProps) => {
  const { selectedVillage, switchVillage, loading } = useVillageContext();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disable': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'resident' ? 
      <Home className="w-4 h-4" /> : 
      <Shield className="w-4 h-4" />;
  };

  const handleVillageSwitch = async (villageId: string, role: 'resident' | 'guard') => {
    await switchVillage(villageId, role);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        {selectedVillage ? (
          <>
            {getRoleIcon(selectedVillage.role)}
            {selectedVillage.village_name}
            {getStatusIcon(selectedVillage.status)}
          </>
        ) : (
          'Select Village'
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-80 z-50">
          <CardHeader>
            <CardTitle className="text-sm">Select Village & Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {userRoles.map((role) => (
              <Button
                key={`${role.village_id}-${role.role}`}
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => handleVillageSwitch(role.village_id, role.role as 'resident' | 'guard')}
                disabled={loading}
              >
                {getRoleIcon(role.role)}
                <div className="flex-1 text-left">
                  <div className="font-medium">{role.village_name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {role.role} • {role.status}
                  </div>
                </div>
                {getStatusIcon(role.status)}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### Updated LIFF Authentication
```typescript
// app/liff/page.tsx - Updated logic for multiple villages
useEffect(() => {
  const run = async () => {
    try {
      // ... existing LIFF initialization ...

      // Fetch user roles across all villages
      const rolesResponse = await fetch('/api/user/roles', {
        headers: {
          'Authorization': `Bearer ${authResult.token}`,
        },
      });

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        
        if (rolesData.success && rolesData.roles) {
          const verifiedRoles = rolesData.roles.filter((role: any) => role.status === 'verified');
          const pendingRoles = rolesData.roles.filter((role: any) => role.status === 'pending');
          
          // Group roles by village
          const villageGroups = rolesData.roles.reduce((acc: any, role: any) => {
            if (!acc[role.village_id]) {
              acc[role.village_id] = {
                village_id: role.village_id,
                village_name: role.village_name,
                roles: []
              };
            }
            acc[role.village_id].roles.push(role);
            return acc;
          }, {});

          const villages = Object.values(villageGroups);

          if (verifiedRoles.length > 0) {
            // User has verified roles - redirect to village selection or main page
            if (villages.length > 1) {
              // Multiple villages - redirect to village selection
              router.replace('/liff/select-village');
            } else {
              // Single village - redirect to main page
              const village = villages[0] as any;
              const verifiedRole = village.roles.find((r: any) => r.status === 'verified');
              if (verifiedRole) {
                const redirectPath = verifiedRole.role === 'resident' ? '/Resident' : '/guard';
                router.replace(redirectPath);
              }
            }
          } else if (pendingRoles.length > 0) {
            // User has pending roles - redirect to pending page
            if (villages.length > 1) {
              // Multiple villages - redirect to village selection
              router.replace('/liff/select-village');
            } else {
              // Single village - redirect to pending page
              const village = villages[0] as any;
              const pendingRole = village.roles.find((r: any) => r.status === 'pending');
              if (pendingRole) {
                const redirectPath = pendingRole.role === 'resident' ? '/Resident/pending' : '/guard/pending';
                router.replace(redirectPath);
              }
            }
          } else {
            // No roles - redirect to role selection
            router.replace('/liff/select-role');
          }
        }
      }
    } catch (error) {
      console.error('LIFF authentication error:', error);
    }
  };

  run();
}, []);
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// tests/villageSelection.test.ts
describe('Village Selection', () => {
  test('should allow user to switch between villages', async () => {
    // Test village switching functionality
  });

  test('should validate user access to villages', async () => {
    // Test access control
  });

  test('should handle multiple roles per village', async () => {
    // Test complex role scenarios
  });
});
```

### Integration Tests
```typescript
// tests/multiVillageIntegration.test.ts
describe('Multi-Village Integration', () => {
  test('should maintain village context across page navigation', async () => {
    // Test context persistence
  });

  test('should handle village-specific data correctly', async () => {
    // Test data isolation
  });
});
```

### Performance Tests
```typescript
// tests/performance.test.ts
describe('Multi-Village Performance', () => {
  test('should handle large number of villages efficiently', async () => {
    // Test with 100+ villages
  });

  test('should optimize database queries', async () => {
    // Test query performance
  });
});
```

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Village selection frequency
- Role switching patterns
- Performance impact of multi-village queries
- User engagement across different villages
- Error rates for village-specific operations

### Logging Strategy
```typescript
// utils/analytics.ts
export const logVillageAction = (action: string, villageId: string, userId: string) => {
  console.log({
    timestamp: new Date().toISOString(),
    action,
    village_id: villageId,
    user_id: userId,
    session_id: getSessionId(),
  });
};
```

---

**Document Version**: 1.0  
**Created**: 2024-12-19  
**Last Updated**: 2024-12-19  
**Status**: Technical Specification
