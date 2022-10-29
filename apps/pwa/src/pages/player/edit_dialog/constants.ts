import { EditDialogData } from '../eventemitter';

export interface RenderProps {
  data: EditDialogData;
  loading: boolean;
}

export type Ref = {
  getValue: () => unknown | Promise<unknown>;
};
