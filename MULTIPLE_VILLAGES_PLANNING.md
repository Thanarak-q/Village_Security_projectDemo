# Multiple Villages Support - Planning Document

## 📋 Overview

This document outlines the current limitation and proposed solution for supporting users who live in or work for multiple villages in the Village Security system.

## 🚨 Current Problem

### Current Architecture Limitation
- **Residents** can only be associated with **ONE village** (`village_id` field)
- **Guards** can only be associated with **ONE village** (`village_id` field)
- **Admins** already support multiple villages (via `admin_villages` table) ✅

### Real-World Scenarios This Breaks
1. **Residents who own multiple properties** in different villages
2. **Guards working for security companies** that serve multiple villages
3. **Users who move between villages** but want to maintain access to both
4. **Cross-village family members** who need access to different communities

## 🎯 Proposed Solution

### Database Schema Changes

#### 1. Create New Relationship Tables
```sql
-- New table: resident_villages
CREATE TABLE resident_villages (
  resident_village_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(resident_id),
  village_id UUID NOT NULL REFERENCES villages(village_id),
  status TEXT CHECK (status IN ('verified', 'pending', 'disable')) DEFAULT 'pending',
  move_in_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  disable_at TIMESTAMP
);

-- New table: guard_villages  
CREATE TABLE guard_villages (
  guard_village_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES guards(guard_id),
  village_id UUID NOT NULL REFERENCES villages(village_id),
  status TEXT CHECK (status IN ('verified', 'pending', 'disable')) DEFAULT 'pending',
  hired_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  disable_at TIMESTAMP
);
```

#### 2. Migration Strategy
```sql
-- Step 1: Create new tables
-- Step 2: Migrate existing data from single village_id to relationship tables
-- Step 3: Add indexes and constraints
-- Step 4: Remove old village_id columns (optional - keep for backward compatibility initially)
```

## 🔄 Impact Analysis

### High Impact Areas

#### 1. Authentication & Authorization
- **LIFF Authentication**: Need to handle multiple village contexts
- **Role Checking**: Users may have different statuses in different villages
- **Session Management**: Need to track current village context

#### 2. User Interface Changes
- **Village Selection**: Add village picker for users with multiple villages
- **Role Switching**: Enhanced to include village context
- **Profile Pages**: Show village-specific information
- **Navigation**: Context-aware navigation based on selected village

#### 3. API Changes
- **User Roles API**: Return village-specific role information
- **Profile APIs**: Handle village-specific data
- **Authentication APIs**: Support village context switching

#### 4. Business Logic
- **Visitor Management**: Village-specific visitor records
- **Notification System**: Village-aware notifications
- **House Management**: Village-specific house assignments

### Medium Impact Areas

#### 1. Database Queries
- All queries involving residents/guards need to consider village context
- Performance optimization for multi-village queries
- Data consistency across villages

#### 2. Frontend State Management
- Village context in React state
- Role switching with village selection
- Caching strategies for multi-village data

### Low Impact Areas

#### 1. Admin Functions
- Already support multiple villages ✅
- May need minor updates for new relationship tables

## 📊 Implementation Phases

### Phase 1: Database Foundation (Week 1-2)
- [ ] Create migration scripts for new tables
- [ ] Migrate existing data
- [ ] Update database schema
- [ ] Add indexes and constraints
- [ ] Test data integrity

### Phase 2: Backend API Updates (Week 3-4)
- [ ] Update authentication middleware
- [ ] Modify user role APIs
- [ ] Update profile management APIs
- [ ] Add village selection APIs
- [ ] Update business logic for multi-village support

### Phase 3: Frontend Updates (Week 5-6)
- [ ] Add village selection UI components
- [ ] Update role switching logic
- [ ] Modify profile pages
- [ ] Update navigation and routing
- [ ] Implement village context management

### Phase 4: Testing & Optimization (Week 7-8)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Documentation updates
- [ ] Deployment planning

## 🎨 UI/UX Considerations

### Village Selection Interface
```
┌─────────────────────────────────────┐
│ 🏠 Village Selection                │
├─────────────────────────────────────┤
│ Currently viewing: Village A        │
│                                     │
│ Available Villages:                 │
│ ○ Village A (Verified)              │
│ ○ Village B (Pending)               │
│ ○ Village C (Verified)              │
│                                     │
│ [Switch Village]                    │
└─────────────────────────────────────┘
```

### Role + Village Context
```
┌─────────────────────────────────────┐
│ 👤 John Doe                         │
│ 🏠 Village A | 🛡️ Guard (Verified)  │
│ 🏠 Village B | 🏠 Resident (Pending)│
│                                     │
│ [Switch Role] [Switch Village]      │
└─────────────────────────────────────┘
```

## 🔧 Technical Considerations

### Database Performance
- **Indexes**: Composite indexes on (user_id, village_id, status)
- **Query Optimization**: Efficient joins for multi-village queries
- **Caching**: Village-specific data caching strategies

### Security Implications
- **Data Isolation**: Ensure users can only access their assigned villages
- **Permission Validation**: Village-specific permission checks
- **Audit Logging**: Track village context changes

### Backward Compatibility
- **Gradual Migration**: Keep old fields during transition
- **API Versioning**: Support both old and new API patterns
- **Data Validation**: Ensure data consistency during migration

## 📈 Benefits

### For Users
- ✅ **Flexibility**: Live/work in multiple villages
- ✅ **Convenience**: Single account for multiple communities
- ✅ **Better UX**: Seamless switching between village contexts

### For Business
- ✅ **Scalability**: Support complex real-world scenarios
- ✅ **Competitive Advantage**: More flexible than single-village systems
- ✅ **User Retention**: Users less likely to create multiple accounts

### For Development
- ✅ **Consistency**: Aligns with admin multi-village architecture
- ✅ **Maintainability**: Cleaner separation of concerns
- ✅ **Extensibility**: Easier to add new features

## ⚠️ Risks & Mitigation

### Data Migration Risks
- **Risk**: Data loss during migration
- **Mitigation**: Comprehensive backup and rollback procedures

### Performance Risks
- **Risk**: Slower queries with additional joins
- **Mitigation**: Proper indexing and query optimization

### User Experience Risks
- **Risk**: Confusion with village selection
- **Mitigation**: Clear UI design and user education

## 💰 Resource Requirements

### Development Time
- **Backend**: 3-4 weeks
- **Frontend**: 2-3 weeks
- **Testing**: 1-2 weeks
- **Total**: 6-9 weeks

### Team Members Needed
- **Backend Developer**: Database and API changes
- **Frontend Developer**: UI/UX updates
- **QA Tester**: Comprehensive testing
- **DevOps**: Deployment and monitoring

## 🚀 Next Steps

1. **Team Discussion**: Review this document with the team
2. **Stakeholder Approval**: Get business approval for the changes
3. **Technical Review**: Deep dive into implementation details
4. **Timeline Planning**: Create detailed project timeline
5. **Resource Allocation**: Assign team members to tasks
6. **Risk Assessment**: Identify and plan for potential issues

## 📞 Questions for Team Discussion

1. **Priority**: How urgent is this feature for current users?
2. **Scope**: Should we implement this for both residents and guards simultaneously?
3. **Timeline**: Can we afford the 6-9 week development time?
4. **Resources**: Do we have the necessary team members available?
5. **Rollback Plan**: What's our strategy if issues arise during implementation?
6. **User Communication**: How will we inform users about the changes?

---

**Document Version**: 1.0  
**Created**: 2024-12-19  
**Last Updated**: 2024-12-19  
**Status**: Planning Phase
