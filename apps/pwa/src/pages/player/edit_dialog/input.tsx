import Input from '#/components/input';
import { ForwardedRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Ref, RenderProps } from './constants';

function Wrapper(
  { loading, data: { label, initialValue } }: RenderProps,
  ref: ForwardedRef<Ref>,
) {
  const [name, setName] = useState((initialValue as string) || '');

  useImperativeHandle(ref, () => ({
    getValue: () => name,
  }));

  return (
    <Input
      label={label}
      inputProps={{
        value: name,
        onChange: (e) => setName(e.target.value),
        autoFocus: true,
      }}
      disabled={loading}
    />
  );
}

export default forwardRef<Ref, RenderProps>(Wrapper);
