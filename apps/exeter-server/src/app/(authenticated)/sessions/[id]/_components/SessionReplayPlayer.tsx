"use client";

import { getSessionRrwebEventsPath } from "@/routes";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import type RrwebPlayer from "rrweb-player";
import { useEffect, useRef, useState } from "react";

type RrwebEvents = ConstructorParameters<typeof RrwebPlayer>[0]["props"]["events"];

interface PlayerInstance {
  $destroy(): void;
  $set(properties: { width: number; height: number }): void;
}

interface PlayerDimensions {
  width: number;
  height: number;
}

const PLAYER_ASPECT_RATIO = 16 / 9;

/**
 * Loads and renders the rrweb recording for one session in the browser.
 */
export function SessionReplayPlayer({ sessionId }: { sessionId: string }) {
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let player: PlayerInstance | undefined;
    let resizeObserver: ResizeObserver | undefined;

    async function loadPlayer(): Promise<void> {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const events = await fetchEvents(sessionId);

        if (cancelled) {
          return;
        }

        if (events.length === 0) {
          setErrorMessage("No rrweb events were recorded for this session.");
          return;
        }

        const target = playerContainerRef.current;

        if (!target) {
          throw new Error("Missing replay target element.");
        }

        resizeObserver = new ResizeObserver(() => {
          if (player) {
            resizePlayer(player, target);
          }
        });
        resizeObserver.observe(target);

        target.replaceChildren();
        const { default: RrwebPlayer } = await import("rrweb-player");

        if (cancelled) {
          return;
        }

        player = new RrwebPlayer({
          target,
          props: {
            events,
            showWarning: false,
            ...playerDimensions(target),
          },
        }) as unknown as PlayerInstance;
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPlayer();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      player?.$destroy();
    };
  }, [sessionId]);

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      {errorMessage ? (
        <Alert severity="error">{errorMessage}</Alert>
      ) : null}
      {isLoading ? <LoadingIndicator /> : null}
      <Box
        ref={playerContainerRef}
        sx={{ width: "100%", overflow: "auto", visibility: isLoading ? "hidden" : "visible", display: errorMessage ? "none" : "block" }}
      />
    </Paper>
  );
}

function playerDimensions(container: HTMLElement): PlayerDimensions {
  const width = Math.floor(container.clientWidth);

  return {
    width,
    height: Math.round(width / PLAYER_ASPECT_RATIO),
  };
}

function resizePlayer(player: PlayerInstance, container: HTMLElement): void {
  player.$set(playerDimensions(container));
}

async function fetchEvents(sessionId: string): Promise<RrwebEvents> {
  const response = await fetch(getSessionRrwebEventsPath(sessionId), {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: unknown };
    const message = typeof body.error === "string" ? body.error : response.statusText;
    throw new Error(`Could not load replay events: ${response.status} ${message}`);
  }

  return (await response.json()) as RrwebEvents;
}

/**
 * Renders the loading state while rrweb events and the player bundle are loaded.
 */
function LoadingIndicator() {
  return (
    <Box sx={{ display: "flex", minHeight: 384, alignItems: "center", justifyContent: "center" }}>
      <CircularProgress aria-label="Loading replay" />
    </Box>
  );
}
