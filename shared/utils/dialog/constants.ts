import { ReactNode } from 'react';

export enum DialogType {
  ALERT,
  CONFIRM,
}

export interface Dialog {
  id: string;
  type: DialogType;

  title?: ReactNode;
  content?: ReactNode;
  confirmText?: string;
  onConfirm?: () => void | boolean | Promise<void | boolean>;
}

export interface Alert extends Dialog {
  type: DialogType.ALERT;
}

export interface Confirm extends Dialog {
  type: DialogType.CONFIRM;

  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}
