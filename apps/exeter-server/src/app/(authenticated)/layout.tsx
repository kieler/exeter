import "rrweb-player/dist/style.css";
import Box from "@mui/material/Box";
import { requireUser } from "@/lib/auth/require-user";
import type { ReactNode } from "react";
import { DESKTOP_SIDEBAR_WIDTH, DesktopSidebar } from "./_components/DesktopSidebar";
import { MobileNavigation } from "./_components/MobileNavigation";

/**
 * Authenticates and renders the shared admin navigation around every protected page.
 */
export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireUser();

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default", color: "text.primary" }}>
      <DesktopSidebar user={user} />
      <MobileNavigation user={user} />
      <Box component="main" sx={{ minHeight: "100dvh", pt: { xs: 8, lg: 0 }, pl: { lg: `${DESKTOP_SIDEBAR_WIDTH}px` } }}>{children}</Box>
    </Box>
  );
}
