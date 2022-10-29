import { EditDialogData } from '../eventemitter';

export interface RenderProps {
  data: EditDialogData;
  loading: boolean;
  value: unknown | undefined;
  onChange: (value: unknown) => void;
}
