import { PendingBatchUploader } from "./pending-batch-uploader";

/**
 * Hosts the background worker used to deliver IndexedDB batches left by an
 * earlier embedded diagram session.
 */
export default function UploadPendingEventsPage() {
  return <PendingBatchUploader />;
}
