/**
 * @file Test suite for Visitor Notification System
 * Tests visitor notification functionality
 */

// @ts-ignore - vitest types will be available when installed
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { notificationService } from '../services/notificationService';
import { type VisitorNotificationData } from '../routes/(line)/flexMessage';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token_123';
process.env.FRONTEND_URL = 'https://test.example.com';

describe('Visitor Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendVisitorNotificationToResidents', () => {
    const mockVisitorData: VisitorNotificationData = {
      visitorName: 'สมชาย ใจดี',
      visitorPhone: '081-234-5678',
      houseNumber: '123/45',
      residentName: 'สมหญิง รักบ้าน',
      purpose: 'เยี่ยมเยียนครอบครัว',
      entryTime: '14:30 น.',
      villageName: 'หมู่บ้านสุขสันต์',
      visitorId: 'visitor_001'
    };

    it('should send notification to all residents in house', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"status": "success"}')
      };

      (global.fetch as Mock).mockResolvedValue(mockResponse);

      const result = await notificationService.sendVisitorNotificationToResidents(
        mockVisitorData,
        '123/45',
        'pha-suk-village-001'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Sent to');
      expect(result.total).toBeGreaterThan(0);
    });

    it('should handle no residents found', async () => {
      // Mock empty residents
      vi.spyOn(notificationService, 'getResidentsInHouse').mockResolvedValue([]);

      const result = await notificationService.sendVisitorNotificationToResidents(
        mockVisitorData,
        '999/99',
        'pha-suk-village-001'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No residents found in house');
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: () => Promise.resolve('{"message": "Bad Request"}')
      };

      (global.fetch as Mock).mockResolvedValue(mockResponse);

      const result = await notificationService.sendVisitorNotificationToResidents(
        mockVisitorData,
        '123/45',
        'pha-suk-village-001'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send notifications');
    });
  });

  describe('sendVisitorNotificationFlexMessage', () => {
    const mockVisitorData: VisitorNotificationData = {
      visitorName: 'สมชาย ใจดี',
      visitorPhone: '081-234-5678',
      houseNumber: '123/45',
      residentName: 'สมหญิง รักบ้าน',
      purpose: 'เยี่ยมเยียนครอบครัว',
      entryTime: '14:30 น.',
      villageName: 'หมู่บ้านสุขสันต์',
      visitorId: 'visitor_001'
    };

    it('should send notification to single user', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"status": "success"}')
      };

      (global.fetch as Mock).mockResolvedValue(mockResponse);

      const result = await notificationService.sendVisitorNotificationFlexMessage(
        'U1234567890abcdef',
        mockVisitorData
      );

      expect(result).toBe(true);
    });

    it('should handle network errors', async () => {
      (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

      const result = await notificationService.sendVisitorNotificationFlexMessage(
        'U1234567890abcdef',
        mockVisitorData
      );

      expect(result).toBe(false);
    });
  });

  describe('sendVisitorDetailsFlexMessage', () => {
    const mockVisitorData: VisitorNotificationData = {
      visitorName: 'สมชาย ใจดี',
      visitorPhone: '081-234-5678',
      houseNumber: '123/45',
      residentName: 'สมหญิง รักบ้าน',
      purpose: 'เยี่ยมเยียนครอบครัว',
      entryTime: '14:30 น.',
      villageName: 'หมู่บ้านสุขสันต์',
      visitorId: 'visitor_001',
      imageUrl: 'https://example.com/photo.jpg'
    };

    it('should send details to single user', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"status": "success"}')
      };

      (global.fetch as Mock).mockResolvedValue(mockResponse);

      const result = await notificationService.sendVisitorDetailsFlexMessage(
        'U1234567890abcdef',
        mockVisitorData
      );

      expect(result).toBe(true);
    });
  });

  describe('getResidentsInHouse', () => {
    it('should return mock residents data', async () => {
      const residents = await notificationService.getResidentsInHouse(
        '123/45',
        'pha-suk-village-001'
      );

      expect(Array.isArray(residents)).toBe(true);
      expect(residents.length).toBeGreaterThan(0);
      expect(residents[0]).toHaveProperty('residentId');
      expect(residents[0]).toHaveProperty('name');
      expect(residents[0]).toHaveProperty('lineUserId');
    });

    it('should handle errors gracefully', async () => {
      // Mock error
      vi.spyOn(notificationService, 'getResidentsInHouse').mockRejectedValue(new Error('Database error'));

      const residents = await notificationService.getResidentsInHouse(
        'invalid_house',
        'invalid_village'
      );

      expect(Array.isArray(residents)).toBe(true);
      expect(residents.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing visitor data', async () => {
      const incompleteData = {
        visitorName: '',
        visitorPhone: '',
        houseNumber: '',
        residentName: '',
        purpose: '',
        entryTime: '',
        villageName: '',
        visitorId: ''
      } as VisitorNotificationData;

      const result = await notificationService.sendVisitorNotificationToResidents(
        incompleteData,
        '123/45',
        'pha-suk-village-001'
      );

      expect(result.success).toBe(false);
    });

    it('should handle invalid user IDs', async () => {
      const mockVisitorData: VisitorNotificationData = {
        visitorName: 'สมชาย ใจดี',
        visitorPhone: '081-234-5678',
        houseNumber: '123/45',
        residentName: 'สมหญิง รักบ้าน',
        purpose: 'เยี่ยมเยียนครอบครัว',
        entryTime: '14:30 น.',
        villageName: 'หมู่บ้านสุขสันต์',
        visitorId: 'visitor_001'
      };

      const invalidUserIds = ['', 'invalid', '123'];

      for (const userId of invalidUserIds) {
        const mockResponse = {
          ok: false,
          status: 400,
          text: () => Promise.resolve('{"message": "Invalid user ID"}')
        };

        (global.fetch as Mock).mockResolvedValue(mockResponse);

        const result = await notificationService.sendVisitorNotificationFlexMessage(
          userId,
          mockVisitorData
        );

        expect(result).toBe(false);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple notifications efficiently', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"status": "success"}')
      };

      (global.fetch as Mock).mockResolvedValue(mockResponse);

      const mockVisitorData: VisitorNotificationData = {
        visitorName: 'สมชาย ใจดี',
        visitorPhone: '081-234-5678',
        houseNumber: '123/45',
        residentName: 'สมหญิง รักบ้าน',
        purpose: 'เยี่ยมเยียนครอบครัว',
        entryTime: '14:30 น.',
        villageName: 'หมู่บ้านสุขสันต์',
        visitorId: 'visitor_001'
      };

      const startTime = performance.now();
      
      const promises = Array.from({ length: 5 }, (_, i) => 
        notificationService.sendVisitorNotificationFlexMessage(
          `U${i}1234567890abcdef`,
          { ...mockVisitorData, visitorId: `visitor_${i}` }
        )
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(results).toHaveLength(5);
      expect(results.every(result => result === true)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
