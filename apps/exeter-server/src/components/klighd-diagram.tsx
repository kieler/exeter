"use client";

import "reflect-metadata";
import {
  bindServices,
  ColorThemeKind,
  createKlighdDiagramContainer,
  getActionDispatcher,
  KlighdFitToScreenAction,
  requestModel,
} from "@kieler/klighd-core";
import { initialise } from "@kieler/klighd-instrumentation";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import { SetUIExtensionVisibilityAction, type IActionDispatcher } from "sprotty";
import { BrowserTransport } from "@/lib/klighd/connection/transport/browser.transport";
import { JsonRpcKlighdConnection } from "@/lib/klighd/connection/json-rpc-klighd-connection";
import { ReplayKlighdConnection } from "@/lib/klighd/connection/replay-klighd-connection";
import { InMemoryPersistenceStorage } from "@/lib/klighd/persistence-storage";
import type { KlighdReplay } from "@/lib/klighd/replay";
import type { DiagramRenderOptions } from "@/lib/klighd/render-options";
import type { ModelSource } from "@/lib/models";

export interface KlighdDiagramProps {
  source?: ModelSource;
  websocketUrl?: string;
  replay?: KlighdReplay;
  renderOptions?: DiagramRenderOptions;
  instrumentation?: boolean;
  stimulusId?: string;
  externalParticipantId?: string | null;
  externalSessionId?: string | null;
  showSidebar?: boolean;
  showFitToScreenAction?: boolean;
  disableSearchShortcut?: boolean;
  containerId?: string;
}

const defaultContainerId = "klighd-diagram";
const firefoxSvgZoomRepaintDelayMs = 500;

/**
 * Works around a Firefox SVG/WebRender invalidation issue after Sprotty changes
 * the viewport scale. The diagram is already in its correct final state, but
 * Firefox can retain a low-resolution raster until another paint occurs.
 *
 * This deliberately observes only the DOM that Sprotty owns. It never changes
 * the model, viewport transform, event handling, or diagram geometry. Every
 * callback is best-effort so a browser/API failure cannot escape into the
 * diagram lifecycle.
 */
