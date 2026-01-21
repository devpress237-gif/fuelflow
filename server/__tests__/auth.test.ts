
import { generateToken, verifyToken } from '../auth';

describe('Authentication', () => {
  const mockUser = {
    id: 'test-id',
    username: 'testuser',
    fullName: 'Test User',
    role: 'admin',
    stationId: 'station-1'
  };

  test('should generate a valid JWT token', () => {
    const token = generateToken(mockUser);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  test('should verify a valid token', () => {
    const token = generateToken(mockUser);
    const decoded = verifyToken(token);
    
    expect(decoded).toBeTruthy();
    expect(decoded?.id).toBe(mockUser.id);
    expect(decoded?.username).toBe(mockUser.username);
    expect(decoded?.role).toBe(mockUser.role);
  });

  test('should return null for invalid token', () => {
    const decoded = verifyToken('invalid-token');
    expect(decoded).toBeNull();
  });
});
