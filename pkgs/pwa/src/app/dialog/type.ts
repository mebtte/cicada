import React from 'react';

import { DIALOG_TYPE } from '../../platform/dialog';

export interface Dialog {
  id: string;
  open: boolean;
  type: DIALOG_TYPE;
  title?: string;
  content?: React.ReactNode;
  confirmText: string;
  onConfirm?: () => void | boolean;
  cancelText?: string;
  onCancel?: () => void | boolean;
}
