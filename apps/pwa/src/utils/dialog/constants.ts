import { Variant } from '@/components/button';
import { Option } from '@/components/multiple_select';
import { ReactNode } from 'react';

export const ID_LENGTH = 6;

export enum DialogType {
  ALERT,
  CONFIRM,
  CAPTCHA,
  INPUT,
  INPUT_LIST,
  MULTIPLE_SELECT,
  FILE_SELECT,
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

export interface Input extends Dialog {
  type: DialogType.INPUT;

  title?: string;
  label: string;
  initialValue?: string;
  maxLength?: number;
  inputType?: 'text' | 'number';
  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm: (text: string) => void | boolean | Promise<void | boolean>;
  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}

export interface InputList extends Dialog {
  type: DialogType.INPUT_LIST;

  title?: string;
  label: string;
  initialValue?: string[];
  max?: number;
  maxLength?: number;
  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm: (text: string[]) => void | boolean | Promise<void | boolean>;
  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}

export interface MultipleSelect<Value> extends Dialog {
  type: DialogType.MULTIPLE_SELECT;

  title?: string;
  initialValue: Option<Value>[];
  label: string;
  labelAddon?: ReactNode;
  optionsGetter: (
    keyword: string,
  ) => Option<Value>[] | Promise<Option<Value>[]>;
  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm: (
    options: Option<Value>[],
  ) => void | boolean | Promise<void | boolean>;
  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}

export interface FileSelect extends Dialog {
  type: DialogType.FILE_SELECT;

  title?: string;
  label: string;
  acceptTypes: string[];
  placeholder: string;
  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm: (file: File | null) => void | boolean | Promise<void | boolean>;
  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}
