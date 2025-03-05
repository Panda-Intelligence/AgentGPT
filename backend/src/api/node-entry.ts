
import { serve } from '@hono/node-server';
import { createApp } from './application'
// Server startup function
export const startServer = async (port: number = 3000) => {
  const app = createApp();

  console.log(`🚀 Server starting on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });

  return app;
};

// For direct execution
if (require.main === module) {
  startServer(Number(process.env.PORT) || 8000);
}
