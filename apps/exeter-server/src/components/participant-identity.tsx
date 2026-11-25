import { Avatar, Style } from "@dicebear/core";
import definition from "@dicebear/styles/identicon.json" with { type: "json" };
import MuiAvatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/next-link";
import { getParticipantPath } from "@/routes";

const avatarStyle = new Style(definition);

export interface ParticipantIdentityProps {
  participantId: string;
  isLinked?: boolean;
}

/**
 * Renders a participant's deterministic avatar and compact, optionally linked ID.
 */
export function ParticipantIdentity({
  participantId,
  isLinked = true,
}: ParticipantIdentityProps) {
  const content = (
    <>
      <ParticipantAvatar participantId={participantId} />
      <Typography component="span" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{participantId.split("-", 1)[0] ?? participantId}</Typography>
    </>
  );

  if (!isLinked) {
    return <Stack component="span" direction="row" spacing={1} title={participantId} sx={{ alignItems: "center", whiteSpace: "nowrap" }}>{content}</Stack>;
  }

  return (
    <Link
      component={NextLink}
      href={getParticipantPath(participantId)}
      title={participantId}
      sx={{ display: "inline-flex", alignItems: "center", gap: 1, whiteSpace: "nowrap" }}
    >
      {content}
    </Link>
  );
}

/**
 * Renders a deterministic DiceBear avatar for a participant ID.
 */
export function ParticipantAvatar({ participantId }: { participantId: string }) {
  const avatar = new Avatar(avatarStyle, { seed: participantId });

  return (
    <MuiAvatar
      src={avatar.toDataUri()}
      alt=""
      sx={{ width: 28, height: 28 }}
    />
  );
}
