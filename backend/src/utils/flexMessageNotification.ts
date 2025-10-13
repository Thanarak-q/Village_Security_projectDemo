/**
 * @file Utility functions for sending flex messages to house residents
 * This file provides functions to send visitor approval notifications to residents
 * via LINE flex messages when visitor records are created
 */

import { flexMessageService, type VisitorNotificationData } from '../routes/(line)/flexMessage.js';
import { getHouseResidentsWithLineId, type ResidentWithLineId } from '../db/houseResidentUtils';
import { houses, villages } from '../db/schema';
import db from '../db/drizzle';
import { eq } from 'drizzle-orm';

/**
 * Interface for visitor data needed for flex message
 */
export interface VisitorFlexMessageData {
  visitorName: string;
  visitorPhone?: string;
  houseNumber: string;
  residentName: string;
  purpose: string;
  entryTime: string;
  villageName: string;
  visitorId: string;
  imageUrl?: string;
}

/**
 * Sends visitor approval flex messages to all residents with LINE IDs in a house
 * @param houseId - The UUID of the house
 * @param visitorData - Visitor information for the flex message
 * @returns Promise<{ success: boolean; sentCount: number; errors: string[] }>
 */
export async function sendVisitorApprovalToHouseResidents(
  houseId: string,
  visitorData: VisitorFlexMessageData
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  console.log(`📤 Sending visitor approval flex messages to house residents: ${houseId}`);
  
  try {
    // Get house and village information
    const houseInfo = await db
      .select({
        house_address: houses.address,
        village_name: villages.village_name,
      })
      .from(houses)
      .innerJoin(villages, eq(houses.village_id, villages.village_id))
      .where(eq(houses.house_id, houseId))
      .limit(1);

    if (houseInfo.length === 0) {
      console.error(`❌ House not found: ${houseId}`);
      return { success: false, sentCount: 0, errors: [`House not found: ${houseId}`] };
    }

    const { house_address, village_name } = houseInfo[0];

    // Get residents with LINE IDs for this house
    const residents = await getHouseResidentsWithLineId(houseId);
    
    if (residents.length === 0) {
      console.log(`ℹ️ No residents with LINE IDs found for house: ${houseId}`);
      return { success: false, sentCount: 0, errors: [`No residents with LINE IDs found for house: ${houseId}`] };
    }

    console.log(`📱 Found ${residents.length} residents with LINE IDs for house: ${houseId}`);
    console.log(`👥 Residents:`, residents.map(r => `${r.fname} ${r.lname} (${r.line_user_id})`));

    const errors: string[] = [];
    let sentCount = 0;

    // Send flex message to each resident
    for (const resident of residents) {
      try {
        const flexMessageData: VisitorNotificationData = {
          visitorName: visitorData.visitorName,
          visitorPhone: visitorData.visitorPhone || 'ไม่ระบุ',
          houseNumber: house_address,
          residentName: `${resident.fname} ${resident.lname}`,
          purpose: visitorData.purpose,
          entryTime: visitorData.entryTime,
          villageName: village_name,
          visitorId: visitorData.visitorId,
          imageUrl: visitorData.imageUrl || 'https://via.placeholder.com/300x200/1DB446/FFFFFF?text=Visitor+Photo'
        };
        
        console.log('Flex message data being sent:', flexMessageData);

        const flexMessage = await flexMessageService.getVisitorFlexMessage(flexMessageData);
        const success = await flexMessageService.sendFlexMessage(resident.line_user_id, flexMessage);

        if (success) {
          console.log(`✅ Flex message sent to resident: ${resident.fname} ${resident.lname} (${resident.line_user_id})`);
          sentCount++;
        } else {
          const error = `Failed to send flex message to resident: ${resident.fname} ${resident.lname}`;
          console.error(`❌ ${error}`);
          errors.push(error);
        }
      } catch (error) {
        const errorMsg = `Error sending flex message to resident ${resident.fname} ${resident.lname}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const overallSuccess = sentCount > 0;
    console.log(`📊 Flex message sending completed: ${sentCount}/${residents.length} sent successfully`);
    
    return {
      success: overallSuccess,
      sentCount,
      errors
    };

  } catch (error) {
    const errorMsg = `Error sending flex messages to house residents: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`❌ ${errorMsg}`);
    return {
      success: false,
      sentCount: 0,
      errors: [errorMsg]
    };
  }
}

/**
 * Sends visitor approval flex message to a specific resident
 * @param residentId - The UUID of the resident
 * @param visitorData - Visitor information for the flex message
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function sendVisitorApprovalToResident(
  residentId: string,
  visitorData: VisitorFlexMessageData
): Promise<{ success: boolean; error?: string }> {
  console.log(`📤 Sending visitor approval flex message to resident: ${residentId}`);
  
  try {
    // Get resident with LINE ID
    const { getResidentWithLineId } = await import('../db/houseResidentUtils');
    const residentData = await getResidentWithLineId(residentId);
    
    if (!residentData) {
      const error = `No resident with LINE ID found: ${residentId}`;
      console.error(`❌ ${error}`);
      return { success: false, error };
    }

    // Get house and village information
    const houseInfo = await db
      .select({
        house_address: houses.address,
        village_name: villages.village_name,
      })
      .from(houses)
      .innerJoin(villages, eq(houses.village_id, villages.village_id))
      .where(eq(houses.house_id, residentData.house_id))
      .limit(1);

    if (houseInfo.length === 0) {
      const error = `House not found for resident: ${residentId}`;
      console.error(`❌ ${error}`);
      return { success: false, error };
    }

    const { house_address, village_name } = houseInfo[0];

    const flexMessageData: VisitorNotificationData = {
      visitorName: visitorData.visitorName,
      visitorPhone: visitorData.visitorPhone || 'ไม่ระบุ',
      houseNumber: house_address,
      residentName: `${residentData.fname} ${residentData.lname}`,
      purpose: visitorData.purpose,
      entryTime: visitorData.entryTime,
      villageName: village_name,
      visitorId: visitorData.visitorId,
      imageUrl: visitorData.imageUrl || 'https://via.placeholder.com/300x200/1DB446/FFFFFF?text=Visitor+Photo'
    };

    const success = await flexMessageService.sendFlexMessage(residentData.line_user_id, 
      flexMessageService.createVisitorApprovalMessage(flexMessageData)
    );

    if (success) {
      console.log(`✅ Flex message sent to resident: ${residentData.fname} ${residentData.lname}`);
      return { success: true };
    } else {
      const error = `Failed to send flex message to resident: ${residentData.fname} ${residentData.lname}`;
      console.error(`❌ ${error}`);
      return { success: false, error };
    }

  } catch (error) {
    const errorMsg = `Error sending flex message to resident: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Formats visitor data for flex message from visitor record
 * @param visitorRecord - Visitor record from database
 * @param houseAddress - House address
 * @param villageName - Village name
 * @returns VisitorFlexMessageData
 */
export function formatVisitorDataForFlexMessage(
  visitorRecord: any,
  houseAddress: string,
  villageName: string
): VisitorFlexMessageData {
  return {
    visitorName: visitorRecord.visitor_name || 'ไม่ระบุชื่อ',
    visitorPhone: visitorRecord.visitor_phone || 'ไม่ระบุ',
    houseNumber: houseAddress,
    residentName: visitorRecord.resident_name || 'ไม่ระบุ',
    purpose: visitorRecord.visit_purpose || 'ไม่ระบุวัตถุประสงค์',
    entryTime: visitorRecord.entry_time ? 
      new Date(visitorRecord.entry_time).toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
      }) + ' น.' : 
      new Date().toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
      }) + ' น.',
    villageName: villageName,
    visitorId: visitorRecord.visitor_id,
    imageUrl: visitorRecord.picture_key ? 
      `/api/images/${visitorRecord.picture_key}` : 
      undefined
  };
}
