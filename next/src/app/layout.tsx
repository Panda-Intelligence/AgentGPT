import clsx from "clsx";
import type { Metadata } from 'next'
import React from "react";

const description = "Assemble, configure, and deploy autonomous AI Agents in your browser.";
export const metadata: Metadata = {
  title: 'AgentGPT',
  // <meta name="description" content={description} />
  //       <meta name="twitter:site" content="@AgentGPT" />
  //       <meta name="twitter:card" content="summary_large_image" />
  //       <meta name="twitter:title" content="AgentGPT 🤖" />
  //       <meta name="twitter:description" content={description} />
  //       <meta name="twitter:image" content="https://agentgpt.reworkd.ai/banner.png" />
  //       <meta name="twitter:image:width" content="1280" />
  //       <meta name="twitter:image:height" content="640" />
  //       <meta property="og:title" content="AgentGPT: Autonomous AI in your browser 🤖" />
  //       <meta property="og:description" content={description} />
  //       <meta property="og:url" content="https://agentgpt.reworkd.ai/" />
  //       <meta property="og:image" content="https://agentgpt.reworkd.ai/banner.png" />
  //       <meta property="og:image:width" content="1280" />
  //       <meta property="og:image:height" content="640" />
  //       <meta property="og:type" content="website" />
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <html>
      <body>
        <div
          className={clsx(
            "flex flex-col bg-gradient-to-b from-[#2B2B2B] to-[#1F1F1F]",
          )}
        >
          <div className={clsx("min-w-screen min-h-screen")}>{children}</div>
        </div>
      </body>
    </html>
  );
};
