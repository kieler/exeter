import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { MuiProvider } from "@/components/mui-provider";
import type { Metadata } from "next";
import "@kieler/klighd-core/styles/main.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exeter",
  description: "KLighD study environment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <MuiProvider>{children}</MuiProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
