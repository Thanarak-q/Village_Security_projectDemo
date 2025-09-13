/**
 * @file Example of how to integrate notifications into existing routes
 * This file shows how to add notification creation to existing API endpoints
 */

import { notifyNewUserPending, notifyStatusChange } from '../utils/notificationUtils';

/**
 * Example: Adding notification to user approval endpoint
 * 
 * In your existing approveUser function, add this after successful approval:
 */
export async function exampleApproveUser(userId: string, userType: 'resident' | 'guard', userName: string, village_key: string, admin_id: string) {
  try {
    // ... your existing approval logic ...
    
    // After successful approval, create notification
    await notifyNewUserPending(
      village_key,
      userType,
      userName,
      admin_id // Exclude the admin who performed the action
    );
    
    console.log('✅ User approved and notification created');
    
  } catch (error) {
    console.error('❌ Error in approval process:', error);
    throw error;
  }
}

/**
 * Example: Adding notification to status change endpoint
 * 
 * In your existing status change function, add this after successful update:
 */
export async function exampleStatusChange(
  userId: string, 
  entityType: 'resident' | 'guard' | 'admin',
  entityName: string,
  oldStatus: string,
  newStatus: string,
  village_key: string,
  admin_id: string
) {
  try {
    // ... your existing status change logic ...
    
    // After successful status change, create notification
    await notifyStatusChange(
      village_key,
      entityType,
      entityName,
      oldStatus,
      newStatus,
      admin_id // Exclude the admin who performed the action
    );
    
    console.log('✅ Status changed and notification created');
    
  } catch (error) {
    console.error('❌ Error in status change process:', error);
    throw error;
  }
}

/**
 * Example: Adding notification to house management endpoints
 */
import { notifyHouseUpdated, notifyMemberChange } from '../utils/notificationUtils';

export async function exampleHouseUpdate(
  houseId: string,
  houseAddress: string,
  action: 'created' | 'updated' | 'deleted',
  village_key: string,
  admin_id: string
) {
  try {
    // ... your existing house update logic ...
    
    // After successful house update, create notification
    await notifyHouseUpdated(
      village_key,
      houseAddress,
      action,
      admin_id
    );
    
    console.log('✅ House updated and notification created');
    
  } catch (error) {
    console.error('❌ Error in house update process:', error);
    throw error;
  }
}

export async function exampleMemberChange(
  memberName: string,
  houseAddress: string,
  action: 'added' | 'removed',
  village_key: string,
  admin_id: string
) {
  try {
    // ... your existing member change logic ...
    
    // After successful member change, create notification
    await notifyMemberChange(
      village_key,
      memberName,
      houseAddress,
      action,
      admin_id
    );
    
    console.log('✅ Member changed and notification created');
    
  } catch (error) {
    console.error('❌ Error in member change process:', error);
    throw error;
  }
}

/**
 * Example: Adding notification to visitor management endpoints
 */
import { notifyVisitorPendingTooLong, notifyVisitorRejectedReview } from '../utils/notificationUtils';

export async function exampleVisitorPendingTooLong(
  visitorName: string,
  houseAddress: string,
  hoursPending: number,
  village_key: string
) {
  try {
    // ... your existing visitor logic ...
    
    // Create notification for visitor pending too long
    await notifyVisitorPendingTooLong(
      village_key,
      visitorName,
      houseAddress,
      hoursPending
    );
    
    console.log('✅ Visitor pending notification created');
    
  } catch (error) {
    console.error('❌ Error in visitor notification process:', error);
    throw error;
  }
}

export async function exampleVisitorRejected(
  visitorName: string,
  houseAddress: string,
  reason: string,
  village_key: string,
  admin_id: string
) {
  try {
    // ... your existing visitor rejection logic ...
    
    // Create notification for visitor rejection
    await notifyVisitorRejectedReview(
      village_key,
      visitorName,
      houseAddress,
      reason
    );
    
    console.log('✅ Visitor rejection notification created');
    
  } catch (error) {
    console.error('❌ Error in visitor rejection process:', error);
    throw error;
  }
}

/**
 * Example: Manual notification creation for custom events
 */
import { createNotificationForVillageAdmins } from '../utils/notificationUtils';

export async function exampleCustomNotification(
  village_key: string,
  title: string,
  message: string,
  admin_id?: string
) {
  try {
    // Create custom notification for all village admins
    await createNotificationForVillageAdmins({
      village_key,
      type: 'status_changed', // or any appropriate type
      category: 'user_approval', // or any appropriate category
      title,
      message,
      data: { custom_field: 'custom_value' },
      priority: 'medium',
      exclude_admin_id: admin_id
    });
    
    console.log('✅ Custom notification created');
    
  } catch (error) {
    console.error('❌ Error creating custom notification:', error);
    throw error;
  }
}
