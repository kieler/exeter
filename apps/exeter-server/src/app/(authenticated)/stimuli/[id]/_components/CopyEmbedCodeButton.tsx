"use client";

import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState } from "react";

interface CopyEmbedCodeButtonProps {
  code: string;
  url: string;
}

/**
 * Copies a stimulus's iframe snippet or URL to the clipboard.
 */
export function CopyEmbedCodeButton({ code, url }: CopyEmbedCodeButtonProps) {
  const [codeCopyState, setCodeCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [urlCopyState, setUrlCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy(value: string, setCopyState: (state: "idle" | "copied" | "failed") => void): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      <Button
        type="button"
        onClick={() => void copy(code, setCodeCopyState)}
        title={codeCopyState === "failed" ? "Clipboard access was unavailable." : undefined}
        variant="outlined"
        size="small"
        startIcon={<ContentCopyOutlinedIcon />}
      >
        {codeCopyState === "copied" ? "Copied" : "Copy Code"}
      </Button>
      <Button
        type="button"
        onClick={() => void copy(url, setUrlCopyState)}
        title={urlCopyState === "failed" ? "Clipboard access was unavailable." : undefined}
        variant="outlined"
        size="small"
        startIcon={<ContentCopyOutlinedIcon />}
      >
        {urlCopyState === "copied" ? "Copied" : "Copy URL"}
      </Button>
    </Box>
  );
}
