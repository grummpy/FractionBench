export type AudioSettings = {
  music: boolean;
  sfx: boolean;
  speech: boolean;
};

export const defaultAudioSettings: AudioSettings = {
  music: false,
  sfx: false,
  speech: false,
};
