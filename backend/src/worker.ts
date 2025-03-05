/// <reference types="../worker-configuration.d.ts" />

import { createApp } from './api/application'

export type Bindings = Env & {
  JWT_VERIFICATION_KEY: string
  APP_URL: string

  DISCORD_CLIENT_ID: string
  DISCORD_CLIENT_SECRET: string

  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string

  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string

  RESEND_API_KEY: string

  PUBLIC_SUPPORT_EMAIL: string
  PUBLIC_API_URL: string
  PUBLIC_NATIVE_SCHEME: string

  HIGHLIGHT_PROJECT_ID: string
  [k: string]: unknown
}

const app = createApp<Bindings>()

export default app
