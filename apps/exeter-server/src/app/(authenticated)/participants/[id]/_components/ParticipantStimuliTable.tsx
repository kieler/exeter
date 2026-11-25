import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/next-link";
import type { ParticipantStimulus } from "@/lib/participants";
import { getStimulusPath, getModelPath } from "@/routes";

const integerFormatter = new Intl.NumberFormat("de-DE");

/**
 * Displays the distinct stimuli in which one participant has recorded sessions.
 */
export function ParticipantStimuliTable({ stimuli }: { stimuli: readonly ParticipantStimulus[] }) {
  if (stimuli.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: "center" }}>No stimuli are linked to this participant.</Typography>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Stimulus</TableCell>
            <TableCell>Model</TableCell>
            <TableCell align="right">Sessions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stimuli.map((stimulus) => (
            <TableRow key={stimulus.id}>
              <TableCell>
                <Link component={NextLink} href={getStimulusPath(stimulus.id)}>
                  {stimulus.name}
                </Link>
              </TableCell>
              <TableCell>
                <Link component={NextLink} href={getModelPath(stimulus.model.id)}>
                  {stimulus.model.name}
                </Link>
              </TableCell>
              <TableCell align="right">{integerFormatter.format(stimulus.sessionCount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
