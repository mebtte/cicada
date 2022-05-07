import { css } from 'styled-components';

import { MusicWithIndex } from '../../constants';

export interface Musicbill {
  id: string;
  cover: string;
  name: string;
  description: string;
  user: {
    id: string;
    nickname: string;
    condition: string;
    avatar: string;
  };
  musicList: MusicWithIndex[];
}

export type Data =
  | { loading: true; musicbill: null; error: null }
  | {
      loading: false;
      musicbill: Musicbill;
      error: null;
    }
  | { loading: false; musicbill: null; error: Error };

export const containerStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
