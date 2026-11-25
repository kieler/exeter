import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";

export interface DetailPageMetadataItem {
  label: string;
  value: ReactNode;
}

interface DetailPageProps {
  title: ReactNode;
  metadata: readonly DetailPageMetadataItem[];
  children: ReactNode;
  action?: ReactNode;
}

/** Shared framing for authenticated record detail pages. */
export function DetailPage({ title, metadata, children, action }: DetailPageProps) {
  return (
    <Container component="main" maxWidth={false} sx={{ py: 3 }}>
      <Box component="header" sx={{ mb: 4 }}>
        <PageHeader title={title} actions={action} />
        <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) repeat(3, minmax(0, 1fr))" }, gap: 3, mt: 3, mb: 3 }}>
          {metadata.map((item) => (
            <Box key={item.label}>
              <Typography component="dt" variant="body2" color="text.secondary">{item.label}</Typography>
              <Typography component="dd" sx={{ mt: 0.5, mb: 0, fontWeight: 500 }}>{item.value}</Typography>
            </Box>
          ))}
        </Box>
        <Divider />
      </Box>
      {children}
    </Container>
  );
}
