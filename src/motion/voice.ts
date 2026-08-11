/*
 * Voice console.
 *
 * This module owns the audio; motion/core.ts owns the drawing. The split matters
 * because the core's whole claim is that its shape *is* the sound — so it pulls
 * live amplitude and spectrum from whatever is actually playing here rather than
 * being handed a pre-baked animation.
 *
 * Two sources, one interface:
 *   - the recorded product voice (RU/EN mp3)
 *   - the live Gemini session, dormant until a worker URL is configured
 *
 * Both feed `getLevel` and `getSpectrum`. When WebAudio is unavailable or an
 * autoplay policy blocks the context, the audio still plays and both fall back
 * to a steady trace: the section degrades to the tape it was before, rather than
 * to a dead canvas.
 *
 * The tape draws ~90 ticks of rolling level history and stays underneath the
 * core — it is the history of the voice where the core is its present shape, and
 * it is the part that survives with no analyser at all.
 */

import { register, raf, listen } from './lifecycle';
import { prefersReducedMotion } from './media';
import { VOICE_WORKER_URL, VOICE_SESSION_MAX_S } from '../lib/config';
import { initCore, CORE_BANDS, type CorePhase, type CoreEntity } from './core';

const TICKS = 90;

/**
 * Bucket an analyser's bins into the core's bands.
 *
 * Only the bottom of the spectrum is used. At a 48 kHz context the upper half of
 * the bins is above ~12 kHz, which for speech is silence — spreading the bands
 * over the whole range would leave most of the sphere permanently still and make
 * the core look broken rather than quiet.
 */
function fillBands(analyser: AnalyserNode, bins: Uint8Array, out: Float32Array): void {
  analyser.getByteFrequencyData(bins as Uint8Array<ArrayBuffer>);
  const used = Math.max(CORE_BANDS, Math.floor(bins.length * 0.42));
  const per = Math.max(1, Math.floor(used / CORE_BANDS));
  for (let b = 0; b < CORE_BANDS; b++) {
    let sum = 0;
    const start = b * per;
    for (let i = 0; i < per; i++) sum += bins[start + i] ?? 0;
    out[b] = sum / (per * 255);
  }
}