function installFirefoxSvgZoomRepaint(mount: HTMLElement): () => void {
  try {
    const isFirefox = /Firefox\/\d+(?:\.\d+)*/.test(navigator.userAgent);
    if (!isFirefox) {
      return () => {};
    }

    let disposed = false;
    let observedSvg: SVGSVGElement | undefined;
    let observedViewport: SVGGElement | undefined;
    let svgObserver: MutationObserver | undefined;
    let viewportObserver: MutationObserver | undefined;
    let repaintTimeout: number | undefined;
    let firstAnimationFrame: number | undefined;
    let secondAnimationFrame: number | undefined;
    let viewportSearchTimeout: number | undefined;
    let viewportSearchAttempts = 0;
    let lastScale: string | undefined;
    let paintedSvg: SVGSVGElement | undefined;
    let previousBackground: string | undefined;

    const restoreBackground = () => {
      try {
        if (paintedSvg?.isConnected && previousBackground !== undefined) {
          paintedSvg.style.backgroundColor = previousBackground;
        }
      } catch {
        // The workaround must never interfere with the diagram.
      }
      paintedSvg = undefined;
      previousBackground = undefined;
    };

    const cancelScheduledRepaint = () => {
      window.clearTimeout(repaintTimeout);
      if (firstAnimationFrame !== undefined) window.cancelAnimationFrame(firstAnimationFrame);
      if (secondAnimationFrame !== undefined) window.cancelAnimationFrame(secondAnimationFrame);
      repaintTimeout = undefined;
      firstAnimationFrame = undefined;
      secondAnimationFrame = undefined;
      restoreBackground();
    };

    const findSprottySvg = () => (
      mount.querySelector<SVGSVGElement>("svg.sprotty-graph")
      // Sprotty may place its SVG outside the configured base div. Its generated
      // ID is namespaced by that div's ID, which keeps this lookup diagram-local.
      ?? Array.from(document.querySelectorAll<SVGSVGElement>("svg.sprotty-graph"))
        .find((svg) => svg.id.startsWith(`${mount.id}_`))
    );

    const repaint = () => {
      let svg: SVGSVGElement | undefined;
      try {
        if (disposed || !observedSvg?.isConnected) return;

        svg = observedSvg;
        previousBackground = svg.style.backgroundColor;
        paintedSvg = svg;
        // This is a paint-only invalidation. It leaves Sprotty's SVG transform
        // and all interaction state untouched.
        svg.style.backgroundColor = "rgb(255, 255, 254)";

        firstAnimationFrame = window.requestAnimationFrame(() => {
          secondAnimationFrame = window.requestAnimationFrame(() => {
            try {
              restoreBackground();
            } catch {
              // The workaround must never interfere with the diagram.
            }
          });
        });
      } catch {
        restoreBackground();
        // The workaround must never interfere with the diagram.
      }
    };

    const observeViewport = () => {
      try {
        const svg = findSprottySvg();
        const viewport = svg?.querySelector<SVGGElement>(":scope > g");
        if (!svg || !viewport || (svg === observedSvg && viewport === observedViewport)) return;

        viewportObserver?.disconnect();
        cancelScheduledRepaint();
        observedSvg = svg;
        observedViewport = viewport;
        lastScale = /^scale\(([^)]+)\)/.exec(viewport.getAttribute("transform") ?? "")?.[1];

        viewportObserver = new MutationObserver(() => {
          try {
            const transform = viewport.getAttribute("transform") ?? "";
            const scale = /^scale\(([^)]+)\)/.exec(transform)?.[1];

            // Ignore initial rendering and pan-only viewport changes.
            if (!scale || lastScale === undefined) {
              lastScale = scale;
              return;
            }
            if (scale === lastScale) return;

            lastScale = scale;
            cancelScheduledRepaint();
            repaintTimeout = window.setTimeout(() => {
              repaintTimeout = undefined;
              repaint();
            }, firefoxSvgZoomRepaintDelayMs);
          } catch {
            // The workaround must never interfere with the diagram.
          }
        });
        viewportObserver.observe(viewport, { attributes: true, attributeFilter: ["transform"] });
        // The viewport is now present and observed directly. Stop watching
        // Sprotty's normal child rendering work.
        svgObserver?.disconnect();
      } catch {
        // The workaround must never interfere with the diagram.
      }
    };

    svgObserver = new MutationObserver(() => observeViewport());
    svgObserver.observe(mount, { childList: true, subtree: true });
    observeViewport();

    const retryViewportSearch = () => {
      if (disposed || observedViewport) return;

      viewportSearchAttempts += 1;
      observeViewport();
      if (observedViewport) {
        return;
      }
      if (viewportSearchAttempts < 40) {
        viewportSearchTimeout = window.setTimeout(retryViewportSearch, 250);
      }
    };
    viewportSearchTimeout = window.setTimeout(retryViewportSearch, 250);

    return () => {
      disposed = true;
      svgObserver?.disconnect();
      viewportObserver?.disconnect();
      window.clearTimeout(viewportSearchTimeout);
      cancelScheduledRepaint();
    };
  } catch {
    return () => {};
  }
}

/**
 * Renders a KLighD model, optionally collecting the embed interaction session.
 */
