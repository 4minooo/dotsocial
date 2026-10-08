// Original procedural audio: no downloads, licensed samples, paid APIs or storage.
export type SoundMap = "park" | "rooftop" | "office" | "cafe" | "beach";
export type Cue = "win" | "lose";
export function makeAmbience(context: BaseAudioContext, map: SoundMap) {
  const length = 24,
    rate = context.sampleRate;
  const buffer = context.createBuffer(2, length * rate, rate);
  const left = buffer.getChannelData(0),
    right = buffer.getChannelData(1);
  let brown = 0,
    smooth = 0;
  for (let i = 0; i < left.length; i++) {
    const t = i / rate,
      noise = Math.random() * 2 - 1;
    brown = (brown + noise * 0.025) / 1.025;
    smooth += (noise - smooth) * 0.14;
    const swell =
      0.35 + 0.65 * Math.pow((1 - Math.cos((t * Math.PI) / 4)) / 2, 2);
    let v =
      map === "beach"
        ? smooth * swell * 0.5 + brown * 0.25
        : map === "rooftop"
          ? brown * 0.5 +
            smooth * (0.08 + 0.14 * Math.pow(Math.sin(t * 0.45), 8))
          : brown * 0.1;
    if (map === "office") v += Math.sin(t * 2 * Math.PI * 110) * 0.004;
    left[i] = v;
    right[i] = v * 0.95 + noise * 0.002;
  }
  const tone = (
    at: number,
    duration: number,
    frequency: number,
    volume: number,
    pan = 0,
    glide = 0,
  ) => {
    const start = Math.floor(at * rate),
      end = Math.min(left.length, start + Math.floor(duration * rate));
    let phase = 0;
    for (let i = start; i < end; i++) {
      const t = (i - start) / rate,
        envelope = Math.min(1, t / 0.015) * Math.pow(1 - t / duration, 2);
      phase += (2 * Math.PI * (frequency + (glide * t) / duration)) / rate;
      const value =
        (Math.sin(phase) + 0.18 * Math.sin(phase * 2)) * envelope * volume;
      left[i] += value * (1 - pan * 0.4);
      right[i] += value * (1 + pan * 0.4);
    }
  };
  const tap = (at: number, duration: number, volume: number) => {
    const start = Math.floor(at * rate);
    for (let i = 0; i < duration * rate && start + i < left.length; i++) {
      const v =
        (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.012)) * volume;
      left[start + i] += v;
      right[start + i] += v * 0.75;
    }
  };
  if (map === "park")
    for (let at = 0.5; at < 23; at += 1.8 + Math.random() * 1.9) {
      const pan = Math.random() * 2 - 1;
      for (let n = 0; n < 3; n++)
        tone(at + n * 0.17, 0.11, 2600 + Math.random() * 1100, 0.035, pan, 800);
    }
  if (map === "rooftop")
    for (let at = 1; at < 22; at += 5) {
      // Distant traffic: a low motor glides past and fades into the city wash.
      for (let i = 0; i < rate * 3; i++) {
        const t = i / rate,
          idx = Math.floor(at * rate) + i;
        const v =
          Math.sin(2 * Math.PI * (95 * t - 5 * t * t)) *
          Math.sin((Math.PI * t) / 3) ** 2 *
          0.025;
        left[idx] += v * (1 - t / 4);
        right[idx] += v * (0.25 + t / 4);
      }
    }
  if (map === "office") {
    for (let at = 0.3; at < 23.5; at += 0.1 + Math.random() * 0.35)
      tap(at, 0.06, 0.05 + Math.random() * 0.04);
    for (const at of [5, 16]) {
      tone(at, 0.35, 620, 0.012, -0.6);
      tone(at + 0.48, 0.35, 740, 0.01, -0.6);
    }
    for (const at of [3, 12, 20]) tap(at, 0.15, 0.09);
  }
  if (map === "cafe") {
    const chords = [
      [261.63, 329.63, 392],
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [196, 246.94, 293.66],
    ];
    for (let bar = 0; bar < 8; bar++)
      for (let n = 0; n < 3; n++)
        tone(bar * 3 + n * 0.68, 2.1, chords[bar % 4][n], 0.018, (n - 1) * 0.3);
    for (const at of [4, 13, 21]) {
      tap(at, 0.045, 0.045);
      tone(at, 0.18, 1800, 0.003, 0.5);
    }
  }
  // Smooth the loop seam, including noise and room tone.
  for (let i = 0; i < rate * 0.06; i++) {
    const gain = i / (rate * 0.06);
    left[i] *= gain;
    right[i] *= gain;
    left[left.length - 1 - i] *= gain;
    right[right.length - 1 - i] *= gain;
  }
  return buffer;
}
class SoundEngine {
  private playedResults = new Set<string>();
  result(id: string, kind: Cue) {
    if (this.playedResults.has(id)) return;
    this.playedResults.add(id);
    if (this.playedResults.size > 64)
      this.playedResults.delete(this.playedResults.values().next().value!);
    this.cue(kind);
  }
  context: AudioContext | null = null;
  enabled = true;
  map: SoundMap | null = null;
  private source: AudioBufferSourceNode | null = null;
  private ambience: GainNode | null = null;
  private playingMap: SoundMap | null = null;
  private hidden = false;
  private output: GainNode | null = null;
  async unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (!this.output) {
        this.output = this.context.createGain();
        this.output.gain.value = this.hidden ? 0 : 1;
        this.output.connect(this.context.destination);
      }
      await this.context.resume();
      this.refresh();
    } catch {
      /* Audio support is optional; gameplay remains available. */
    }
  }
  configure(map: SoundMap | null, enabled: boolean, hidden = false) {
    this.map = map;
    this.enabled = enabled;
    this.hidden = hidden;
    this.refresh();
  }
  private stop() {
    const c = this.context,
      source = this.source,
      gain = this.ambience;
    if (c && source && gain) {
      gain.gain.cancelScheduledValues(c.currentTime);
      gain.gain.setTargetAtTime(0, c.currentTime, 0.12);
      source.stop(c.currentTime + 0.65);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
    }
    this.source = null;
    this.ambience = null;
    this.playingMap = null;
  }
  private refresh() {
    const c = this.context;
    if (c && this.output)
      this.output.gain.setTargetAtTime(
        this.enabled && !this.hidden ? 1 : 0,
        c.currentTime,
        0.025,
      );
    if (!c || c.state !== "running") return;
    if (!this.enabled || this.hidden || !this.map) {
      this.stop();
      return;
    }
    if (this.playingMap === this.map) return;
    this.stop();
    const source = c.createBufferSource(),
      gain = c.createGain();
    source.buffer = makeAmbience(c, this.map);
    source.loop = true;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.38, c.currentTime, 0.25);
    source.connect(gain);
    gain.connect(this.output!);
    source.start();
    this.source = source;
    this.ambience = gain;
    this.playingMap = this.map;
  }
  cue(kind: Cue) {
    const c = this.context;
    if (!this.enabled || this.hidden || !c || c.state !== "running") return;
    const notes =
      kind === "win" ? [523.25, 659.25, 783.99, 1046.5] : [392, 329.63, 261.63];
    notes.forEach((frequency, n) => {
      const oscillator = c.createOscillator(),
        gain = c.createGain(),
        start = c.currentTime + n * 0.13;
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.075, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
      oscillator.connect(gain);
      gain.connect(this.output!);
      oscillator.start(start);
      oscillator.stop(start + 0.5);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }
}
export const sound = new SoundEngine();