export function initVoice(): () => void {
  const root = document.querySelector<HTMLElement>('[data-voice]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-voice-wave]');
  if (!root || !canvas) return () => {};

  const playBtn = root.querySelector<HTMLButtonElement>('[data-voice-play]');
  const playLabel = root.querySelector<HTMLElement>('[data-voice-play-label]');
  const talkBtn = root.querySelector<HTMLButtonElement>('[data-voice-talk]');
  const stopBtn = root.querySelector<HTMLButtonElement>('[data-voice-stop]');
  const stateEl = root.querySelector<HTMLElement>('[data-voice-state]');
  const msg = (k: string) => root.dataset[k] ?? '';

  /* The phase drives both the status line and the core's posture, so they can
     never describe different things at the same moment. */
  let phase: CorePhase = 'idle';
  const setState = (text: string, next: CorePhase = 'idle') => {
    phase = next;
    if (stateEl) stateEl.textContent = text;
  };

  /* ---------- the tape ---------- */
  const ctx = canvas.getContext('2d');
  const history = new Float32Array(TICKS);
  let level = 0;
  let getLevel: () => number = () => 0;
  /** Fills `out` with CORE_BANDS energies, low → high. Silent by default. */
  let getSpectrum: (out: Float32Array) => void = (out) => out.fill(0);
  let dpr = 1;
  let w = 0;
  let h = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  register(() => ro.disconnect());

  const ink = () =>
    getComputedStyle(root).getPropertyValue('--ink').trim() || '#15140f';
  const signal = () =>
    getComputedStyle(root).getPropertyValue('--signal').trim() || '#b0341a';

  let shift = 0;
  const draw = () => {
    if (!ctx || !w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const mid = h / 2;
    const step = w / TICKS;
    const active = level > 0.012;
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';

    for (let i = 0; i < TICKS; i++) {
      const v = history[(i + shift) % TICKS] ?? 0;
      const amp = Math.max(0.5, v * (h * 0.42));
      const x = Math.round(i * step) + 0.5;
      // the leading edge is the owner's colour; the trace behind it is ink
      ctx.strokeStyle = i > TICKS - 4 && active ? signal() : ink();
      ctx.globalAlpha = 0.18 + (v > 0 ? 0.6 * Math.min(1, v * 2.2) : 0);
      ctx.beginPath();
      ctx.moveTo(x, mid - amp);
      ctx.lineTo(x, mid + amp);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- the core ----------
     Given the same two pull functions the tape uses, so the drawn sphere and the
     drawn tape are always describing the same audio. */
  const coreCanvas = root.querySelector<HTMLCanvasElement>('[data-voice-core]');
  if (coreCanvas) {
    let entities: CoreEntity[] = [];
    try {
      const parsed: unknown = JSON.parse(root.dataset.entities ?? '[]');
      if (Array.isArray(parsed)) entities = parsed as CoreEntity[];
    } catch {
      /* a malformed list must not take the whole section down */
    }
    initCore(
      coreCanvas,
      {
        level: () => getLevel(),
        spectrum: (out) => getSpectrum(out),
        phase: () => phase,
      },
      entities,
    );
  }

  const reduced = prefersReducedMotion();
  if (reduced) {
    draw();
  } else {
    let acc = 0;
    raf(canvas, (_now, dt) => {
      acc += dt;
      // ~24 columns/second: a tape speed, not a frame rate
      if (acc >= 1 / 24) {
        acc = 0;
        const raw = Math.min(1, getLevel());
        level += (raw - level) * (raw > level ? 0.55 : 0.14);
        history[shift % TICKS] = level;
        shift = (shift + 1) % TICKS;
      }
      draw();
    });
  }

  /* ---------- recorded playback ---------- */
  let audio: HTMLAudioElement | null = null;
  let actx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let buf: Uint8Array<ArrayBuffer> | null = null;
  let bins: Uint8Array<ArrayBuffer> | null = null;

  const stopPlayback = () => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    getLevel = () => 0;
    getSpectrum = (out) => out.fill(0);
    if (playLabel) playLabel.textContent = root.dataset.labelPlay ?? '';
    /* The button's meaning is carried by `data-cursor`, not inferred from its
       text, because the contextual cursor reads exactly that attribute. Leaving
       it on 'speak' while the control had become a stop button made the cursor
       announce "Слушать" over a button that would halt playback. */
    if (playBtn) playBtn.dataset.cursor = 'speak';
    setState(msg('msgIdle'));
  };

  const onPlay = () => {
    if (audio && !audio.paused) {
      stopPlayback();
      return;
    }
    if (!audio) {
      audio = new Audio(root.dataset.recording ?? '');
      audio.crossOrigin = 'anonymous';
      audio.preload = 'none';
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        actx = new AC();
        const src = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser();
        analyser.fftSize = 512;
        buf = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        bins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        src.connect(analyser);
        analyser.connect(actx.destination);
      } catch {
        // No WebAudio (or an autoplay policy blocked the context): the audio
        // still plays, the tape shows a steady trace, and the core breathes on
        // amplitude alone instead of going dead.
        analyser = null;
      }
      audio.addEventListener('ended', stopPlayback);
      audio.addEventListener('error', () => setState(msg('msgError')));
    }
    void actx?.resume();
    getLevel = () => {
      if (!audio || audio.paused) return 0;
      if (!analyser || !buf) return 0.35;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const x = (buf[i]! - 128) / 128;
        sum += x * x;
      }
      return Math.min(1, Math.sqrt(sum / buf.length) * 2.6);
    };
    getSpectrum = (out) => {
      if (!audio || audio.paused) return out.fill(0);
      if (!analyser || !bins) return out.fill(0.3);
      fillBands(analyser, bins, out);
    };
    if (playLabel) playLabel.textContent = root.dataset.labelStop ?? '';
    if (playBtn) playBtn.dataset.cursor = 'stop';
    setState(msg('msgSpeaking'), 'speaking');
    void audio.play().catch(() => setState(msg('msgError')));
  };

  if (playBtn) listen(playBtn, 'click', onPlay);
  register(stopPlayback);

  /* ---------- live session (dormant until a worker URL is configured) ---------- */
  if (!VOICE_WORKER_URL || !navigator.mediaDevices?.getUserMedia) {
    return () => {};
  }

  talkBtn?.removeAttribute('hidden');
  const transcript: Array<{ role: 'user' | 'model'; text: string }> = [];
  let live: Awaited<ReturnType<typeof import('../lib/gemini-live').startLiveSession>> | null = null;
  let killTimer = 0;

  const endLive = () => {
    window.clearTimeout(killTimer);
    live?.stop();
    live = null;
    getLevel = () => 0;
    getSpectrum = (out) => out.fill(0);
    talkBtn?.removeAttribute('hidden');
    playBtn?.removeAttribute('hidden');
    stopBtn?.setAttribute('hidden', '');
    setState(msg('msgIdle'));
  };

  const startLive = async () => {
    talkBtn?.setAttribute('hidden', '');
    playBtn?.setAttribute('hidden', '');
    stopBtn?.removeAttribute('hidden');
    setState(msg('msgConnecting'), 'thinking');
    stopPlayback();
    try {
      const { startLiveSession } = await import('../lib/gemini-live');
      let userLine = '';
      let modelLine = '';
      live = await startLiveSession(
        VOICE_WORKER_URL,
        root.dataset.locale ?? 'ru',
        transcript.slice(-20),
        {
          onPhase: (p) => {
            if (p === 'connecting') setState(msg('msgConnecting'), 'thinking');
            if (p === 'listening') setState(msg('msgListening'), 'listening');
            if (p === 'thinking') setState(msg('msgThinking'), 'thinking');
            if (p === 'speaking') setState(msg('msgSpeaking'), 'speaking');
          },
          onTranscript: (role, text) => {
            if (role === 'user') {
              userLine += text;
              if (modelLine) {
                transcript.push({ role: 'model', text: modelLine });
                modelLine = '';
              }
            } else {
              modelLine += text;
              if (userLine) {
                transcript.push({ role: 'user', text: userLine });
                userLine = '';
              }
            }
          },
          onClose: (reason) => {
            if (modelLine) transcript.push({ role: 'model', text: modelLine });
            if (userLine) transcript.push({ role: 'user', text: userLine });
            if (reason === 'error') setState(msg('msgError'));
            endLive();
          },
        },
      );
      getLevel = () => Math.min(1, (live?.getLevel() ?? 0) * 2.6);
      // The live path reports amplitude, not spectrum. The core therefore
      // breathes as a whole instead of resolving bands — a truthful degradation
      // rather than a fabricated equaliser.
      getSpectrum = (out) => out.fill(Math.min(1, (live?.getLevel() ?? 0) * 2.1));
      killTimer = window.setTimeout(endLive, VOICE_SESSION_MAX_S * 1000);
    } catch (err) {
      setState(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? msg('msgMicDenied')
          : msg('msgError'),
      );
      endLive();
    }
  };

  if (talkBtn) listen(talkBtn, 'click', () => void startLive());
  if (stopBtn) listen(stopBtn, 'click', endLive);

  return register(endLive);
}
