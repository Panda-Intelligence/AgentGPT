import { Context, Hono } from "hono";

export function initMonitoringRouter(app: Hono) {

  // Health check endpoint
  app.get('/health', async (c: Context) => {
    /**
     * Checks the health of a project.
     * It returns 200 if the project is healthy.
     */
    return c.text('Healthy');
  });

  // Error check endpoint
  app.get('/error', async (c: Context) => {
    /**
     * Checks that errors are being correctly logged.
     */
    throw new Error("This is an expected error from the error check endpoint!");
  });

}
