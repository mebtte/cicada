import Input from '@/components/input';
import { ForwardedRef, forwardRef, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import IconButton from '@/components/icon_button';
import { MdDelete } from 'react-icons/md';
import { ComponentSize } from '@/constants/style';
import { Ref, RenderProps } from './constants';
import { EditDialogType } from '../eventemitter';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  .action {
    flex-shrink: 0;
  }
`;

function Wrapper(
  {
    loading,
    data: { label, initialValue, max, maxLength },
  }: RenderProps<EditDialogType.INPUT_LIST>,
  ref: ForwardedRef<Ref>,
) {
  const [values, setValues] = useState<{ id: number; content: string }[]>(
    () => {
      const from = (initialValue || []).map((t) => ({
        id: Math.random(),
        content: t,
      }));
      return from.length ? from : [{ id: Math.random(), content: '' }];
    },
  );
  const onValueChange = (content: string, id: number) =>
    setValues((ls) =>
      ls.map((l) =>
        l.id === id
          ? {
              ...l,
              content,
            }
          : l,
      ),
    );
  const onDelete = (id: number) =>
    setValues((vs) => vs.filter((v) => v.id !== id));

  useImperativeHandle(ref, () => ({
    getValue: () => values.map((v) => v.content),
  }));

  return (
    <Style>
      {values.map((value, index) => (
        <Input
          key={value.id}
          label={`${label} ${index + 1}`}
          addon={
            <IconButton
              size={ComponentSize.SMALL}
              onClick={() => onDelete(value.id)}
              disabled={loading}
            >
              <MdDelete />
            </IconButton>
          }
          inputProps={{
            value: value.content,
            onChange: (event) => onValueChange(event.target.value, value.id),
            maxLength,
          }}
          disabled={loading}
        />
      ))}
      {values.length >= max! ? null : (
        <Button
          className="action"
          onClick={() =>
            setValues((vs) => [
              ...vs,
              {
                id: Math.random(),
                content: '',
              },
            ])
          }
          disabled={loading}
        >
          新增{label}
        </Button>
      )}
    </Style>
  );
}

export default forwardRef<Ref, RenderProps<EditDialogType.INPUT_LIST>>(Wrapper);
