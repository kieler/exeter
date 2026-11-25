"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Card } from "@/components/card";

export interface ModelPreviewProps {
  titleId: string;
  description?: string;
  iframeTitle: string;
  previewUrl?: string;
  emptyMessage?: string;
}

/**
 * Renders an embedded diagram preview with a matching standalone-preview link.
 */
export function ModelPreview({
  titleId,
  description,
  iframeTitle,
  previewUrl,
  emptyMessage = "Upload a source file to enable the preview.",
}: ModelPreviewProps) {
  return (
    <Card
      title="Preview"
      titleId={titleId}
      description={description}
      headingLevel="h2"
      action={previewUrl ? <OpenPreviewLink href={previewUrl} /> : null}
      contentSx={{ p: 0, "&:last-child": { pb: 0 } }}
    >
      {previewUrl ? (
        <Box sx={{ height: "42rem" }}>
          <iframe
            key={previewUrl}
            title={iframeTitle}
            src={previewUrl}
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </Box>
      ) : (
        <Box sx={{ display: "flex", height: "42rem", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
        </Box>
      )}
    </Card>
  );
}

/**
 * Opens the iframe source as a standalone browser tab.
 */
function OpenPreviewLink({ href }: { href: string }) {
  return (
    <Button
      href={href}
      target="_blank"
      rel="noreferrer"
      variant="text"
      size="small"
      endIcon={<OpenInNewOutlinedIcon />}
    >
      Open Preview
    </Button>
  );
}
