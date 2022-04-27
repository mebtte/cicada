import { css } from 'styled-components';

export interface Musicbill {
  cover: string;
  description: string;
  id: string;
  name: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  condition: string;
  joinTimeString: string;
  musicbillList: Musicbill[];
}

export type Data =
  | {
      loading: true;
      error: null;
      user: null;
    }
  | {
      loading: false;
      error: Error;
      user: null;
    }
  | {
      loading: false;
      error: null;
      user: User;
    };

export const containerStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

export const MUSICBILL_COVER_SIZE = 144;
export const MUSICBILL_SPACE = 20;
export const MUSICBILL_COUNT_OF_ONE_LINE = 3;
