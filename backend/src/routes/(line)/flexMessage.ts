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
    return {
      type: 'flex',
      altText: `ผู้เยี่ยมใหม่: ${data.visitorName} ต้องการเข้าบ้านเลขที่ ${data.houseNumber}`,
      contents: {
        type: 'bubble',
        header: {
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
                  color: '#00B900',
                  size: 'lg',
                  weight: 'bold',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: 'ผู้เยี่ยม: ' + data.visitorName,
                  color: '#00B900',
                  size: 'sm',
                  margin: 'xs',
                  align: 'center'
                }
              ],
              backgroundColor: '#90EE90',
              paddingAll: 'md',
              cornerRadius: 'md'
            }
          ],
          backgroundColor: '#90EE90',
          paddingAll: 'none',
          cornerRadius: 'md'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📋 รายละเอียดผู้เยี่ยม',
              weight: 'bold',
              size: 'lg',
              color: '#333333',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: `👤 ผู้เยี่ยม: ${data.visitorName}`,
                  wrap: true,
                  color: '#333333',
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `🏠 บ้านเลขที่: ${data.houseNumber}`,
                  wrap: true,
                  color: '#333333',
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `👥 ผู้อยู่อาศัย: ${data.residentName}`,
                  wrap: true,
                  color: '#333333',
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `🎯 วัตถุประสงค์: ${data.purpose}`,
                  wrap: true,
                  color: '#333333',
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `⏰ เวลา: ${data.entryTime}`,
                  wrap: true,
                  color: '#333333',
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `🏘️ หมู่บ้าน: ${data.villageName}`,
                  wrap: true,
                  color: '#333333',
                  size: 'sm'
                }
              ]
            }
          ],
          paddingAll: 'md'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '✅ อนุมัติ',
                data: `action=approve&visitorId=${data.visitorId}`,
                displayText: 'อนุมัติการเยี่ยม'
              },
              color: '#00B900',
              margin: 'sm'
            },
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '❌ ปฏิเสธ',
                data: `action=deny&visitorId=${data.visitorId}`,
                displayText: 'ปฏิเสธการเยี่ยม'
              },
              color: '#FF0000',
              margin: 'sm'
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📋 ดูรายละเอียด',
                data: `action=detail&visitorId=${data.visitorId}`,
                displayText: 'ดูรายละเอียดการเยี่ยม'
              },
              color: '#6C757D',
              margin: 'sm'
            }
          ],
          flex: 0
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
              type: 'text',
              text: `${statusIcon} ผลการอนุมัติ`,
              weight: 'bold',
              size: 'xl',
              color: statusColor,
              align: 'center'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'ผู้เยี่ยม',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: data.visitorName,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5
                    }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'บ้านเลขที่',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: data.houseNumber,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5
                    }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'สถานะ',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: statusText,
                      wrap: true,
                      color: statusColor,
                      size: 'sm',
                      weight: 'bold',
                      flex: 5
                    }
                  ]
                },
                ...(data.reason ? [{
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'เหตุผล',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: data.reason,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5
                    }
                  ]
                }] : [])
              ]
            }
          ]
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
        
        if (action && visitorId) {
          if (action === 'approve' || action === 'deny') {
            // Update visitor record status in database
            const { updateVisitorRecordStatus } = await import('../../db/visitorRecordUtils');
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            
            try {
              await updateVisitorRecordStatus(visitorId, newStatus);
              
              // Send confirmation message to resident
              const confirmationMessage = action === 'approve' 
                ? `✅ คุณได้อนุมัติการเข้าให้ผู้เยี่ยมแล้ว\nรหัสการเยี่ยม: ${visitorId}`
                : `❌ คุณได้ปฏิเสธการเข้าให้ผู้เยี่ยมแล้ว\nรหัสการเยี่ยม: ${visitorId}`;
              
              const textMessage = {
                type: 'text',
                text: confirmationMessage
              };
              
              await flexMessageService.sendFlexMessage(userId, textMessage as any);
              
            } catch (dbError) {
              // Send error message to resident
              const errorMessage = `❌ เกิดข้อผิดพลาดในการอัปเดตสถานะการเยี่ยม\nรหัสการเยี่ยม: ${visitorId}`;
              const textMessage = {
                type: 'text',
                text: errorMessage
              };
              
              await flexMessageService.sendFlexMessage(userId, textMessage as any);
            }
          } else if (action === 'detail') {
            // Handle detail request - send more detailed information
            const detailMessage = `📋 รายละเอียดการเยี่ยม\nรหัสการเยี่ยม: ${visitorId}\n\nกรุณาติดต่อยามรักษาความปลอดภัยเพื่อข้อมูลเพิ่มเติม`;
            
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
