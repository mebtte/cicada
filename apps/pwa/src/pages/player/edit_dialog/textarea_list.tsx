import { ForwardedRef, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { EditDialogData } from '../eventemitter';
import { Ref, RenderProps } from './constants';

const Style = styled.div``;

function TextareaList(
  { data }: { data: EditDialogData },
  ref: ForwardedRef<Ref>,
) {
  useImperativeHandle(ref, () => ({
    getValue: () => 111,
  }));

  return <Style>styled_function_component</Style>;
}

export default forwardRef<Ref, RenderProps>(TextareaList);
