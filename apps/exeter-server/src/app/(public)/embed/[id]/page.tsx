import { KlighdDiagram } from "@/components/klighd-diagram";
import Box from "@mui/material/Box";
import { stimulusRepository } from "@/lib/stimuli";
import { notFound } from "next/navigation";

interface EmbedPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<EmbedSearchParameters>;
}

interface EmbedSearchParameters {
  disableInstrumentation?: string;
  showSidebar?: string;
  showFitToScreenAction?: string;
  externalParticipantId?: string;
  externalSessionId?: string;
}

/**
 * Renders a stimulus's stored diagram snapshot in a public, optionally instrumented embed frame.
 */
export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { id } = await params;
  const options = await searchParams;
  const stimulus = await stimulusRepository.getStimulusReplay(id);
  if (!stimulus) notFound();

  return (
    <Box sx={{ width: "100dvw", height: "100dvh", overflow: "hidden" }}>
      <KlighdDiagram
        replay={stimulus.klighdReplay}
        renderOptions={stimulus.renderOptions}
        instrumentation={options.disableInstrumentation !== "1"}
        stimulusId={stimulus.id}
        externalParticipantId={options.externalParticipantId}
        externalSessionId={options.externalSessionId}
        showSidebar={options.showSidebar === "1"}
        showFitToScreenAction={options.showFitToScreenAction !== "0"}
        disableSearchShortcut
      />
    </Box>
  );
}
