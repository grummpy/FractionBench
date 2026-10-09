import { afterEach, describe, expect, it, vi } from "vitest";

type FakeOscillator = {
  type: OscillatorType;
  frequency: { value: number };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
};

function installAudioMock() {
  const oscillators: FakeOscillator[] = [];
  class FakeAudioContext {
    currentTime = 10;
    destination = {} as AudioDestinationNode;
    resume = vi.fn().mockResolvedValue(undefined);
    createOscillator() {
      const oscillator: FakeOscillator = {
        type: "sine",
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      };
      oscillators.push(oscillator);
      return oscillator as unknown as OscillatorNode;
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      } as unknown as GainNode;
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return oscillators;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("music engine", () => {
  it("stops already-scheduled music immediately while leaving feedback cues alone", async () => {
    vi.useFakeTimers();
    const oscillators = installAudioMock();
    const { playCue, startMusic, stopMusic } = await import("../src/audio/engine");

    startMusic("title");
    const musicCount = oscillators.length;
    expect(musicCount).toBeGreaterThan(0);
    playCue("success");
    expect(oscillators).toHaveLength(musicCount + 3);

    stopMusic();

    for (const oscillator of oscillators.slice(0, musicCount)) {
      expect(oscillator.stop).toHaveBeenLastCalledWith(10);
    }
    for (const oscillator of oscillators.slice(musicCount)) {
      expect(oscillator.stop).not.toHaveBeenCalledWith(10);
    }
  });

  it("silences the previous theme before scheduling a replacement", async () => {
    vi.useFakeTimers();
    const oscillators = installAudioMock();
    const { startMusic } = await import("../src/audio/engine");

    startMusic("title");
    const titleVoices = oscillators.slice();
    startMusic("workshop");

    expect(titleVoices).not.toHaveLength(0);
    for (const oscillator of titleVoices) {
      expect(oscillator.stop).toHaveBeenLastCalledWith(10);
    }
  });
});
