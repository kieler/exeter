import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export interface CardProps {
  title: ReactNode;
  titleId?: string;
  headingLevel?: "h2" | "h3";
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

/**
 * Renders a titled content card with an optional subtitle and header action.
 */
export function Card({
  title,
  titleId,
  headingLevel = "h3",
  description,
  action,
  children,
  sx,
  contentSx,
}: CardProps) {
  return (
    <MuiCard component="article" variant="outlined" sx={sx}>
      <CardHeader
        title={<Typography id={titleId} component={headingLevel} variant="h6">{title}</Typography>}
        subheader={description}
        action={action}
      />
      <CardContent sx={[{ p: 2.5, "&:last-child": { pb: 2.5 } }, ...(Array.isArray(contentSx) ? contentSx : [contentSx])]}>{children}</CardContent>
    </MuiCard>
  );
}
