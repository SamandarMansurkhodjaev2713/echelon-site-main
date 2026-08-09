/*
 * Live-sphere backend. Empty string = the talk button stays hidden and the
 * sphere works as a visual with the recorded voice. After deploying the
 * Cloudflare Worker (see worker/README.md) put its URL here and rebuild.
 */
export const VOICE_WORKER_URL = '';

/* Hard cap for one live conversation, seconds (client-side). */
export const VOICE_SESSION_MAX_S = 240;
