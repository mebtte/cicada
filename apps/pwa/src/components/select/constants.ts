import upperCaseFirstLetter from '#/utils/upper_case_first_letter';
import { t } from '@/i18n';

export type Option<Value> = {
  label: string;
  value: string | number;
  actualValue: Value;
};

export const DEFAULT_PLACEHOLDER = upperCaseFirstLetter(t('select'));

export enum ClassName {
  CONTAINER = 'react-select-container',
  MENU_PORTAL = 'react-select-menu-portal',
  MENU = 'react-select-menu',
  INDICATOR_SEPARATOR = 'react-select-indicator-separator',
  CONTROL = 'react-select-control',
  OPTION = 'react-select-option',
  MENU_LIST = 'react-select-menu-list',
  PLACEHOLDER = 'react-select-placeholder',
  VALUE_CONTAINER = 'react-select-value-container',
  INPUT = 'react-select-input',
}

export enum SingleClassName {
  SINGLE_VALUE = 'react-select-single-value',
}

export enum MultiClassName {
  MULTI_VALUE = 'react-select-multi-value',
  MULTI_VALUE_REMOVE = 'react-select-multi-value-remove',
}

export enum StateClassName {
  FOCUSED = 'react-select-focused',
  DISABLED = 'react-select-disabled',
  SELECTED = 'react-select-selected',
}
