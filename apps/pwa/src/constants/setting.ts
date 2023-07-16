import { Language } from '#/constants';

export interface Setting {
  serverOrigin?: string;
  playerVolume: number;
  language: Language;
}
