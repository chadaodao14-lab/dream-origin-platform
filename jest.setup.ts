// Jest setup file
// Mock environment variables
process.env.DATABASE_URL = 'mysql://root:@localhost:3306/test_db';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Mock database connection
jest.mock('./db', () => ({
  getDb: jest.fn().mockResolvedValue({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([])
  })
}));