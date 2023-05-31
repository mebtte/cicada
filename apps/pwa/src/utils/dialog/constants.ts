import { Variant } from '@/components/button';
import { ReactNode } from 'react';

export const ID_LENGTH = 6;

export enum DialogType {
  ALERT,
  CONFIRM,
  CAPTCHA,
  TEXT_INPUT,
}

export interface Dialog {
  id: string;
  type: DialogType;
}

export interface Alert extends Dialog {
  type: DialogType.ALERT;

  title?: ReactNode;
  content?: ReactNode;
  confirmText?: string;
  onConfirm?: () => void | boolean | Promise<void | boolean>;
}

export interface Confirm extends Omit<Alert, 'type'> {
  type: DialogType.CONFIRM;

  title?: ReactNode;
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

export interface TextInput extends Dialog {
  type: DialogType.TEXT_INPUT;

  label: string;
  initialValue?: string;
  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm: (text: string) => void | boolean | Promise<void | boolean>;
  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}
