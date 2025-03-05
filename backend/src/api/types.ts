import { OpenAPIHono } from '@hono/zod-openapi';

export type App = OpenAPIHono<{
    Bindings: {
        // Add your environment bindings here
    };
    Variables: {
        // Add your custom variables here
    };
}>;

export interface ErrorResponse {
    status: 'error';
    message: string;
    code?: string;
}

export interface SuccessResponse<T> {
    status: 'success';
    data: T;
}
