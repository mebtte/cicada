import type { Variant } from '@/components/button';
import type { SelectOption } from '@/components';
import { ReactNode } from 'react';

export const ID_LENGTH = 6;
export const DEFAULT_CANCEL_VARIANT = 'ghost';
export const DEFAULT_CONFIRM_VARIANT = 'ghost';

export enum DialogType {
  ALERT,
  CONFIRM,
  ACTIONS,
  CAPTCHA,
  INPUT,
  INPUT_LIST,
  MULTIPLE_SELECT,
  FILE_SELECT,
  TEXTAREA_LIST,
  IMAGE_CUT,
  PASSWORD,
}

interface Confirmable<Payload = void> {
  confirmVariant?: Variant;
  confirmText?: string;
  onConfirm?: (payload: Payload) => void | boolean | Promise<void | boolean>;
}

interface Cancelable {
  cancelText?: string;
  cancelVariant?: Variant;
  onCancel?: () => void | boolean | Promise<void | boolean>;
}

export interface DialogOptions {
  id: string;
  type: DialogType;
  inlineFooter?: boolean;
}

export interface Alert extends DialogOptions, Confirmable {
  type: DialogType.ALERT;

  title?: ReactNode;
  content?: ReactNode;
}

export interface Confirm extends DialogOptions, Confirmable, Cancelable {
  type: DialogType.CONFIRM;

  title?: ReactNode;
  content?: ReactNode;
}

export interface ActionDialogAction {
  text: ReactNode;
  variant?: Variant;
  onClick?: () => void | boolean | Promise<void | boolean>;
}

export interface Actions extends DialogOptions, Cancelable {
  type: DialogType.ACTIONS;

  title?: ReactNode;
  content?: ReactNode;
  actions: ActionDialogAction[];
}

export interface Captcha
  extends DialogOptions,
    Confirmable<{
      captchaId: string;
      captchaValue: string;
    }>,
    Cancelable {
  type: DialogType.CAPTCHA;
}

export interface Input extends DialogOptions, Confirmable<string>, Cancelable {
  type: DialogType.INPUT;

  title?: string;
  label: string;
  initialValue?: string;
  maxLength?: number;
  inputType?: 'text' | 'number' | 'password';
}

export interface InputList
  extends DialogOptions,
    Confirmable<string[]>,
    Cancelable {
  type: DialogType.INPUT_LIST;

  title?: string;
  label: string;
  initialValue?: string[];
  max?: number;
  maxLength?: number;
}

export interface MultipleSelect<Value>
  extends DialogOptions,
    Confirmable<SelectOption<Value>[]>,
    Cancelable {
  type: DialogType.MULTIPLE_SELECT;

  title?: string;
  initialValue: SelectOption<Value>[];
  label: string;
  labelAddon?: ReactNode;
  loadOptions: (keyword: string) => Promise<SelectOption<Value>[]>;
}

export interface FileSelect
  extends DialogOptions,
    Confirmable<File | null>,
    Cancelable {
  type: DialogType.FILE_SELECT;

  title?: string;
  label: string;
  acceptTypes: string[];
  placeholder: string;
}

export interface TextareaList
  extends DialogOptions,
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

export interface ImageCut
  extends DialogOptions,
    Confirmable<Blob | null>,
    Cancelable {
  type: DialogType.IMAGE_CUT;

  title?: string;
}

export interface Password
  extends DialogOptions,
    Confirmable<string>,
    Cancelable {
  type: DialogType.PASSWORD;
}
