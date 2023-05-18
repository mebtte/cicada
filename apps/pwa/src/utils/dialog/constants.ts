import { Variant } from '@/components/button';
import { ReactNode } from 'react';

export enum DialogType {
  ALERT,
  CONFIRM,
  CAPTCHA,
}

export interface Dialog {
  id: string;
  type: DialogType;

  title?: ReactNode;
}

export interface Alert extends Dialog {
  type: DialogType.ALERT;

  content?: ReactNode;
  confirmText?: string;
  onConfirm?: () => void | boolean | Promise<void | boolean>;
}

export interface Confirm extends Omit<Alert, 'type'> {
  type: DialogType.CONFIRM;

  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}

export interface Captcha extends Dialog {
  type: DialogType.CAPTCHA;

  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm: ({
    captchaId,
    captchaValue,
  }: {
    captchaId: string;
    captchaValue: string;
  }) => void | boolean | Promise<void | boolean>;
  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}
