/* eslint-disable import/order */
import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "@/utils/api";

import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { appWithTranslation, useTranslation } from "next-i18next";
import { useEffect } from "react";

import nextI18NextConfig from "../../../next-i18next.config";

import { GoogleAnalytics } from "nextjs-google-analytics";

const MyApp: AppType<{ session: Session | null }> = ({
  children, ...props
}) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.on("languageChanged", () => {
      document.documentElement.lang = i18n.language;
    });
    document.documentElement.lang = i18n.language;
  }, [i18n]);

  return (
    <div>
      <SessionProvider {...props}>
        <GoogleAnalytics trackPageViews />
        <Analytics />
        {children}
      </SessionProvider>
    </div>
  );
};

export default api.withTRPC(appWithTranslation(MyApp, nextI18NextConfig));
