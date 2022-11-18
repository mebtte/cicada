import { Singer as BaseSinger } from '../../../constants';

export interface Singer extends BaseSinger {
  avatar: string;
  musicCount: number;
}
