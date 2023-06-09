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
  TEXTAREA_LIST,
  IMAGE_CUT,
}

interface Confirmable<Payload = void> {
  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm?: (payload: Payload) => void | boolean | Promise<void | boolean>;
}

interface Cancelable {
  cancelText?: string;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}

export interface Dialog {
  id: string;
  type: DialogType;
}

export interface Alert extends Dialog, Confirmable {
  type: DialogType.ALERT;

  title?: ReactNode;
  content?: ReactNode;
}

export interface Confirm extends Dialog, Confirmable, Cancelable {
  type: DialogType.CONFIRM;

  title?: ReactNode;
  content?: ReactNode;
}

export interface Captcha
  extends Dialog,
    Confirmable<{
      captchaId: string;
      captchaValue: string;
    }>,
    Cancelable {
  type: DialogType.CAPTCHA;
}

export interface Input extends Dialog, Confirmable<string>, Cancelable {
  type: DialogType.INPUT;

  title?: string;
  label: string;
  initialValue?: string;
  maxLength?: number;
  inputType?: 'text' | 'number';
}

export interface InputList extends Dialog, Confirmable<string[]>, Cancelable {
  type: DialogType.INPUT_LIST;

  title?: string;
  label: string;
  initialValue?: string[];
  max?: number;
  maxLength?: number;
}

export interface MultipleSelect<Value>
  extends Dialog,
    Confirmable<Option<Value>[]>,
    Cancelable {
  type: DialogType.MULTIPLE_SELECT;

  title?: string;
  initialValue: Option<Value>[];
  label: string;
  labelAddon?: ReactNode;
  optionsGetter: (
    keyword: string,
  ) => Option<Value>[] | Promise<Option<Value>[]>;
}

export interface FileSelect
  extends Dialog,
    Confirmable<File | null>,
    Cancelable {
  type: DialogType.FILE_SELECT;

  title?: string;
  label: string;
  acceptTypes: string[];
  placeholder: string;
}

export interface TextareaList
  extends Dialog,
    Confirmable<string[]>,
    Cancelable {
  type: DialogType.TEXTAREA_LIST;

  title?: string;
  label: string;
  initialValue?: string[];
  max?: number;
  maxLength?: number;
  placeholder?: string;
}

export interface ImageCut extends Dialog, Confirmable<Blob | null>, Cancelable {
  type: DialogType.IMAGE_CUT;

  title?: string;
}
