import type { Metadata } from "next/types";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { BehavioralProvider } from "./context/BehavioralContext";
import { QueryClientProviderWrapper } from "./context/QueryClientProviderWrapper";
import SpiralMark from "../../components/SpiralMark";
import ModelStatusIndicator from "../../components/ModelStatusIndicator";
import BehavioralNotifications from "../components/behavioral/BehavioralNotifications";
import { GlobalXPPop } from "../components/behavioral/XPPopAnimation";
import MilestoneSystem from "../components/behavioral/MilestoneSystem";
import SmartNudgeSystem from "../components/behavioral/SmartNudgeSystem";
import RewardSystemManager from "../components/behavioral/RewardSystemManager";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: "Menttor - AI Based Learning",
  description: "Your personalized AI-powered learning journey. Master new skills with adaptive roadmaps, interactive quizzes, and intelligent feedback.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider>
            <QueryClientProviderWrapper>
              <BehavioralProvider>
                <ModelStatusIndicator />
                <BehavioralNotifications />
                <GlobalXPPop />
                <MilestoneSystem />
                <SmartNudgeSystem />
                <RewardSystemManager />
                {children}
              </BehavioralProvider>
            </QueryClientProviderWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}