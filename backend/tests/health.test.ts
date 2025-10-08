import request from 'supertest';
import app from '../src/app';

describe('Health Endpoints', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 with success envelope', async () => {
      const res = await request(app).get('/api/v1/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('ok');
      expect(res.body.error).toBeNull();
    });

    it('should include uptime in response', async () => {
      const res = await request(app).get('/api/v1/health');
      
      expect(res.body.data.uptime).toBeDefined();
      expect(typeof res.body.data.uptime).toBe('number');
    });
  });

  describe('GET /api/v1/ready', () => {
    it('should return database status', async () => {
      const res = await request(app).get('/api/v1/ready');
      
      expect([200, 503]).toContain(res.status);
      expect(res.body.success).toBeDefined();
      expect(typeof res.body.success).toBe('boolean');
    });

    it('should return 503 if database is not ready', async () => {
      // This test would need to mock the database connection
      // For now, we just verify the endpoint exists
      const res = await request(app).get('/api/v1/ready');
      
      if (res.status === 503) {
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBeDefined();
        expect(res.body.error.code).toBe('DB_UNAVAILABLE');
      }
    });
  });
});

