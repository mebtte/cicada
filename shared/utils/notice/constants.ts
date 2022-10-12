import { ReactNode } from 'react';

export enum NoticeType {
  INFO,
  SUCCESS,
  ERROR,
}

export interface Notice {
  id: string;
  type: NoticeType;
  duration: number;
  visible: boolean;
  content: ReactNode;
  closable: boolean;

  height: number;
  top: number;
}

export const NOTICE_ITEM_SPACE = 15;
export const TRANSITION_DURATION = 350;
