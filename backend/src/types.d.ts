/// <reference types="../worker-configuration.d.ts" />

export type Bindings = Env & {
  JWT_VERIFICATION_KEY: string
  APP_URL: string

  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string

  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string

  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string

  [k: string]: unknown
}