export function KlighdDiagram({
  source,
  websocketUrl,
  replay,
  renderOptions,
  instrumentation: shouldInstrument = false,
  stimulusId,
  externalParticipantId,
  externalSessionId,
  showSidebar: showSidebar = false,
  showFitToScreenAction = true,
  disableSearchShortcut = false,
  containerId = defaultContainerId,
}: KlighdDiagramProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const actionDispatcherRef = useRef<IActionDispatcher | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const preventSearchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    if (disableSearchShortcut) {
      window.addEventListener("keydown", preventSearchShortcut, { capture: true });
    }

    let disposed = false;
    let disposeFirefoxSvgZoomRepaint = () => {};
    let instrumentation: Awaited<ReturnType<typeof initialise>> | undefined;
    const connection = replay
      ? new ReplayKlighdConnection(replay)
      : new JsonRpcKlighdConnection(new BrowserTransport(), {
          colorThemeKind: ColorThemeKind.LIGHT,
        });

    async function initialize(): Promise<void> {
      try {
        if (shouldInstrument) {
          if (!stimulusId) {
            throw new Error("Instrumented diagrams require a stimulus identifier.");
          }

          instrumentation = await initialise({
            apiBaseUrl: window.location.origin,
            stimulusId,
            externalParticipantId,
            externalSessionId,
            rrweb: {
              blockSelector: "nextjs-portal",
            },
          });
        }

        if (disposed) {
          await instrumentation?.dispose();
          return;
        }

        if (!replay && (!source || !websocketUrl)) {
          throw new Error("Live KLighD diagrams require a model source and WebSocket URL.");
        }

        await connection.connect(websocketUrl ?? "");
        if (disposed) {
          return;
        }

        const persistedRenderOptions: DiagramRenderOptions = {
          ...(renderOptions ?? {}),
          ...(!showSidebar ? { "pin-sidebar": false } : {}),
        };
        const persistenceStorage = new InMemoryPersistenceStorage({
          render: persistedRenderOptions,
        });
        const container = createKlighdDiagramContainer(containerId);
        if (instrumentation) {
          container.load(instrumentation.module);
        }

        bindServices(container, {
          connection,
          sessionStorage: window.sessionStorage,
          persistenceStorage,
        });
        if (mount) {
          disposeFirefoxSvgZoomRepaint = installFirefoxSvgZoomRepaint(mount);
        }

        await connection.initialize(persistenceStorage.getAllData());
        if (disposed) {
          return;
        }

        if (!replay && source) {
          connection.openDocument(source.sourceUri, source.text);
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          if (disposed) {
            return;
          }
        }

        const actionDispatcher = getActionDispatcher(container);
        actionDispatcherRef.current = actionDispatcher;
        if (!showSidebar) {
          await actionDispatcher.dispatch(
            SetUIExtensionVisibilityAction.create({ extensionId: "sidebar", visible: false }),
          );
        }

        const sourceUri = replay?.sourceUri ?? source?.sourceUri;
        if (!sourceUri) {
          throw new Error("KLighD diagrams require a source URI.");
        }
        await requestModel(actionDispatcher, sourceUri);
      } catch (error) {
        await instrumentation?.dispose();
        if (!disposed) {
          console.error("KLighD initialization failed", error);
        }
      }
    }

    void initialize();

    return () => {
      disposed = true;
      if (disableSearchShortcut) {
        window.removeEventListener("keydown", preventSearchShortcut, { capture: true });
      }
      void instrumentation?.dispose();
      disposeFirefoxSvgZoomRepaint();
      actionDispatcherRef.current = null;
      connection.close();
      mount.replaceChildren();
    };
  }, [
    containerId,
    stimulusId,
    externalParticipantId,
    externalSessionId,
    disableSearchShortcut,
    renderOptions,
    replay,
    shouldInstrument,
    showSidebar,
    source,
    websocketUrl,
  ]);

  const fitToScreen = () => {
    void actionDispatcherRef.current?.dispatch(KlighdFitToScreenAction.create(true));
  };

  return (
    <Box
      sx={{ width: "100%", height: "100%", minHeight: 0, position: "relative" }}
    >
      <Box
        id={containerId}
        ref={mountRef}
        style={{ width: "100%", height: "100%" }}
        sx={{
          minHeight: 0,
          ...(!showSidebar && {
            "--sidebar-width": "0px",
            "& .sidebar": { display: "none" },
          }),
        }}
      />
      {showFitToScreenAction && (
        <Tooltip title="Fit diagram to screen">
          <IconButton
            aria-label="Fit diagram to screen"
            onClick={(event) => {
              event.stopPropagation();
              fitToScreen();
            }}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 1,
              width: 40,
              height: 40,
              border: 1,
              borderColor: "rgba(0, 0, 0, 0.2)",
              bgcolor: "rgba(255, 255, 255, 0.8)",
              "&:hover, &:focus-visible": {
                bgcolor: "background.paper",
                borderColor: "rgba(0, 0, 0, 0.4)",
              },
            }}
          >
            <FitScreenIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
