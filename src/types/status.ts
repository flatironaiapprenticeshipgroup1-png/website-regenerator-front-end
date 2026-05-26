/**
 * Interface representing the status of a website regeneration process
 *
 * Tracks progress through different phases (crawler, AI) and provides
 * real-time status updates, error tracking, and result URLs.
 */
export interface RegenerationStatus {
  /** Unique identifier for the regenerated website */
  websiteId: string;

  /** Current phase of regeneration: 'crawler' or 'ai', or null if not started */
  phase: 'crawler' | 'ai' | null;

  /** Current step within the phase */
  step: string | null;

  /** Overall regeneration status */
  status: 'processing' | 'completed' | 'failed' | null;

  /** Sequence number for ordering events */
  sequence: number | null;

  /** Optional message describing current activity */
  message?: string;

  /** Optional publisher/source identifier */
  publisher?: string;

  /** Optional timestamp of last update */
  timestamp?: string;

  /** URL to the final regenerated website result */
  resultUrl: string | null;

  /** Error message if regeneration failed */
  error: string | null;
}
