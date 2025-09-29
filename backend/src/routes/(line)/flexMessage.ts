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
  imageUrl?: string;
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
              type: 'text',
              text: '🔔 แจ้งเตือนผู้เยี่ยมใหม่',
              weight: 'bold',
              size: 'lg',
              color: '#1DB446',
              align: 'center'
            }
          ],
          backgroundColor: '#F0F8F0',
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: data.villageName,
              size: 'sm',
              color: '#666666',
              align: 'center',
              margin: 'md'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '👤 ข้อมูลผู้เยี่ยม',
                  weight: 'bold',
                  size: 'md',
                  color: '#333333',
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'ชื่อ:',
                      size: 'sm',
                      color: '#666666',
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: data.visitorName,
                      size: 'sm',
                      color: '#333333',
                      flex: 3
                    }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'เบอร์โทร:',
                      size: 'sm',
                      color: '#666666',
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: data.visitorPhone || 'ไม่ระบุ',
                      size: 'sm',
                      color: '#333333',
                      flex: 3
                    }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'บ้าน:',
                      size: 'sm',
                      color: '#666666',
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: data.houseNumber,
                      size: 'sm',
                      color: '#333333',
                      flex: 3
                    }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'เวลา:',
                      size: 'sm',
                      color: '#666666',
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: data.entryTime,
                      size: 'sm',
                      color: '#333333',
                      flex: 3
                    }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'วัตถุประสงค์:',
                      size: 'sm',
                      color: '#666666',
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: data.purpose,
                      size: 'sm',
                      color: '#333333',
                      flex: 3
                    }
                  ],
                  margin: 'sm'
                }
              ],
              margin: 'lg'
            }
          ],
          paddingAll: '20px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    label: '✅ อนุมัติ',
                    data: `action=approve&visitorId=${data.visitorId}`,
                    displayText: 'อนุมัติการเยี่ยม'
                  },
                  style: 'primary',
                  color: '#1DB446',
                  height: 'sm',
                  flex: 1,
                  margin: 'sm'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    label: '❌ ปฏิเสธ',
                    data: `action=deny&visitorId=${data.visitorId}`,
                    displayText: 'ปฏิเสธการเยี่ยม'
                  },
                  style: 'primary',
                  color: '#FF6B6B',
                  height: 'sm',
                  flex: 1,
                  margin: 'sm'
                }
              ],
              spacing: 'sm'
            }
          ],
          paddingAll: '15px'
        }
      }
    };
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
  .post('/webhook', async ({ body, set }) => {
    try {
      const events = (body as any).events;
      
      for (const event of events) {
        if (event.type === 'postback') {
          const data = event.postback.data;
          const userId = event.source.userId;
          
          // Parse the postback data
          const params = new URLSearchParams(data);
          const action = params.get('action');
          const visitorId = params.get('visitorId');
          
          if (action && visitorId) {
            console.log(`📱 Received postback: ${action} for visitor ${visitorId} from user ${userId}`);
            
            // Update visitor record status in database
            const { updateVisitorRecordStatus } = await import('../../db/visitorRecordUtils');
            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            
            try {
              await updateVisitorRecordStatus(visitorId, newStatus);
              console.log(`✅ Updated visitor record ${visitorId} status to ${newStatus}`);
              
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
              console.error(`❌ Error updating visitor record ${visitorId}:`, dbError);
              
              // Send error message to resident
              const errorMessage = `❌ เกิดข้อผิดพลาดในการอัปเดตสถานะการเยี่ยม\nรหัสการเยี่ยม: ${visitorId}`;
              const textMessage = {
                type: 'text',
                text: errorMessage
              };
              
              await flexMessageService.sendFlexMessage(userId, textMessage as any);
            }
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error handling LINE webhook:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  });

// Export the service for use in other modules
export { flexMessageService };
