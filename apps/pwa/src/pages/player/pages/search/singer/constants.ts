import { Singer as BaseSinger } from '../../../constants';

export interface Singer extends BaseSinger {
  musicCount: number;
}
