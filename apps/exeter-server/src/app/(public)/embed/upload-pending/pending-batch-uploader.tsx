"use client";

import { startPendingBatchUploadLoop } from "@kieler/klighd-instrumentation";
import { useEffect } from "react";

/** Starts a registration-free worker that drains persisted instrumentation batches. */
export function PendingBatchUploader() {
  useEffect(() => {
    let disposed = false;
    let uploadLoop: Awaited<ReturnType<typeof startPendingBatchUploadLoop>> | undefined;

    void startPendingBatchUploadLoop({
      apiBaseUrl: window.location.origin,
    }).then(
      (loop) => {
        if (disposed) {
          void loop.dispose();
        } else {
          uploadLoop = loop;
        }
      },
      (error: unknown) => {
        if (!disposed) {
          console.error("Pending instrumentation batch upload failed to start", error);
        }
      },
    );

    return () => {
      disposed = true;
      void uploadLoop?.dispose();
    };
  }, []);

  return null;
}
