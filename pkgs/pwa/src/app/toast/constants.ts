import { TOAST_TYPE } from '../../platform/toast';

export interface Toast {
  id: string;
  hidden: boolean;
  timer: ReturnType<typeof setTimeout>;
  height: number;
  top: number;
  message: string;
  type: TOAST_TYPE;
  duration: number;
}

export const TOAST_ANIMATION_DURATION = 300;
