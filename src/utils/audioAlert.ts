// Web Audio API Sound Generator for Restaurant KDS & Kitchen Order Alerts
// Uses synthesis to ensure instant, reliable chime playback without external audio asset dependencies.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Ensures the Web Audio context is active on any user gesture.
 */
export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn('Audio unlock error:', e);
  }
}

/**
 * Plays a resonant, crisp Neapolitan kitchen order chime bell (two-stage harmonic chime).
 * @param volume Volume multiplier from 0.1 to 1.0 (default 0.9)
 */
export function playNewOrderSound(volume: number = 0.9): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0.05, Math.min(1.0, volume)), now);
      masterGain.connect(ctx.destination);

      // --- Chime 1: High crisp bell note (E6 / 1318.5 Hz) ---
      createBellTone(ctx, masterGain, 1318.5, now, 0.45);
      createBellTone(ctx, masterGain, 2637, now, 0.25); // 1st harmonic overtone

      // --- Chime 2: Resonant primary kitchen bell (A5 / 880 Hz) at +0.12s ---
      createBellTone(ctx, masterGain, 880, now + 0.12, 0.65);
      createBellTone(ctx, masterGain, 1760, now + 0.12, 0.35);

      // --- Chime 3: Confirming high tone (C#6 / 1108.7 Hz) at +0.35s ---
      createBellTone(ctx, masterGain, 1108.7, now + 0.35, 0.7);
      createBellTone(ctx, masterGain, 2217.4, now + 0.35, 0.35);

      // --- Chime 4: Grand finale bell (E6 / 1318.5 Hz) at +0.55s ---
      createBellTone(ctx, masterGain, 1318.5, now + 0.55, 0.9);
      createBellTone(ctx, masterGain, 2637, now + 0.55, 0.45);

      setTimeout(() => {
        resolve();
      }, 1400);
    } catch (err) {
      console.warn('Could not play order chime:', err);
      resolve();
    }
  });
}

/**
 * Creates an individual resonant bell overtone with smooth envelope.
 */
function createBellTone(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  startTime: number,
  decayDuration: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  // Attack: near instant (3ms) to avoid clicks and give crisp strike
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.5, startTime + 0.004);

  // Decay: exponential ring-out
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decayDuration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + decayDuration);
}

/**
 * Optional voice synthesis announcing the order number.
 */
export function announceNewOrder(orderId: string, customerName?: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const text = customerName 
      ? `Atenção: Novo pedido recebido de ${customerName}.`
      : `Novo pedido recebido: ${orderId.replace('ORD-', '')}.`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis optional fallback
  }
}
