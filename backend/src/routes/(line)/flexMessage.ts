/**
 * @file LINE Flex Message Service - Clean Version
 * Provides only the essential flex message functionality for visitor approvals
 */

import { Elysia } from 'elysia';

// LINE Flex Message Types
interface FlexMessage {
  type: 'flex';
  altText: string;
  contents: FlexContainer;
}

interface FlexContainer {
  type: 'bubble' | 'carousel';
  body?: FlexBox;
  header?: FlexBox;
  footer?: FlexBox;
  hero?: FlexComponent;
  styles?: FlexStyles;
  contents?: FlexContainer[]; // For carousel
}

interface FlexBox {
  type: 'box';
  layout: 'vertical' | 'horizontal' | 'baseline';
  contents: FlexComponent[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  minHeight?: string;
  paddingAll?: string;
  paddingStart?: string;
  paddingEnd?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingVertical?: string;
  paddingHorizontal?: string;
  position?: 'relative' | 'absolute';
  offsetTop?: string;
  offsetBottom?: string;
  offsetStart?: string;
  offsetEnd?: string;
  margin?: string;
  marginTop?: string;
  marginBottom?: string;
  marginStart?: string;
  marginEnd?: string;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  flex?: number;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'baseline' | 'stretch';
  background?: FlexBackground;
  border?: FlexBorder;
  action?: FlexAction;
}

interface FlexComponent {
  type: 'box' | 'button' | 'image' | 'icon' | 'text' | 'separator' | 'filler' | 'spacer';
  [key: string]: any;
}

interface FlexStyles {
  header?: FlexBox;
  hero?: FlexBox;
  body?: FlexBox;
  footer?: FlexBox;
}

interface FlexBackground {
  type: 'linearGradient';
  angle: string;
  startColor: string;
  endColor: string;
  centerColor?: string;
  centerPosition?: string;
}

interface FlexBorder {
  color: string;
  width: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

interface FlexAction {
  type: 'postback' | 'message' | 'uri' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location';
  label?: string;
  data?: string;
  text?: string;
  uri?: string;
  altUri?: {
    desktop: string;
  };
  datetime?: {
    start?: string;
    end?: string;
    startDatetime?: string;
    endDatetime?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  };
  mode?: 'date' | 'time' | 'datetime';
  initial?: string;
  max?: string;
  min?: string;
}

// Visitor notification data interface
export interface VisitorNotificationData {
  visitorName: string;
  visitorPhone?: string;
  houseNumber: string;
  residentName: string;
  purpose: string;
  entryTime: string;
  villageName: string;
  visitorId: string;
  licensePlate?: string;
  imageUrl?: string;
}

// Approval notification data interface
export interface ApprovalNotificationData {
  visitorName: string;
  houseNumber: string;
  residentName: string;
  status: 'approved' | 'rejected';
  reason?: string;
  villageName: string;
}


class FlexMessageService {
  private channelAccessToken: string;

  constructor() {
    this.channelAccessToken = process.env.LINE_MESSAGE_SECRET || '';
  }

