# Multiple Villages Support - Migration Strategy

## 🎯 Migration Overview

This document outlines the step-by-step migration strategy to transform the current single-village system to support multiple villages for residents and guards.

## 📋 Pre-Migration Checklist

### Database Backup
- [ ] **Full database backup** before starting migration
- [ ] **Test backup restoration** on staging environment
- [ ] **Document current data state** (record counts, sample data)
- [ ] **Create rollback plan** with specific steps

### Environment Preparation
- [ ] **Staging environment** ready for testing
- [ ] **Database migration tools** configured
- [ ] **Monitoring systems** in place
- [ ] **Team availability** confirmed for migration window

### Code Preparation
- [ ] **Feature flags** implemented for gradual rollout
- [ ] **Backward compatibility** maintained during transition
- [ ] **API versioning** strategy defined
- [ ] **Error handling** enhanced for migration scenarios

## 🗄️ Database Migration Steps

### Phase 1: Schema Creation (Low Risk)
```sql
-- Step 1.1: Create new relationship tables
-- File: 0013_create_resident_guard_villages_tables.sql

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

-- Add constraints and indexes
ALTER TABLE resident_villages ADD CONSTRAINT unique_resident_village UNIQUE(resident_id, village_id);
ALTER TABLE guard_villages ADD CONSTRAINT unique_guard_village UNIQUE(guard_id, village_id);

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

-- Create indexes for performance
CREATE INDEX idx_resident_villages_resident_id ON resident_villages(resident_id);
CREATE INDEX idx_resident_villages_village_id ON resident_villages(village_id);
CREATE INDEX idx_resident_villages_status ON resident_villages(status);
CREATE INDEX idx_resident_villages_resident_status ON resident_villages(resident_id, status);

CREATE INDEX idx_guard_villages_guard_id ON guard_villages(guard_id);
CREATE INDEX idx_guard_villages_village_id ON guard_villages(village_id);
CREATE INDEX idx_guard_villages_status ON guard_villages(status);
CREATE INDEX idx_guard_villages_guard_status ON guard_villages(guard_id, status);
```

### Phase 2: Data Migration (Medium Risk)
```sql
-- Step 2.1: Migrate existing resident data
-- File: 0014_migrate_resident_data.sql

-- Validate data before migration
SELECT 
  COUNT(*) as total_residents,
  COUNT(village_id) as residents_with_village,
  COUNT(*) - COUNT(village_id) as residents_without_village
FROM residents 
WHERE disable_at IS NULL;

-- Migrate residents with village_id
INSERT INTO resident_villages (resident_id, village_id, status, move_in_date, created_at, updated_at)
SELECT 
  resident_id,
  village_id,
  status,
  move_in_date,
  created_at,
  updated_at
FROM residents 
WHERE village_id IS NOT NULL 
  AND disable_at IS NULL;

-- Verify migration
SELECT 
  COUNT(*) as migrated_residents
FROM resident_villages;

-- Check for any data inconsistencies
SELECT 
  r.resident_id,
  r.village_id as old_village_id,
  rv.village_id as new_village_id,
  r.status as old_status,
  rv.status as new_status
FROM residents r
LEFT JOIN resident_villages rv ON r.resident_id = rv.resident_id
WHERE r.village_id IS NOT NULL 
  AND r.disable_at IS NULL
  AND (r.village_id != rv.village_id OR r.status != rv.status);
```

```sql
-- Step 2.2: Migrate existing guard data
-- File: 0015_migrate_guard_data.sql

-- Validate data before migration
SELECT 
  COUNT(*) as total_guards,
  COUNT(village_id) as guards_with_village,
  COUNT(*) - COUNT(village_id) as guards_without_village
FROM guards 
WHERE disable_at IS NULL;

-- Migrate guards with village_id
INSERT INTO guard_villages (guard_id, village_id, status, hired_date, created_at, updated_at)
SELECT 
  guard_id,
  village_id,
  status,
  hired_date,
  created_at,
  updated_at
FROM guards 
WHERE village_id IS NOT NULL 
  AND disable_at IS NULL;

-- Verify migration
SELECT 
  COUNT(*) as migrated_guards
FROM guard_villages;

-- Check for any data inconsistencies
SELECT 
  g.guard_id,
  g.village_id as old_village_id,
  gv.village_id as new_village_id,
  g.status as old_status,
  gv.status as new_status
FROM guards g
LEFT JOIN guard_villages gv ON g.guard_id = gv.guard_id
WHERE g.village_id IS NOT NULL 
  AND g.disable_at IS NULL
  AND (g.village_id != gv.village_id OR g.status != gv.status);
```

