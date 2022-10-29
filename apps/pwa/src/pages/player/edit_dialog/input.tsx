import Input from '#/components/input';
import { RenderProps } from './constants';

function Wrapper({ loading, value, onChange, data: { label } }: RenderProps) {
  return (
    <Input
      label={label}
      inputProps={{
        value: (value as string) || '',
        onChange: (e) => onChange(e.target.value),
        autoFocus: true,
      }}
      disabled={loading}
    />
  );
}

export default Wrapper;
