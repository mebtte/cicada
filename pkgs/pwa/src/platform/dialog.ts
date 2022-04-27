import React from 'react';
import Eventemitter from 'eventemitter3';

const eventemitter = new Eventemitter();
const EVENT_TYPE = 'dialog';
enum DIALOG_TYPE {
  ALERT = 'alert',
  CONFIRM = 'confirm',
}

export { eventemitter, EVENT_TYPE, DIALOG_TYPE };

function confirm({
  title,
  content,
  confirmText = '确定',
  onConfirm,
  cancelText = '取消',
  onCancel,
}: {
  title?: string;
  content?: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => Promise<void | boolean> | void | boolean;
  cancelText?: string;
  onCancel?: () => Promise<void | boolean> | void | boolean;
}) {
  eventemitter.emit(EVENT_TYPE, {
    type: DIALOG_TYPE.CONFIRM,
    title,
    content,
    confirmText,
    onConfirm,
    cancelText,
    onCancel,
  });
}

function alert({
  title,
  content,
  confirmText = '确定',
  onConfirm,
}: {
  title?: string;
  content?: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => Promise<void | boolean> | void | boolean;
}) {
  eventemitter.emit(EVENT_TYPE, {
    type: DIALOG_TYPE.ALERT,
    title,
    content,
    confirmText,
    onConfirm,
  });
}

export default {
  confirm,
  alert,
};