### Phase 3: Data Validation (Critical)
```sql
-- Step 3.1: Comprehensive data validation
-- File: 0016_validate_migration.sql

-- Check data integrity
WITH validation_checks AS (
  SELECT 
    'residents' as table_name,
    COUNT(*) as total_records,
    COUNT(village_id) as records_with_village
  FROM residents WHERE disable_at IS NULL
  
  UNION ALL
  
  SELECT 
    'resident_villages' as table_name,
    COUNT(*) as total_records,
    COUNT(village_id) as records_with_village
  FROM resident_villages WHERE disable_at IS NULL
  
  UNION ALL
  
  SELECT 
    'guards' as table_name,
    COUNT(*) as total_records,
    COUNT(village_id) as records_with_village
  FROM guards WHERE disable_at IS NULL
  
  UNION ALL
  
  SELECT 
    'guard_villages' as table_name,
    COUNT(*) as total_records,
    COUNT(village_id) as records_with_village
  FROM guard_villages WHERE disable_at IS NULL
)
SELECT * FROM validation_checks;

-- Check for orphaned records
SELECT 'Orphaned resident_villages' as issue, COUNT(*) as count
FROM resident_villages rv
LEFT JOIN residents r ON rv.resident_id = r.resident_id
WHERE r.resident_id IS NULL

UNION ALL

SELECT 'Orphaned guard_villages' as issue, COUNT(*) as count
FROM guard_villages gv
LEFT JOIN guards g ON gv.guard_id = g.guard_id
WHERE g.guard_id IS NULL

UNION ALL

SELECT 'Invalid village references in resident_villages' as issue, COUNT(*) as count
FROM resident_villages rv
LEFT JOIN villages v ON rv.village_id = v.village_id
WHERE v.village_id IS NULL

UNION ALL

SELECT 'Invalid village references in guard_villages' as issue, COUNT(*) as count
FROM guard_villages gv
LEFT JOIN villages v ON gv.village_id = v.village_id
WHERE v.village_id IS NULL;
```

## 🔄 Application Migration Strategy

### Phase 1: Backward Compatible Updates
```typescript
// Step 1: Update schema types while maintaining backward compatibility
// File: src/db/schema.ts

// Add new relationship tables to schema
export const resident_villages = pgTable("resident_villages", {
  // ... table definition
});

export const guard_villages = pgTable("guard_villages", {
  // ... table definition
});

// Keep existing tables unchanged for now
export const residents = pgTable("residents", {
  // ... existing definition with village_id still present
});

export const guards = pgTable("guards", {
  // ... existing definition with village_id still present
});
```

### Phase 2: Dual-Mode API Support
```typescript
// Step 2: Update APIs to support both old and new data structures
// File: src/routes/userRoles.ts

export const userRolesRoutes = new Elysia({ prefix: "/api" })
  .get("/user/roles", async ({ currentUser, set }: any) => {
    try {
      const { line_user_id } = currentUser;
      
      // Try new multi-village approach first
      const newRoles = await getMultiVillageRoles(line_user_id);
      
      if (newRoles.length > 0) {
        return {
          success: true,
          roles: newRoles,
          mode: 'multi_village'
        };
      }
      
      // Fallback to old single-village approach
      const oldRoles = await getSingleVillageRoles(line_user_id);
      
      return {
        success: true,
        roles: oldRoles,
        mode: 'single_village'
      };
    } catch (error) {
      console.error('Error fetching user roles:', error);
      set.status = 500;
      return { success: false, error: 'Failed to fetch user roles' };
    }
  });

async function getMultiVillageRoles(lineUserId: string) {
  // New multi-village logic
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
        eq(residents.line_user_id, lineUserId),
        isNull(residents.disable_at),
        isNull(resident_villages.disable_at)
      )
    );

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
        eq(guards.line_user_id, lineUserId),
        isNull(guards.disable_at),
        isNull(guard_villages.disable_at)
      )
    );

  return [...residentRoles, ...guardRoles];
}

async function getSingleVillageRoles(lineUserId: string) {
  // Old single-village logic (fallback)
  const residentRoles = await db
    .select({
      role: sql<string>`'resident'`,
      village_id: residents.village_id,
      village_name: villages.village_name,
      status: residents.status,
    })
    .from(residents)
    .leftJoin(villages, eq(residents.village_id, villages.village_id))
    .where(
      and(
        eq(residents.line_user_id, lineUserId),
        isNull(residents.disable_at)
      )
    );

  const guardRoles = await db
    .select({
      role: sql<string>`'guard'`,
      village_id: guards.village_id,
      village_name: villages.village_name,
      status: guards.status,
    })
    .from(guards)
    .leftJoin(villages, eq(guards.village_id, villages.village_id))
    .where(
      and(
        eq(guards.line_user_id, lineUserId),
        isNull(guards.disable_at)
      )
    );

  return [...residentRoles, ...guardRoles];
}
```

