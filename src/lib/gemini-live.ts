/*
 * Minimal Gemini Live client over raw WebSocket (no SDK — keeps the page light).
 * The Cloudflare Worker mints a single-use ephemeral token whose
 * live_connect_constraints pin the model + system prompt server-side; the
 * client only echoes the model in setup and streams audio both ways.
 *
 * Audio in: mic → ScriptProcessor → downsample to 16 kHz PCM16 → base64 chunks.
 * Audio out: 24 kHz PCM16 chunks → scheduled AudioBufferSource chain.
 */

export interface LiveCallbacks {
  onPhase: (p: 'connecting' | 'listening' | 'thinking' | 'speaking') => void;
  onLevel?: never;
  onTranscript: (role: 'user' | 'model', text: string) => void;
  onClose: (reason: string) => void;
}

export interface LiveHandle {
  stop: () => void;
  getLevel: () => number;
}

interface TokenResponse {
  token: string;
  model: string;
}

const WS_HOST = 'wss://generativelanguage.googleapis.com';
const WS_PATH = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

export async function startLiveSession(
  workerUrl: string,
  locale: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  cb: LiveCallbacks,
): Promise<LiveHandle> {
  cb.onPhase('connecting');

  const tokenRes = await fetch(`${workerUrl.replace(/\/$/, '')}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ locale }),
  });
  if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
  const { token, model } = (await tokenRes.json()) as TokenResponse;

  // --- audio graph -------------------------------------------------------
  const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
  const inCtx = new AudioCtx();
  const outCtx = new AudioCtx({ sampleRate: 24000 });
  const analyser = outCtx.createAnalyser();
  analyser.fftSize = 512;
  analyser.connect(outCtx.destination);
  const analyserBuf = new Uint8Array(analyser.frequencyBinCount);

  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  const source = inCtx.createMediaStreamSource(mic);
  const micAnalyser = inCtx.createAnalyser();
  micAnalyser.fftSize = 512;
  source.connect(micAnalyser);
  const micBuf = new Uint8Array(micAnalyser.frequencyBinCount);
  const proc = inCtx.createScriptProcessor(4096, 1, 1);
  const mute = inCtx.createGain();
  mute.gain.value = 0;
  source.connect(proc);
  proc.connect(mute);
  mute.connect(inCtx.destination);

  let ws: WebSocket | null = null;
  let closed = false;
  let speaking = false;
  let playhead = 0;

  const level = () => {
    const a = speaking ? analyser : micAnalyser;
    const buf = speaking ? analyserBuf : micBuf;
    a.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i]! - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  };

  const cleanup = (reason: string) => {
    if (closed) return;
    closed = true;
    try {
      proc.disconnect();
      source.disconnect();
      mic.getTracks().forEach((t) => t.stop());
    } catch {}
    void inCtx.close().catch(() => {});
    void outCtx.close().catch(() => {});
    try {
      ws?.close();
    } catch {}
    cb.onClose(reason);
  };

  // --- websocket ---------------------------------------------------------
  ws = new WebSocket(`${WS_HOST}${WS_PATH}?key=${encodeURIComponent(token)}`);

  ws.onopen = () => {
    ws!.send(JSON.stringify({ setup: { model } }));
  };

  ws.onmessage = async (ev) => {
    const data =
      typeof ev.data === 'string' ? ev.data : await (ev.data as Blob).text();
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if (msg.setupComplete) {
      // Session memory across reconnects: replay the previous transcript as
      // context, then start listening.
      if (history.length > 0) {
        ws!.send(
          JSON.stringify({
            clientContent: {
              turns: history.map((h) => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }],
              })),
              turnComplete: false,
            },
          }),
        );
      }
      cb.onPhase('listening');
      proc.onaudioprocess = (e) => {
        if (closed || ws?.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm = downsampleTo16k(input, inCtx.sampleRate);
        if (pcm.length === 0) return;
        ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: { mimeType: 'audio/pcm;rate=16000', data: b64FromInt16(pcm) },
            },
          }),
        );
      };
      return;
    }

    const sc = msg.serverContent;
    if (!sc) return;

    if (sc.interrupted) {
      speaking = false;
      playhead = outCtx.currentTime;
      cb.onPhase('listening');
      return;
    }

    if (sc.inputTranscription?.text) cb.onTranscript('user', sc.inputTranscription.text);
    if (sc.outputTranscription?.text) cb.onTranscript('model', sc.outputTranscription.text);

    const parts = sc.modelTurn?.parts ?? [];
    for (const p of parts) {
      const b64 = p.inlineData?.data;
      if (!b64) continue;
      speaking = true;
      cb.onPhase('speaking');
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const view = new DataView(bytes.buffer);
      const n = bytes.byteLength >> 1;
      const buf = outCtx.createBuffer(1, Math.max(n, 1), 24000);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = view.getInt16(i * 2, true) / 32768;
      const src = outCtx.createBufferSource();
      src.buffer = buf;
      src.connect(analyser);
      const at = Math.max(outCtx.currentTime + 0.04, playhead);
      src.start(at);
      playhead = at + buf.duration;
    }

    if (sc.turnComplete) {
      const wait = Math.max(0, (playhead - outCtx.currentTime) * 1000) + 120;
      setTimeout(() => {
        if (closed) return;
        speaking = false;
        cb.onPhase('listening');
      }, wait);
    }
  };

  ws.onerror = () => cleanup('error');
  ws.onclose = (e) => cleanup(e.reason || 'closed');

  return {
    stop: () => cleanup('stopped'),
    getLevel: level,
  };
}

function downsampleTo16k(input: Float32Array, fromRate: number): Int16Array {
  const ratio = fromRate / 16000;
  const n = Math.floor(input.length / ratio);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const v = input[Math.floor(i * ratio)]!;
    out[i] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
  }
  return out;
}

function b64FromInt16(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
