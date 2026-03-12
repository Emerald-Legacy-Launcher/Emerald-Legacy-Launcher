let audioCtx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
const buffers: Record<string, AudioBuffer> = {};

export const ensureAudio = async () => {
  let currentCtx = audioCtx;
  if (!currentCtx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    const newCtx = new AC() as AudioContext;
    const newGain = newCtx.createGain();
    newGain.connect(newCtx.destination);
    audioCtx = newCtx;
    sfxGain = newGain;
    currentCtx = newCtx;

    const sounds = ['click.wav', 'orb.ogg', 'levelup.ogg', 'back.ogg', 'pop.wav', 'wood click.wav'];
    sounds.forEach((s) => {
      fetch(`/sounds/${s}`)
        .then((r) => r.arrayBuffer())
        .then((b) => newCtx.decodeAudioData(b))
        .then((buf) => {
          if (buf) buffers[s] = buf;
        });
    });
  }
  if (currentCtx.state === 'suspended') await currentCtx.resume();
  return { audioCtx, sfxGain, buffers };
};

export const playSfx = async (n: string, sfxVol: number, isMuted: boolean, multiplier: number = 1.0) => {
  const audioData = await ensureAudio();
  if (!audioData) return;
  const { audioCtx, sfxGain, buffers } = audioData;

  if (!audioCtx || !sfxGain || !buffers[n] || isMuted) return;

  const s = audioCtx.createBufferSource();
  s.buffer = buffers[n];
  const g = audioCtx.createGain();
  g.gain.value = sfxVol * multiplier;
  s.connect(g);
  g.connect(audioCtx.destination);
  s.start(0);
};
