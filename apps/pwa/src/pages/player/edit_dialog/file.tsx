import FileSelect from '@/components/file_select';
import { ForwardedRef, forwardRef, useImperativeHandle, useState } from 'react';
import { EditDialogType } from '../eventemitter';
import { Ref, RenderProps } from './constants';

function Wrapper(
  {
    loading,
    data: { label, acceptTypes, placeholder },
  }: RenderProps<EditDialogType.FILE>,
  ref: ForwardedRef<Ref>,
) {
  const [file, setFile] = useState<File | null>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => file,
  }));

  return (
    <FileSelect
      label={label}
      value={file}
      onChange={(f) => setFile(f)}
      disabled={loading}
      acceptTypes={acceptTypes}
      placeholder={placeholder}
    />
  );
}

export default forwardRef<Ref, RenderProps<EditDialogType.FILE>>(Wrapper);
