import { Bindings } from '@/types'
import { Context, Hono, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';

import { PlatformaticError } from './errors';
// import { apiRouter } from './api/router';
import { initMonitoringRouter } from './monitoring'

import { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status';

// Get package version
const version = '0.0.1';

export interface AppContext {
  // Add your custom context properties here
}

export function createApp() {

  // Create Hono app with OpenAPI support
  const app = new OpenAPIHono<{ Bindings: AppContext }>();

  // Add middleware
  app.use(logger());
  app.use(prettyJSON());
  app.use(secureHeaders());

  const corsHandler = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    if (c.env.APP_URL === undefined) {
      console.log(
        'APP_URL is not set. CORS errors may occur. Make sure the .dev.vars file is present at /packages/api/.dev.vars'
      )
    }
    return await cors({
      origin: ['http://localhost:3000'],
      credentials: true,
      allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
      // https://hono.dev/middleware/builtin/cors#options
    })(c, next)
  }

  app.use(corsHandler)

  // Add Swagger documentation
  app.doc31('/api/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Reworkd Platform API',
      version,
    },
  });

  app.get('/api/docs', swaggerUI({
    url: '/api/openapi.json',
  }));

  // Register startup and shutdown events
  // registerStartupEvent(app);
  // registerShutdownEvent(app);

  // Mount API routes
  // app.route('/api', apiRouter);

  initMonitoringRouter(app)

  // Error handling
  app.onError((err, c) => {
    if (err instanceof PlatformaticError) {
      return c.json({
        status: 'error',
        message: err.message,
        code: err.code,
      }, err.code as ContentfulStatusCode);
    }

    console.error('Unhandled error:', err);
    return c.json({
      status: 'error',
      message: 'Internal Server Error',
    }, 500);
  });

  return app;
};
