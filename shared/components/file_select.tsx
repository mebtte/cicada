import styled, { css } from 'styled-components';
import { CSSVariable } from '../global_style';
import useEvent from '../utils/use_event';
import Label from './label';
import selectFile from '../utils/select_file';
import { MUSIC_SQ } from '../constants/music';

const Style = styled.div<{ disabled: boolean }>`
  padding: 20px;

  border: 1px dashed ${CSSVariable.COLOR_BORDER};
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  font-size: 12px;
  transition: inherit;
  user-select: none;

  &:active {
    border-color: ${CSSVariable.COLOR_PRIMARY};
    border-style: solid;
  }

  ${({ disabled }) => css`
    border-color: ${disabled
      ? `${CSSVariable.TEXT_COLOR_DISABLED} !important`
      : CSSVariable.COLOR_BORDER};
    border-style: dashed !important;
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
}: {
  label: string;
  placeholder?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const onSelectFile = useEvent(() => {
    if (disabled) {
      return;
    }
    return selectFile({
      acceptTypes: MUSIC_SQ.ACCEPT_MIMES,
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