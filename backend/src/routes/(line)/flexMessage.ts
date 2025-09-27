/**
 * @file LINE Flex Message Service
 * Provides rich message templates for village security notifications
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
  cornerRadius?: string;
  width?: string;
  height?: string;
  paddingAll?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingStart?: string;
  paddingEnd?: string;
  spacing?: string;
  margin?: string;
  flex?: number;
}

interface FlexComponent {
  type: 'text' | 'image' | 'button' | 'spacer' | 'separator' | 'filler' | 'box';
  text?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '4xl' | '5xl' | 'xxs' | 'full';
  color?: string;
  weight?: 'regular' | 'bold';
  style?: 'normal' | 'italic' | 'primary';
  align?: 'start' | 'end' | 'center';
  gravity?: 'top' | 'bottom' | 'center';
  wrap?: boolean;
  maxLines?: number;
  action?: FlexAction;
  url?: string;
  aspectRatio?: string;
  aspectMode?: 'fit' | 'cover';
  margin?: string;
  flex?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  cornerRadius?: string;
  height?: string;
  width?: string;
  layout?: 'vertical' | 'horizontal' | 'baseline';
  contents?: FlexComponent[];
  paddingAll?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingStart?: string;
  paddingEnd?: string;
  spacing?: string;
}

interface FlexAction {
  type: 'uri' | 'postback' | 'message';
  uri?: string;
  data?: string;
  text?: string;
  label?: string;
}

interface FlexStyles {
  header?: FlexBox;
  hero?: FlexBox;
  body?: FlexBox;
  footer?: FlexBox;
}

// Visitor Notification Data Types
interface VisitorNotificationData {
  visitorName: string;
  visitorPhone: string;
  houseNumber: string;
  residentName: string;
  purpose: string;
  entryTime: string;
  villageName: string;
  visitorId: string;
  imageUrl?: string;
}

interface ApprovalNotificationData {
  visitorName: string;
  houseNumber: string;
  residentName: string;
  status: 'approved' | 'rejected';
  reason?: string;
  villageName: string;
}

interface SecurityAlertData {
  alertType: 'suspicious' | 'emergency' | 'maintenance';
  location: string;
  description: string;
  timestamp: string;
  villageName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class FlexMessageService {
  private channelAccessToken: string;

  constructor() {
    this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
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
                  type: 'text',
                  text: `ชื่อ: ${data.visitorName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `เบอร์โทร: ${data.visitorPhone}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `วัตถุประสงค์: ${data.purpose}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true
                }
              ],
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🏠 ข้อมูลบ้าน',
                  weight: 'bold',
                  size: 'md',
                  color: '#333333',
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `บ้านเลขที่: ${data.houseNumber}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `ผู้อยู่อาศัย: ${data.residentName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'text',
              text: `⏰ เวลาเข้า: ${data.entryTime}`,
              size: 'sm',
              color: '#1DB446',
              weight: 'bold',
              align: 'center',
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
              type: 'button',
              action: {
                type: 'uri',
                uri: `${process.env.FRONTEND_URL}/guard/approval/${data.visitorId}`,
                label: 'อนุมัติ/ปฏิเสธ'
              },
              style: 'primary',
              color: '#1DB446',
              height: 'sm'
            }
          ],
          paddingAll: '15px'
        }
      }
    };
  }

  /**
   * Create approval result notification flex message
   */
  createApprovalResultMessage(data: ApprovalNotificationData): FlexMessage {
    const isApproved = data.status === 'approved';
    const statusColor = isApproved ? '#1DB446' : '#FF6B6B';
    const statusIcon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'อนุมัติแล้ว' : 'ปฏิเสธ';

    return {
      type: 'flex',
      altText: `ผลการอนุมัติ: ${data.visitorName} ${statusText}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `${statusIcon} ผลการอนุมัติ`,
              weight: 'bold',
              size: 'lg',
              color: statusColor,
              align: 'center'
            }
          ],
          backgroundColor: isApproved ? '#F0F8F0' : '#FFF0F0',
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
              type: 'text',
              text: `ผู้เยี่ยม: ${data.visitorName}`,
              size: 'md',
              color: '#333333',
              weight: 'bold',
              margin: 'lg'
            },
            {
              type: 'text',
              text: `บ้านเลขที่: ${data.houseNumber}`,
              size: 'sm',
              color: '#666666',
              margin: 'xs'
            },
            {
              type: 'text',
              text: `ผู้อยู่อาศัย: ${data.residentName}`,
              size: 'sm',
              color: '#666666',
              margin: 'xs'
            },
            {
              type: 'text',
              text: `สถานะ: ${statusText}`,
              size: 'md',
              color: statusColor,
              weight: 'bold',
              align: 'center',
              margin: 'lg'
            },
            ...(data.reason ? [{
              type: 'text' as const,
              text: `เหตุผล: ${data.reason}`,
              size: 'sm' as const,
              color: '#666666',
              margin: 'md',
              wrap: true
            }] : [])
          ],
          paddingAll: '20px'
        }
      }
    };
  }

  /**
   * Create security alert flex message
   */
  createSecurityAlertMessage(data: SecurityAlertData): FlexMessage {
    const severityColors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#FF5722',
      critical: '#F44336'
    };

    const severityIcons = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };

    const alertTypeText = {
      suspicious: 'พฤติกรรมน่าสงสัย',
      emergency: 'เหตุฉุกเฉิน',
      maintenance: 'การบำรุงรักษา'
    };

    return {
      type: 'flex',
      altText: `แจ้งเตือนความปลอดภัย: ${alertTypeText[data.alertType]}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `${severityIcons[data.severity]} แจ้งเตือนความปลอดภัย`,
              weight: 'bold',
              size: 'lg',
              color: severityColors[data.severity],
              align: 'center'
            }
          ],
          backgroundColor: '#FFF5F5',
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
              type: 'text',
              text: alertTypeText[data.alertType],
              size: 'md',
              color: severityColors[data.severity],
              weight: 'bold',
              align: 'center',
              margin: 'lg'
            },
            {
              type: 'text',
              text: `📍 ตำแหน่ง: ${data.location}`,
              size: 'sm',
              color: '#666666',
              margin: 'md'
            },
            {
              type: 'text',
              text: `📝 รายละเอียด: ${data.description}`,
              size: 'sm',
              color: '#666666',
              margin: 'md',
              wrap: true
            },
            {
              type: 'text',
              text: `⏰ เวลา: ${data.timestamp}`,
              size: 'sm',
              color: '#666666',
              margin: 'md'
            },
            {
              type: 'text',
              text: `ระดับความรุนแรง: ${data.severity.toUpperCase()}`,
              size: 'sm',
              color: severityColors[data.severity],
              weight: 'bold',
              align: 'center',
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
              type: 'button',
              action: {
                type: 'uri',
                uri: `${process.env.FRONTEND_URL}/admin/security`,
                label: 'ดูรายละเอียด'
              },
              style: 'primary',
              color: severityColors[data.severity],
              height: 'sm'
            }
          ],
          paddingAll: '15px'
        }
      }
    };
  }

  /**
   * Create visitor notification message for residents
   */
  createVisitorNotificationMessage(data: VisitorNotificationData): FlexMessage {
    return {
      type: 'flex',
      altText: `แจ้งเตือนผู้เยี่ยม: ${data.visitorName} ต้องการเข้าบ้านเลขที่ ${data.houseNumber}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🔔 แจ้งเตือนผู้เยี่ยม',
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
                  type: 'text',
                  text: `ชื่อ: ${data.visitorName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `เบอร์โทร: ${data.visitorPhone}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `วัตถุประสงค์: ${data.purpose}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true
                }
              ],
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🏠 ข้อมูลบ้าน',
                  weight: 'bold',
                  size: 'md',
                  color: '#333333',
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `บ้านเลขที่: ${data.houseNumber}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `ผู้อยู่อาศัย: ${data.residentName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'text',
              text: `⏰ เวลาเข้า: ${data.entryTime}`,
              size: 'sm',
              color: '#1DB446',
              weight: 'bold',
              align: 'center',
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
              type: 'button',
              action: {
                type: 'uri',
                uri: `${process.env.FRONTEND_URL}/resident/visitor-details/${data.visitorId}`,
                label: 'ดูรายละเอียด'
              },
              style: 'secondary',
              color: '#666666',
              height: 'sm',
              margin: 'sm'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                data: `action=approve&visitorId=${data.visitorId}`,
                label: 'ยืนยันการเข้า'
              },
              style: 'primary',
              color: '#1DB446',
              height: 'sm',
              margin: 'sm'
            }
          ],
          paddingAll: '15px'
        }
      }
    };
  }

  /**
   * Create visitor details message for residents
   */
  createVisitorDetailsMessage(data: VisitorNotificationData): FlexMessage {
    return {
      type: 'flex',
      altText: `รายละเอียดผู้เยี่ยม: ${data.visitorName}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📋 รายละเอียดผู้เยี่ยม',
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
                  type: 'text',
                  text: `ชื่อ: ${data.visitorName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `เบอร์โทร: ${data.visitorPhone}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `วัตถุประสงค์: ${data.purpose}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs',
                  wrap: true
                }
              ],
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🏠 ข้อมูลบ้าน',
                  weight: 'bold',
                  size: 'md',
                  color: '#333333',
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `บ้านเลขที่: ${data.houseNumber}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                },
                {
                  type: 'text',
                  text: `ผู้อยู่อาศัย: ${data.residentName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'xs'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'text',
              text: `⏰ เวลาเข้า: ${data.entryTime}`,
              size: 'sm',
              color: '#1DB446',
              weight: 'bold',
              align: 'center',
              margin: 'lg'
            },
            ...(data.imageUrl ? [{
              type: 'image' as const,
              url: data.imageUrl,
              size: 'full',
              aspectRatio: '16:9',
              aspectMode: 'cover' as const,
              margin: 'lg'
            }] : [])
          ],
          paddingAll: '20px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                data: `action=approve&visitorId=${data.visitorId}`,
                label: '✅ ยืนยันการเข้า'
              },
              style: 'primary',
              color: '#1DB446',
              height: 'sm',
              margin: 'sm'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                data: `action=reject&visitorId=${data.visitorId}`,
                label: '❌ ปฏิเสธ'
              },
              style: 'secondary',
              color: '#FF6B6B',
              height: 'sm',
              margin: 'sm'
            }
          ],
          paddingAll: '15px'
        }
      }
    };
  }

  /**
   * Create welcome message for new residents
   */
  createWelcomeMessage(residentName: string, villageName: string): FlexMessage {
    return {
      type: 'flex',
      altText: `ยินดีต้อนรับสู่ ${villageName}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🏠 ยินดีต้อนรับ',
              weight: 'bold',
              size: 'xl',
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
              text: `สวัสดี ${residentName}`,
              size: 'lg',
              color: '#333333',
              weight: 'bold',
              align: 'center',
              margin: 'md'
            },
            {
              type: 'text',
              text: `ยินดีต้อนรับสู่ ${villageName}`,
              size: 'md',
              color: '#666666',
              align: 'center',
              margin: 'md'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'text',
              text: '🎉 คุณสามารถใช้งานระบบได้แล้ว',
              size: 'md',
              color: '#1DB446',
              weight: 'bold',
              align: 'center',
              margin: 'lg'
            },
            {
              type: 'text',
              text: '• ลงทะเบียนผู้เยี่ยม\n• ดูประวัติการเยี่ยม\n• รับการแจ้งเตือน',
              size: 'sm',
              color: '#666666',
              margin: 'md',
              wrap: true
            }
          ],
          paddingAll: '20px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                uri: `${process.env.FRONTEND_URL}/resident`,
                label: 'เริ่มใช้งาน'
              },
              style: 'primary',
              color: '#1DB446',
              height: 'sm'
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

// Create singleton instance
const flexMessageService = new FlexMessageService();

// Export routes
export const flexMessageRoutes = new Elysia({ prefix: '/api/line' })
  .post('/send-visitor-approval', async ({ body, set }) => {
    try {
      const { userId, data } = body as { 
        userId: string; 
        data: VisitorNotificationData 
      };

      if (!userId || !data) {
        set.status = 400;
        return { success: false, error: 'userId and data are required' };
      }

      const flexMessage = flexMessageService.createVisitorApprovalMessage(data);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);

      return { success, message: success ? 'Flex message sent' : 'Failed to send flex message' };
    } catch (error) {
      console.error('Error sending visitor approval flex message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .post('/send-approval-result', async ({ body, set }) => {
    try {
      const { userId, data } = body as { 
        userId: string; 
        data: ApprovalNotificationData 
      };

      if (!userId || !data) {
        set.status = 400;
        return { success: false, error: 'userId and data are required' };
      }

      const flexMessage = flexMessageService.createApprovalResultMessage(data);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);

      return { success, message: success ? 'Flex message sent' : 'Failed to send flex message' };
    } catch (error) {
      console.error('Error sending approval result flex message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .post('/send-security-alert', async ({ body, set }) => {
    try {
      const { userId, data } = body as { 
        userId: string; 
        data: SecurityAlertData 
      };

      if (!userId || !data) {
        set.status = 400;
        return { success: false, error: 'userId and data are required' };
      }

      const flexMessage = flexMessageService.createSecurityAlertMessage(data);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);

      return { success, message: success ? 'Flex message sent' : 'Failed to send flex message' };
    } catch (error) {
      console.error('Error sending security alert flex message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .post('/send-welcome', async ({ body, set }) => {
    try {
      const { userId, residentName, villageName } = body as { 
        userId: string; 
        residentName: string; 
        villageName: string; 
      };

      if (!userId || !residentName || !villageName) {
        set.status = 400;
        return { success: false, error: 'userId, residentName, and villageName are required' };
      }

      const flexMessage = flexMessageService.createWelcomeMessage(residentName, villageName);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);

      return { success, message: success ? 'Flex message sent' : 'Failed to send flex message' };
    } catch (error) {
      console.error('Error sending welcome flex message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .post('/send-visitor-notification', async ({ body, set }) => {
    try {
      const { userId, data } = body as { 
        userId: string; 
        data: VisitorNotificationData 
      };

      if (!userId || !data) {
        set.status = 400;
        return { success: false, error: 'userId and data are required' };
      }

      const flexMessage = flexMessageService.createVisitorNotificationMessage(data);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);

      return { success, message: success ? 'Visitor notification sent' : 'Failed to send visitor notification' };
    } catch (error) {
      console.error('Error sending visitor notification flex message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .post('/send-visitor-details', async ({ body, set }) => {
    try {
      const { userId, data } = body as { 
        userId: string; 
        data: VisitorNotificationData 
      };

      if (!userId || !data) {
        set.status = 400;
        return { success: false, error: 'userId and data are required' };
      }

      const flexMessage = flexMessageService.createVisitorDetailsMessage(data);
      const success = await flexMessageService.sendFlexMessage(userId, flexMessage);

      return { success, message: success ? 'Visitor details sent' : 'Failed to send visitor details' };
    } catch (error) {
      console.error('Error sending visitor details flex message:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  })

  .post('/handle-visitor-response', async ({ body, set }) => {
    try {
      const { action, visitorId, userId, reason } = body as { 
        action: 'approve' | 'reject';
        visitorId: string;
        userId: string;
        reason?: string;
      };

      if (!action || !visitorId || !userId) {
        set.status = 400;
        return { success: false, error: 'action, visitorId, and userId are required' };
      }

      // Here you would typically update the database with the resident's response
      // For now, we'll just return success
      console.log(`Resident ${userId} ${action}d visitor ${visitorId}${reason ? ` with reason: ${reason}` : ''}`);

      // Send confirmation message back to resident
      const confirmationMessage = action === 'approve' 
        ? `✅ คุณได้ยืนยันการเข้าให้ผู้เยี่ยมแล้ว`
        : `❌ คุณได้ปฏิเสธการเข้าให้ผู้เยี่ยมแล้ว${reason ? `\nเหตุผล: ${reason}` : ''}`;

      const textMessage = {
        type: 'text',
        text: confirmationMessage
      };

      const success = await flexMessageService.sendFlexMessage(userId, textMessage as any);

      return { 
        success, 
        message: success ? 'Response processed' : 'Failed to process response',
        action,
        visitorId,
        userId
      };
    } catch (error) {
      console.error('Error handling visitor response:', error);
      set.status = 500;
      return { success: false, error: 'Internal server error' };
    }
  });

// Export the service for use in other modules
export { flexMessageService };
export type { VisitorNotificationData, ApprovalNotificationData, SecurityAlertData };
