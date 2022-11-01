import { EditDialogData, EditDialogType } from '../eventemitter';

export interface RenderProps<Type extends EditDialogType> {
  data: EditDialogData & { type: Type };
  loading: boolean;
}

export type Ref = {
  getValue: () => unknown | Promise<unknown>;
};
