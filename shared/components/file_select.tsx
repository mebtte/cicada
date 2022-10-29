import styled, { css } from 'styled-components';
import { CSSVariable } from '../global_style';
import useEvent from '../utils/use_event';
import Label from './label';
import selectFile from '../utils/select_file';

const Style = styled.div<{ disabled: boolean }>`
  padding: 20px;

  border: 1px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  font-size: 12px;
  transition: inherit;
  user-select: none;
  word-break: break-all;

  &:active {
    border-color: ${CSSVariable.COLOR_PRIMARY};
    border-style: solid;
  }

  ${({ disabled }) => css`
    border-color: ${disabled
      ? `${CSSVariable.TEXT_COLOR_DISABLED} !important`
      : CSSVariable.COLOR_BORDER};
    cursor: ${disabled ? 'not-allowed' : 'poiter'};
    color: ${disabled
      ? CSSVariable.TEXT_COLOR_SECONDARY
      : CSSVariable.TEXT_COLOR_PRIMARY};
    background-color: ${disabled
      ? CSSVariable.BACKGROUND_DISABLED
      : 'transparent'};
  `}
`;

function FileSelect({
  label,
  placeholder = '选择文件',
  value,
  onChange,
  disabled = false,
  acceptTypes,
}: {
  label?: string;
  placeholder?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  acceptTypes?: string[];
}) {
  const onSelectFile = useEvent(() => {
    if (disabled) {
      return;
    }
    return selectFile({
      acceptTypes,
      onSelect: onChange,
    });
  });

  return (
    <Label label={label} disabled={disabled}>
      <Style onClick={onSelectFile} disabled={disabled}>
        {value ? value.name : placeholder}
      </Style>
    </Label>
  );
}

export default FileSelect;
