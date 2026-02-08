// Global test setup

// Provide a default for __DEV__ (used by logger, etc.)
if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = true;
}

// Mock expo-secure-store for tests
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