### Phase 3: Frontend Gradual Rollout
```typescript
// Step 3: Feature flag implementation
// File: src/hooks/useFeatureFlags.ts

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState({
    multiVillageSupport: false,
    villageSelection: false,
    // ... other flags
  });

  useEffect(() => {
    // Check feature flags from API or environment
    const checkFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags');
        if (response.ok) {
          const data = await response.json();
          setFlags(data.flags);
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
      }
    };

    checkFlags();
  }, []);

  return flags;
};
```

```typescript
// Step 4: Conditional UI rendering
// File: src/components/UserRoleSelector.tsx

export const UserRoleSelector = () => {
  const { multiVillageSupport } = useFeatureFlags();
  const userRoles = useUserRoles();

  if (multiVillageSupport && userRoles.mode === 'multi_village') {
    return <MultiVillageRoleSelector roles={userRoles.roles} />;
  }

  return <SingleVillageRoleSelector roles={userRoles.roles} />;
};
```

## 🧪 Testing Strategy

### Pre-Migration Testing
```typescript
// tests/migration/preMigration.test.ts
describe('Pre-Migration Validation', () => {
  test('should have consistent data before migration', async () => {
    // Validate current data state
    const residents = await db.select().from(residents);
    const guards = await db.select().from(guards);
    
    expect(residents.length).toBeGreaterThan(0);
    expect(guards.length).toBeGreaterThan(0);
    
    // Check for data integrity issues
    const residentsWithoutVillage = residents.filter(r => !r.village_id);
    const guardsWithoutVillage = guards.filter(g => !g.village_id);
    
    console.log(`Residents without village: ${residentsWithoutVillage.length}`);
    console.log(`Guards without village: ${guardsWithoutVillage.length}`);
  });
});
```

### Migration Testing
```typescript
// tests/migration/migrationProcess.test.ts
describe('Migration Process', () => {
  test('should migrate resident data correctly', async () => {
    // Run migration
    await runMigration('0014_migrate_resident_data.sql');
    
    // Validate migration
    const originalCount = await db.select().from(residents).where(isNotNull(residents.village_id));
    const migratedCount = await db.select().from(resident_villages);
    
    expect(migratedCount.length).toBe(originalCount.length);
    
    // Check data consistency
    for (const resident of originalCount) {
      const migrated = await db
        .select()
        .from(resident_villages)
        .where(eq(resident_villages.resident_id, resident.resident_id))
        .limit(1);
      
      expect(migrated.length).toBe(1);
      expect(migrated[0].village_id).toBe(resident.village_id);
      expect(migrated[0].status).toBe(resident.status);
    }
  });
});
```

### Post-Migration Testing
```typescript
// tests/migration/postMigration.test.ts
describe('Post-Migration Validation', () => {
  test('should maintain data integrity after migration', async () => {
    // Test API responses
    const response = await fetch('/api/user/roles');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.roles).toBeDefined();
    expect(data.mode).toBe('multi_village');
  });

  test('should handle both old and new data structures', async () => {
    // Test backward compatibility
    const response = await fetch('/api/user/roles');
    const data = await response.json();
    
    if (data.mode === 'single_village') {
      // Should work with old structure
      expect(data.roles.length).toBeGreaterThan(0);
    } else {
      // Should work with new structure
      expect(data.roles.length).toBeGreaterThan(0);
      expect(data.roles[0]).toHaveProperty('village_id');
      expect(data.roles[0]).toHaveProperty('village_name');
    }
  });
});
```

## 🚨 Rollback Strategy

