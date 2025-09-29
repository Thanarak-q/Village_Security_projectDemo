/**
 * @file Test setup file for Vitest
 * Configures global test environment and mocks
 */

import { vi } from 'vitest';
import 'dotenv/config';

// Mock environment variables for testing
process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token_123';
process.env.FRONTEND_URL = 'https://test.example.com';
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch globally
global.fetch = vi.fn();

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
} as any;

// Setup test timeout
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});