  /**
   * Create visitor approval request flex message
   */
  createVisitorApprovalMessage(data: VisitorNotificationData): FlexMessage {
    console.log('Creating visitor approval message with data:', data);
    return {
      type: 'flex',
      altText: `แจ้งเตือนการเยี่ยม - ผู้เยี่ยมต้องการเข้าบ้าน (${data.purpose})`,
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🔔 แจ้งเตือนการเยี่ยม',
                  weight: 'bold',
                  size: 'lg',
                  color: '#ffffff',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: `ผู้เยี่ยมต้องการเข้าบ้าน (${data.purpose})`,
                  size: 'sm',
                  color: '#ffffff',
                  align: 'center'
                }
              ],
              backgroundColor: '#2B7BE4',
              paddingAll: 'lg',
              cornerRadius: 'md',
              margin: 'md',
              spacing: 'sm'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'รายละเอียดผู้เยี่ยม',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '🎯 วัตถุประสงค์', flex: 2 },
                        { type: 'text', text: data.purpose, flex: 3, weight: 'bold' }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '👤 ผู้เยี่ยม', flex: 2 },
                        { type: 'text', text: data.visitorName, flex: 3 }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '🏠 บ้านเลขที่', flex: 2 },
                        { type: 'text', text: data.houseNumber, flex: 3 }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '👥 ผู้อาศัย', flex: 2 },
                        { type: 'text', text: data.residentName, flex: 3 }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '🕒 เวลา', flex: 2 },
                        { type: 'text', text: data.entryTime, flex: 3 }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '🏡 หมู่บ้าน', flex: 2 },
                        { type: 'text', text: data.villageName, flex: 3 }
                      ]
                    }
                  ],
                  spacing: 'md',
                  paddingAll: 'lg',
                  backgroundColor: '#F5F7FA',
                  cornerRadius: 'md',
                  margin: 'md'
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'button',
                  style: 'primary',
                  color: '#27AE60',
                  action: {
                    type: 'postback',
                    label: 'อนุมัติ',
                    data: `action=approve&visitorId=${data.visitorId}`,
                    displayText: 'อนุมัติการเยี่ยม'
                  }
                },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#E74C3C',
                  action: {
                    type: 'postback',
                    label: 'ปฏิเสธ',
                    data: `action=deny&visitorId=${data.visitorId}`,
                    displayText: 'ปฏิเสธการเยี่ยม'
                  }
                }
              ],
              spacing: 'lg',
              margin: 'lg'
            },
            {
              type: 'button',
              style: 'link',
              action: {
                type: 'uri',
                label: '📄 ดูรายละเอียดเพิ่มเติม',
                uri: `https://viperous-contemptuously-adaline.ngrok-free.dev/Resident`
              },
              margin: 'md'
            }
          ],
          paddingAll: 'lg',
          backgroundColor: '#FFFFFF',
          cornerRadius: 'md'
        }
      }
    };
  }

  /**
   * Create denial confirmation flex message
   */
  createDenialConfirmationMessage(data: VisitorNotificationData): FlexMessage {
    return {
      type: 'flex',
      altText: 'ยืนยันการปฏิเสธ',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '⚠️ ยืนยันการปฏิเสธ',
                  weight: 'bold',
                  size: 'lg',
                  color: '#5A4E00',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: 'คุณแน่ใจหรือไม่?',
                  size: 'md',
                  color: '#5A4E00',
                  align: 'center'
                }
              ],
              backgroundColor: '#FFF4CC',
              cornerRadius: 'md',
              paddingAll: 'lg',
              margin: 'md',
              spacing: 'sm'
            },
            {
              type: 'separator'
            },
            {
              type: 'text',
              text: '📋 ข้อมูลผู้เยี่ยมที่จะปฏิเสธ',
              weight: 'bold',
              size: 'md',
              color: '#333333',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              paddingAll: 'md',
              backgroundColor: '#F8F9FA',
              cornerRadius: 'md',
              contents: [
                {
                  type: 'text',
                  text: `👤 ผู้เยี่ยม: ${data.visitorName}`,
                  size: 'sm',
                  color: '#444444',
                  margin: 'sm'
                },
                {
                  type: 'text',
                  text: `🏠 บ้านเลขที่: ${data.houseNumber}`,
                  size: 'sm',
                  color: '#444444',
                  margin: 'sm'
                },
                {
                  type: 'text',
                  text: `🎯 วัตถุประสงค์: ${data.purpose}`,
                  size: 'sm',
                  color: '#444444',
                  margin: 'sm'
                }
              ],
              spacing: 'sm'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              backgroundColor: '#FFF0F0',
              cornerRadius: 'md',
              paddingAll: 'md',
              contents: [
                {
                  type: 'text',
                  text: '⚠️ การปฏิเสธจะไม่สามารถยกเลิกได้ กรุณาตรวจสอบข้อมูลให้แน่ใจก่อนยืนยัน',
                  wrap: true,
                  size: 'xs',
                  color: '#C0392B'
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              spacing: 'lg',
              margin: 'lg',
              contents: [
                {
                  type: 'button',
                  style: 'primary',
                  color: '#E74C3C',
                  action: {
                    type: 'postback',
                    label: '❌ ปฏิเสธ',
                    data: `action=reject_confirm&visitorId=${data.visitorId}`,
                    displayText: 'ยืนยันการปฏิเสธ'
                  }
                },
              ]
            },
            {
              type: 'button',
              style: 'link',
              action: {
                type: 'uri',
                label: '📄 ดูรายละเอียดเพิ่มเติม',
                uri: `https://viperous-contemptuously-adaline.ngrok-free.dev/Resident`
              },
              margin: 'md'
            }
          ]
        }
      }
    };
  }

  /**
   * Create approval result flex message
   */
  createApprovalResultMessage(data: ApprovalNotificationData): FlexMessage {
    const isApproved = data.status === 'approved';
    const statusColor = isApproved ? '#1DB446' : '#FF6B6B';
    const statusIcon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
    const headerBgColor = isApproved ? '#1DB446' : '#FF6B6B';
    
    return {
      type: 'flex',
      altText: `ผลการอนุมัติ: ${data.visitorName} ${statusText}`,
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `${statusIcon} ผลการอนุมัติ`,
                  weight: 'bold',
                  size: 'lg',
                  color: '#ffffff',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: `การเยี่ยมได้รับการ${statusText}`,
                  size: 'sm',
                  color: '#ffffff',
                  align: 'center'
                }
              ],
              backgroundColor: headerBgColor,
              paddingAll: 'lg',
              cornerRadius: 'md',
              margin: 'md',
              spacing: 'sm'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'รายละเอียดการอนุมัติ',
                  weight: 'bold',
                  size: 'md',
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '👤 ผู้เยี่ยม', flex: 2 },
                        { type: 'text', text: data.visitorName, flex: 3, weight: 'bold' }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '🏠 บ้านเลขที่', flex: 2 },
                        { type: 'text', text: data.houseNumber, flex: 3 }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '👥 ผู้อาศัย', flex: 2 },
                        { type: 'text', text: data.residentName, flex: 3 }
                      ]
                    },
                    {
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '📊 สถานะ', flex: 2 },
                        { type: 'text', text: statusText, flex: 3, weight: 'bold', color: statusColor }
                      ]
                    },
                    ...(data.reason ? [{
                      type: 'box',
                      layout: 'baseline',
                      contents: [
                        { type: 'text', text: '💬 เหตุผล', flex: 2 },
                        { type: 'text', text: data.reason, flex: 3 }
                      ]
                    }] : [])
                  ],
                  spacing: 'md',
                  paddingAll: 'lg',
                  backgroundColor: '#F5F7FA',
                  cornerRadius: 'md',
                  margin: 'md'
                }
              ]
            },
            {
              type: 'button',
              style: 'link',
              action: {
                type: 'uri',
                label: '📄 ดูรายละเอียดเพิ่มเติม',
                uri: `https://viperous-contemptuously-adaline.ngrok-free.dev/Resident`
              },
              margin: 'md'
            }
          ],
          paddingAll: 'lg',
          backgroundColor: '#FFFFFF',
          cornerRadius: 'md'
        }
      }
    };
  }



  /**
   * Create visitor notification message (alias for createVisitorApprovalMessage)
   */
  createVisitorNotificationMessage(data: VisitorNotificationData): FlexMessage {
    return this.createVisitorApprovalMessage(data);
  }

  /**
   * Create visitor details message (alias for createVisitorApprovalMessage)
   */
  createVisitorDetailsMessage(data: VisitorNotificationData): FlexMessage {
    return this.createVisitorApprovalMessage(data);
  }

  /**
   * Get appropriate flex message based on visitor record status
   */
  async getVisitorFlexMessage(data: VisitorNotificationData): Promise<FlexMessage> {
    console.log('getVisitorFlexMessage called with data:', data);
    try {
      // Import the database utilities
      const { getVisitorRecordByVisitorId } = await import('../../db/visitorRecordUtils');
      
      // Get the current visitor record status
      const visitorRecord = await getVisitorRecordByVisitorId(data.visitorId);
      
      if (!visitorRecord) {
        // If no record found, show the approval message
        return this.createVisitorApprovalMessage(data);
      }
      
      // Check if the record has already been processed
      if (visitorRecord.record_status === 'approved' || visitorRecord.record_status === 'rejected') {
        // For processed records, show the approval message (since this is for new notifications)
        return this.createVisitorApprovalMessage(data);
      }
      
      // If still pending, show the approval message
      return this.createVisitorApprovalMessage(data);
    } catch (error) {
      console.error('Error getting visitor flex message:', error);
      // Fallback to approval message if there's an error
      return this.createVisitorApprovalMessage(data);
    }
  }

  /**
   * Send flex message to LINE user
   */
  async sendFlexMessage(userId: string, flexMessage: FlexMessage): Promise<boolean> {
    if (!this.channelAccessToken) {
      console.error('LINE Channel Access Token not configured');
      return false;
    }

    try {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.channelAccessToken}`
        },
        body: JSON.stringify({
          to: userId,
          messages: [flexMessage]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LINE API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return false;
      }

      console.log('✅ Flex message sent successfully to user:', userId);
      return true;
    } catch (error) {
      console.error('Failed to send flex message:', error);
      return false;
    }
  }
}

// Create service instance
const flexMessageService = new FlexMessageService();

// Export routes - only essential endpoints
export const flexMessageRoutes = new Elysia({ prefix: '/api/line' })
  .get('/health', () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'flex-message-service'
    };
  })
  .get('/webhook', ({ query, set }) => {
    // Handle LINE webhook verification
    const challenge = query.challenge;
    if (challenge) {
      set.headers['content-type'] = 'text/plain';
      return challenge;
    }
    return { status: 'webhook endpoint ready' };
  })
  .post('/webhook', async ({ body, set, request }) => {
    try {
      // Add rate limiting and request validation
      const userAgent = request.headers.get('user-agent') || '';
      const contentType = request.headers.get('content-type') || '';
      
      // Skip non-LINE requests (ngrok health checks, etc.)
      if (!userAgent.includes('LineBotWebhook') && !contentType.includes('application/json')) {
        return { success: true, message: 'Non-LINE request ignored' };
      }
      
      const events = (body as any).events;
      
      // Validate events array
      if (!Array.isArray(events) || events.length === 0) {
        return { success: true, message: 'No events' };
      }
      
      // Process only postback events (ignore other event types)
      const postbackEvents = events.filter(event => event.type === 'postback');
      
      if (postbackEvents.length === 0) {
        return { success: true, message: 'No postback events' };
      }
      
      for (const event of postbackEvents) {
        const data = event.postback.data;
        const userId = event.source.userId;
        
        // Parse the postback data
        const params = new URLSearchParams(data);
        const action = params.get('action');
        const visitorId = params.get('visitorId');
        
        console.log('Postback data:', data);
        console.log('Parsed action:', action);
        console.log('Parsed visitorId:', visitorId);
        console.log('User ID:', userId);
        
          if (action && visitorId) {
            if (action === 'approve') {
              // Check current status before processing
              const { getVisitorRecordByVisitorId, updateVisitorRecordStatus } = await import('../../db/visitorRecordUtils');
              
              try {
                console.log('Approving visitorId:', visitorId);
                const currentRecord = await getVisitorRecordByVisitorId(visitorId);
                console.log('Approval - Current record found:', currentRecord);
                
                if (!currentRecord) {
                  console.log('Approval - No record found for visitorId:', visitorId);
                  const errorMessage = `❌ ไม่พบข้อมูลการเยี่ยม\n`;
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: errorMessage } as any);
                  return;
                }
                
                // Check if already processed
                console.log('Approval - Current record status:', currentRecord.record_status);
                if (currentRecord.record_status !== 'pending') {
                  const statusText = currentRecord.record_status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
                  const statusMessage = `ℹ️ การเยี่ยมนี้ได้รับการ${statusText}\nไม่สามารถเปลี่ยนแปลงสถานะได้อีก`;
                  console.log('Approval - Status already processed, sending message:', statusMessage);
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: statusMessage } as any);
                  return;
                }
                
                // Process approval
                await updateVisitorRecordStatus(visitorId, 'approved');
                
                // Send confirmation message to resident
                const confirmationMessage = `✅ คุณได้อนุมัติการเข้าให้ผู้เยี่ยมแล้ว`;
                
                const textMessage = {
                  type: 'text',
                  text: confirmationMessage
                };
                
                await flexMessageService.sendFlexMessage(userId, textMessage as any);
                
              } catch (dbError) {
                // Send error message to resident
                const errorMessage = `❌ เกิดข้อผิดพลาดในการอัปเดตสถานะการเยี่ยม\n`;
                const textMessage = {
                  type: 'text',
                  text: errorMessage
                };
                
                await flexMessageService.sendFlexMessage(userId, textMessage as any);
              }
            } else if (action === 'deny') {
              // Check current status before showing denial confirmation
              const { getVisitorRecordByVisitorId, getVisitorRecordWithDetails } = await import('../../db/visitorRecordUtils');
              
              try {
                console.log('Denying visitorId:', visitorId);
                
                // First check if record exists with basic query
                const basicRecord = await getVisitorRecordByVisitorId(visitorId);
                console.log('Deny - Basic record found:', basicRecord);
                
                if (!basicRecord) {
                  console.log('Deny - No record found for visitorId:', visitorId);
                  const errorMessage = `❌ ไม่พบข้อมูลการเยี่ยม\n`;
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: errorMessage } as any);
                  return;
                }
                
                // Check if already processed
                if (basicRecord.record_status !== 'pending') {
                  const statusText = basicRecord.record_status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
                  const statusMessage = `ℹ️ การเยี่ยมนี้ได้รับการ${statusText}\nไม่สามารถเปลี่ยนแปลงสถานะได้อีก`;
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: statusMessage } as any);
                  return;
                }
                
                // Get detailed record for the confirmation message
                const detailedRecord = await getVisitorRecordWithDetails(visitorId);
                console.log('Deny - Detailed record found:', detailedRecord);
                
                if (detailedRecord) {
                  // Show denial confirmation message using the detailed record data
                  const confirmationMessage = flexMessageService.createDenialConfirmationMessage({
                    visitorId,
                    visitorName: detailedRecord.visitor_name || 'ผู้เยี่ยม',
                    houseNumber: detailedRecord.house_address || 'บ้านเลขที่',
                    residentName: detailedRecord.resident_name || 'ผู้อยู่อาศัย',
                    purpose: detailedRecord.visit_purpose || 'ไม่ระบุ',
                    entryTime: detailedRecord.entry_time?.toLocaleString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Bangkok'
                    }) || 'ไม่ระบุ',
                    villageName: detailedRecord.village_name || 'หมู่บ้าน'
                  });
                  
                  await flexMessageService.sendFlexMessage(userId, confirmationMessage);
                } else {
                  // Fallback with basic data from basicRecord
                  const confirmationMessage = flexMessageService.createDenialConfirmationMessage({
                    visitorId,
                    visitorName: 'ผู้เยี่ยม',
                    houseNumber: 'บ้านเลขที่',
                    residentName: 'ผู้อยู่อาศัย',
                    purpose: basicRecord.visit_purpose || 'ไม่ระบุ',
                    entryTime: basicRecord.entry_time?.toLocaleString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Bangkok'
                    }) || 'ไม่ระบุ',
                    villageName: 'หมู่บ้าน'
                  });
                  
                  await flexMessageService.sendFlexMessage(userId, confirmationMessage);
                }
              } catch (error) {
                console.error('Error in deny action:', error);
                const errorMessage = `❌ เกิดข้อผิดพลาดในการตรวจสอบสถานะ\n`;
                await flexMessageService.sendFlexMessage(userId, { type: 'text', text: errorMessage } as any);
              }
            } else if (action === 'reject_confirm') {
              // Check current status before processing final denial
              const { getVisitorRecordByVisitorId, updateVisitorRecordStatus } = await import('../../db/visitorRecordUtils');
              
              try {
                const currentRecord = await getVisitorRecordByVisitorId(visitorId);
                
                if (!currentRecord) {
                  const errorMessage = `❌ ไม่พบข้อมูลการเยี่ยม\n`;
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: errorMessage } as any);
                  return;
                }
                
                // Check if already processed
                console.log('Reject confirm - Current record status:', currentRecord.record_status);
                if (currentRecord.record_status !== 'pending') {
                  const statusText = currentRecord.record_status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
                  const statusMessage = `ℹ️ การเยี่ยมนี้ได้รับการ${statusText}\nไม่สามารถเปลี่ยนแปลงสถานะได้อีก`;
                  console.log('Reject confirm - Status already processed, sending message:', statusMessage);
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: statusMessage } as any);
                  return;
                }
                
                // Process final denial
                console.log('Reject confirm - Updating status to rejected for visitorId:', visitorId);
                await updateVisitorRecordStatus(visitorId, 'rejected');
                
                // Send confirmation message to resident
                const confirmationMessage = `❌ คุณได้ปฏิเสธการเข้าให้ผู้เยี่ยมแล้ว`;
                
                const textMessage = {
                  type: 'text',
                  text: confirmationMessage
                };
                
                await flexMessageService.sendFlexMessage(userId, textMessage as any);
                
              } catch (dbError) {
                // Send error message to resident
                const errorMessage = `❌ เกิดข้อผิดพลาดในการอัปเดตสถานะการเยี่ยม`;
                const textMessage = {
                  type: 'text',
                  text: errorMessage
                };
                
                await flexMessageService.sendFlexMessage(userId, textMessage as any);
              }
            } else if (action === 'cancel') {
              // Check current status before showing original approval message
              const { getVisitorRecordByVisitorId, getVisitorRecordWithDetails } = await import('../../db/visitorRecordUtils');
              
              try {
                const currentRecord = await getVisitorRecordByVisitorId(visitorId);
                
                if (!currentRecord) {
                  const errorMessage = `❌ ไม่พบข้อมูลการเยี่ยม\n`;
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: errorMessage } as any);
                  return;
                }
                
                // Check if already processed
                if (currentRecord.record_status !== 'pending') {
                  const statusText = currentRecord.record_status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
                  const statusMessage = `ℹ️ การเยี่ยมนี้ได้รับการ${statusText}\nไม่สามารถเปลี่ยนแปลงสถานะได้อีก`;
                  await flexMessageService.sendFlexMessage(userId, { type: 'text', text: statusMessage } as any);
                  return;
                }
                
                // Show original approval message
                const visitorRecord = await getVisitorRecordWithDetails(visitorId);
                
                if (visitorRecord) {
                  const approvalMessage = flexMessageService.createVisitorApprovalMessage({
                    visitorId,
                    visitorName: visitorRecord.visitor_name || 'ผู้เยี่ยม',
                    houseNumber: visitorRecord.house_address || 'บ้านเลขที่',
                    residentName: visitorRecord.resident_name || 'ผู้อยู่อาศัย',
                    purpose: visitorRecord.visit_purpose || 'ไม่ระบุ',
                    entryTime: visitorRecord.entry_time?.toLocaleString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Bangkok'
                    }) || 'ไม่ระบุ',
                    villageName: visitorRecord.village_name || 'หมู่บ้าน'
                  });
                  
                  await flexMessageService.sendFlexMessage(userId, approvalMessage);
                } else {
                  // Fallback with basic data
                  const approvalMessage = flexMessageService.createVisitorApprovalMessage({
                    visitorId,
                    visitorName: 'ผู้เยี่ยม',
                    houseNumber: 'บ้านเลขที่',
                    residentName: 'ผู้อยู่อาศัย',
                    purpose: 'ไม่ระบุ',
                    entryTime: 'ไม่ระบุ',
                    villageName: 'หมู่บ้าน'
                  });
                  
                  await flexMessageService.sendFlexMessage(userId, approvalMessage);
                }
              } catch (error) {
                const errorMessage = `❌ เกิดข้อผิดพลาดในการตรวจสอบสถานะ\n`;
                await flexMessageService.sendFlexMessage(userId, { type: 'text', text: errorMessage } as any);
              }
            } else if (action === 'detail') {
              // Handle detail request - redirect to resident page
              const detailMessage = `📋 กำลังนำคุณไปยังหน้าผู้อยู่อาศัย\nกรุณาเข้าไปดูรายละเอียดในแอปพลิเคชัน`;
              
              const textMessage = {
                type: 'text',
                text: detailMessage
              };
              
              await flexMessageService.sendFlexMessage(userId, textMessage as any);
            }
        }
      }
      
      return { success: true, processed: postbackEvents.length };
    } catch (error) {
      console.error('Error handling LINE webhook:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })
  .post('/send-visitor-approval', async ({ body, set }) => {
    try {
      const { userId, visitorData } = body as { 
        userId: string; 
        visitorData: VisitorNotificationData 
      };
      
      if (!userId || !visitorData) {
        set.status = 400;
        return { success: false, error: 'userId and visitorData are required' };
      }
      
      const flexMessage = flexMessageService.createVisitorApprovalMessage(visitorData);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);
      
      if (success) {
        console.log(`✅ Visitor approval message sent to ${userId}`);
        return { success: true, message: 'Visitor approval message sent successfully' };
      } else {
        set.status = 500;
        return { success: false, error: 'Failed to send visitor approval message' };
      }
    } catch (error) {
      console.error('Error sending visitor approval message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })
  .post('/send-approval-result', async ({ body, set }) => {
    try {
      const { userId, approvalData } = body as { 
        userId: string; 
        approvalData: ApprovalNotificationData 
      };
      
      if (!userId || !approvalData) {
        set.status = 400;
        return { success: false, error: 'userId and approvalData are required' };
      }
      
      const flexMessage = flexMessageService.createApprovalResultMessage(approvalData);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);
      
      if (success) {
        return { success: true, message: 'Approval result message sent successfully' };
      } else {
        set.status = 500;
        return { success: false, error: 'Failed to send approval result message' };
      }
    } catch (error) {
      console.error('Error sending approval result message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

// Export the service for use in other modules
export { flexMessageService };