### Database Rollback
```sql
-- Rollback script: rollback_multi_village_migration.sql

-- Step 1: Restore data to original tables
UPDATE residents 
SET village_id = (
  SELECT rv.village_id 
  FROM resident_villages rv 
  WHERE rv.resident_id = residents.resident_id 
  LIMIT 1
)
WHERE resident_id IN (
  SELECT resident_id FROM resident_villages
);

UPDATE guards 
SET village_id = (
  SELECT gv.village_id 
  FROM guard_villages gv 
  WHERE gv.guard_id = guards.guard_id 
  LIMIT 1
)
WHERE guard_id IN (
  SELECT guard_id FROM guard_villages
);

-- Step 2: Drop new tables
DROP TABLE IF EXISTS resident_villages;
DROP TABLE IF EXISTS guard_villages;

-- Step 3: Verify rollback
SELECT COUNT(*) as residents_with_village FROM residents WHERE village_id IS NOT NULL;
SELECT COUNT(*) as guards_with_village FROM guards WHERE village_id IS NOT NULL;
```

### Application Rollback
```typescript
// Rollback application changes
// File: rollback-application.ts

export const rollbackApplication = () => {
  // 1. Disable feature flags
  process.env.MULTI_VILLAGE_SUPPORT = 'false';
  process.env.VILLAGE_SELECTION = 'false';
  
  // 2. Revert API endpoints to old logic
  // 3. Revert frontend components
  // 4. Clear caches
  // 5. Restart services
};
```

## 📊 Monitoring & Validation

### Migration Metrics
```typescript
// utils/migrationMetrics.ts
export const trackMigrationMetrics = {
  startTime: Date.now(),
  
  recordMigrationStart: () => {
    console.log('Migration started at:', new Date().toISOString());
  },
  
  recordDataMigration: (table: string, count: number) => {
    console.log(`Migrated ${count} records from ${table}`);
  },
  
  recordValidationResults: (results: any) => {
    console.log('Validation results:', results);
  },
  
  recordMigrationComplete: () => {
    const duration = Date.now() - this.startTime;
    console.log(`Migration completed in ${duration}ms`);
  },
  
  recordMigrationError: (error: Error) => {
    console.error('Migration error:', error);
  }
};
```

### Health Checks
```typescript
// utils/healthChecks.ts
export const runHealthChecks = async () => {
  const checks = [
    {
      name: 'Database Connectivity',
      check: async () => {
        await db.select().from(villages).limit(1);
        return { status: 'healthy' };
      }
    },
    {
      name: 'Data Integrity',
      check: async () => {
        const orphanedResidents = await db
          .select()
          .from(resident_villages)
          .leftJoin(residents, eq(resident_villages.resident_id, residents.resident_id))
          .where(isNull(residents.resident_id));
        
        return { 
          status: orphanedResidents.length === 0 ? 'healthy' : 'unhealthy',
          details: `Found ${orphanedResidents.length} orphaned resident villages`
        };
      }
    },
    {
      name: 'API Functionality',
      check: async () => {
        const response = await fetch('/api/user/roles');
        return { 
          status: response.ok ? 'healthy' : 'unhealthy',
          details: `API returned status ${response.status}`
        };
      }
    }
  ];

  const results = await Promise.all(
    checks.map(async (check) => ({
      name: check.name,
      ...await check.check()
    }))
  );

  return results;
};
```

## 📅 Migration Timeline

### Week 1: Preparation
- **Day 1-2**: Database backup and validation
- **Day 3-4**: Staging environment setup
- **Day 5**: Team training and rollback procedures

### Week 2: Schema Migration
- **Day 1**: Create new tables (Phase 1)
- **Day 2**: Migrate resident data (Phase 2.1)
- **Day 3**: Migrate guard data (Phase 2.2)
- **Day 4**: Data validation (Phase 3)
- **Day 5**: Performance testing

### Week 3: Application Updates
- **Day 1-2**: Backend API updates
- **Day 3-4**: Frontend component updates
- **Day 5**: Integration testing

### Week 4: Deployment & Monitoring
- **Day 1**: Production deployment
- **Day 2-3**: Monitoring and bug fixes
- **Day 4-5**: Performance optimization

## 🎯 Success Criteria

### Technical Success
- [ ] All data migrated without loss
- [ ] API response times within acceptable limits
- [ ] No broken functionality
- [ ] All tests passing

### Business Success
- [ ] Users can access multiple villages
- [ ] Village selection works smoothly
- [ ] No user complaints about functionality
- [ ] System performance maintained

### Operational Success
- [ ] Migration completed within timeline
- [ ] No rollback required
- [ ] Team confident in new system
- [ ] Documentation updated

---

**Document Version**: 1.0  
**Created**: 2024-12-19  
**Last Updated**: 2024-12-19  
**Status**: Migration Planning
