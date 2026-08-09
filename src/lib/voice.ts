/*
 * Voice section wiring: the sphere lives in three modes.
 *  ambient  — calm idle sphere (always)
 *  playback — recorded product voice drives the sphere (no backend needed)
 *  live     — real Gemini Live conversation via the Cloudflare Worker;
 *             the talk button only appears when a worker URL is configured.
 * Session memory: transcript kept in JS until page refresh.
 */
import { ConstellationSphere, type SpherePhase } from './sphere';
import { VOICE_WORKER_URL, VOICE_SESSION_MAX_S } from './config';

export function initVoice() {
  const controls = document.querySelector<HTMLElement>('[data-voice-controls]');
  const stage = document.querySelector<HTMLElement>('[data-voice-stage]');
  const canvas = stage?.querySelector('canvas');
  if (!controls || !stage || !canvas) return;

  const talkBtn = controls.querySelector<HTMLButtonElement>('[data-voice-talk]');
  const stopBtn = controls.querySelector<HTMLButtonElement>('[data-voice-stop]');
  const playBtn = controls.querySelector<HTMLButtonElement>('[data-voice-play]');
  const fallback = controls.querySelector<HTMLElement>('[data-voice-fallback]');
  const status = controls.querySelector<HTMLElement>('[data-voice-status]');
  const phases = document.querySelector<HTMLElement>('[data-voice-phases]');
  const locale = controls.dataset.locale ?? 'ru';
  const recordingUrl = controls.dataset.recording ?? '';

  const sphere = new ConstellationSphere(canvas);

  // run only when visible
  const io = new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting) sphere.start();
      else sphere.stop();
    },
    { threshold: 0.05 },
  );
  io.observe(stage);

  const setPhase = (p: SpherePhase, label?: string) => {
    sphere.setPhase(p);
    if (phases) {
      phases.innerHTML = `<span class="on">${label ?? '·'}</span>`;
    }
  };

  const setStatus = (t: string) => {
    if (status) status.textContent = t;
  };

  const i18n = (k: string) => controls.dataset[k] ?? '';

  // --- playback mode -----------------------------------------------------
  let audio: HTMLAudioElement | null = null;
  let playCtx: AudioContext | null = null;
  let playAnalyser: AnalyserNode | null = null;
  let playBuf: Uint8Array | null = null;

  playBtn?.addEventListener('click', () => {
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setPhase('idle');
      return;
    }
    if (!audio) {
      audio = new Audio(recordingUrl);
      audio.crossOrigin = 'anonymous';
      const AC = window.AudioContext ?? (window as any).webkitAudioContext;
      playCtx = new AC();
      const src = playCtx.createMediaElementSource(audio);
      playAnalyser = playCtx.createAnalyser();
      playAnalyser.fftSize = 512;
      playBuf = new Uint8Array(playAnalyser.frequencyBinCount);
      src.connect(playAnalyser);
      playAnalyser.connect(playCtx.destination);
      audio.addEventListener('ended', () => setPhase('idle'));
    }
    void playCtx?.resume();
    sphere.setLevelSource(() => {
      if (!playAnalyser || !playBuf || !audio || audio.paused) return 0;
      playAnalyser.getByteTimeDomainData(playBuf);
      let sum = 0;
      for (let i = 0; i < playBuf.length; i++) {
        const v = (playBuf[i]! - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / playBuf.length);
    });
    setPhase('speaking');
    void audio.play();
  });

  // --- live mode ---------------------------------------------------------
  if (!VOICE_WORKER_URL || !navigator.mediaDevices?.getUserMedia) {
    return; // talk button stays hidden; playback fallback is already visible
  }

  talkBtn?.removeAttribute('hidden');
  const transcript: Array<{ role: 'user' | 'model'; text: string }> = [];
  let live: Awaited<ReturnType<typeof import('./gemini-live').startLiveSession>> | null =
    null;
  let killTimer = 0;

  const endLive = () => {
    window.clearTimeout(killTimer);
    live?.stop();
    live = null;
    talkBtn?.removeAttribute('hidden');
    stopBtn?.setAttribute('hidden', '');
    fallback?.removeAttribute('hidden');
    setPhase('idle');
  };

  talkBtn?.addEventListener('click', async () => {
    talkBtn.setAttribute('hidden', '');
    fallback?.setAttribute('hidden', '');
    stopBtn?.removeAttribute('hidden');
    setStatus(i18n('msgConnecting'));
    // stop any playback
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
    try {
      const { startLiveSession } = await import('./gemini-live');
      let userLine = '';
      let modelLine = '';
      live = await startLiveSession(VOICE_WORKER_URL, locale, transcript.slice(-20), {
        onPhase: (p) => {
          if (p === 'connecting') setPhase('thinking', i18n('msgConnecting'));
          if (p === 'listening') {
            setStatus('');
            setPhase('listening', i18n('msgListening'));
          }
          if (p === 'thinking') setPhase('thinking', i18n('msgThinking'));
          if (p === 'speaking') setPhase('speaking', i18n('msgSpeaking'));
        },
        onTranscript: (role, text) => {
          // accumulate session memory (kept until page refresh)
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
          if (reason === 'error') setStatus(i18n('msgError'));
          endLive();
        },
      });
      sphere.setLevelSource(() => live?.getLevel() ?? 0);
      killTimer = window.setTimeout(() => endLive(), VOICE_SESSION_MAX_S * 1000);
    } catch (err) {
      setStatus(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? i18n('msgMicDenied')
          : i18n('msgError'),
      );
      endLive();
    }
  });

  stopBtn?.addEventListener('click', endLive);
}
