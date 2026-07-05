import 'reflect-metadata';
import { bootstrapApp } from './bootstrap';

let cachedServer: any;
let bootstrapError: Error | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (bootstrapError) {
      res.status(500).json({
        statusCode: 500,
        message: bootstrapError.message,
        hint: 'Check Vercel env vars: MONGO_URI, JWT_SECRET, CLERK_SECRET_KEY',
      });
      return;
    }

    if (!cachedServer) {
      const app = await bootstrapApp(true);
      await app.init();
      cachedServer = app.getHttpAdapter().getInstance();
    }

    return cachedServer(req, res);
  } catch (error: any) {
    console.error('Vercel serverless handler error:', error);
    if (!cachedServer) {
      bootstrapError = error;
    }
    res.status(500).json({
      statusCode: 500,
      message: error?.message || 'Internal server error',
    });
  }
}
