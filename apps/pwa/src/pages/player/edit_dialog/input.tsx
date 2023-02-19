import Input from '@/components/input';
import { ForwardedRef, forwardRef, useImperativeHandle, useState } from 'react';
import { EditDialogType } from '../eventemitter';
import { Ref, RenderProps } from './constants';

function Wrapper(
  {
    loading,
    data: { label, initialValue, maxLength, inputType = 'text', placeholder },
  }: RenderProps<EditDialogType.INPUT>,
  ref: ForwardedRef<Ref>,
) {
  const [name, setName] = useState(initialValue || '');

  useImperativeHandle(ref, () => ({
    getValue: () => name,
  }));

  return (
    <Input
      label={label}
      inputProps={{
        type: inputType,
        value: name,
        onChange: (e) => setName(e.target.value),
        autoFocus: true,
        maxLength,
        placeholder,
      }}
      disabled={loading}
    />
  );
}

export default forwardRef<Ref, RenderProps<EditDialogType.INPUT>>(Wrapper);
