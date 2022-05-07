import { PublicConfigKey } from '@/constants/public_config';

export interface PublicConfig {
  key: PublicConfigKey;
  value: string;
  description: string;
}

export enum Query {
  OPERATE_RECORD_DIALOG_OPEN = 'operate_record_dialog_open',
  OPERATE_RECORD_DIALOG_KEY = 'operate_record_dialog_key',
}
