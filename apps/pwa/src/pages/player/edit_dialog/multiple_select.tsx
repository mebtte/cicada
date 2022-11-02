import MultipleSelect, { Option } from '#/components/multiple_select';
import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import { EditDialogType } from '../eventemitter';
import { Ref, RenderProps } from './constants';

function Wrapper(
  {
    loading,
    data: { label, initialValue, dataGetter },
  }: RenderProps<EditDialogType.MULTIPLE_SELECT>,
  ref: ForwardedRef<Ref>,
) {
  const [options, setOptions] = useState<Option<unknown>[]>(initialValue || []);
  const onOptionsChange = useCallback(
    (os: Option<unknown>[]) => setOptions(os),
    [],
  );

  useImperativeHandle(ref, () => ({
    getValue: () => options,
  }));

  return (
    <MultipleSelect<unknown>
      label={label}
      value={options}
      onChange={onOptionsChange}
      dataGetter={dataGetter}
      disabled={loading}
    />
  );
}

export default forwardRef<Ref, RenderProps<EditDialogType.MULTIPLE_SELECT>>(
  Wrapper,
);
