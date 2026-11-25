import { KlighdDiagram } from "@/components/klighd-diagram";
import Box from "@mui/material/Box";
import { getKlighdWebsocketUrl } from "@/lib/klighd/websocket-url";
import { modelFileStore, modelRepository } from "@/lib/models";
import { notFound } from "next/navigation";

interface ModelPreviewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ showSidebar?: string }>;
}

/**
 * Renders only an uninstrumented diagram for a public model preview iframe.
 */
export default async function ModelPreviewPage({ params, searchParams }: ModelPreviewPageProps) {
  const { id } = await params;
  const model = await modelRepository.getModel(id);
  if (!model) {
    notFound();
  }

  const source = await modelFileStore.read(model.id);
  if (!source) {
    notFound();
  }

  const { showSidebar } = await searchParams;

  return (
    <Box component="main" sx={{ width: "100dvw", height: "100dvh", overflow: "hidden" }}>
      <KlighdDiagram
        source={source}
        websocketUrl={getKlighdWebsocketUrl()}
        showSidebar={!!showSidebar}
      />
    </Box>
  );
}
