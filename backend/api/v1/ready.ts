// Minimal serverless wrapper that calls the Express readiness route without importing Prisma here
import serverless from 'serverless-http';
import app from '../../src/app';
export default serverless(app);

