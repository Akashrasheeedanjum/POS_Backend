// // api/index.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../src/app.module';
// import { Server } from 'http';

// let cachedServer: any;

// export default async function handler(req: any, res: any) {
//   if (!cachedServer) {
//     const app = await NestFactory.create(AppModule);
//     app.setGlobalPrefix('v1');
//     app.enableCors();
//     await app.init(); // no app.listen()
//     const expressApp = app.getHttpAdapter().getInstance();
//     cachedServer = expressApp;
//   }
//   return cachedServer(req, res);
// }


import 'tsconfig-paths/register';
import { bootstrapApp } from './bootstrap';

let cachedServer: any;

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    const app = await bootstrapApp(true);
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer(req, res);
}
