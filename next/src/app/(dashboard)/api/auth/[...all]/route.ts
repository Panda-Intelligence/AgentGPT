import { toNextJsHandler } from "better-auth/next-js";

import { authOptions } from "@/server/auth";

export const { POST, GET } = toNextJsHandler(authOptions);
