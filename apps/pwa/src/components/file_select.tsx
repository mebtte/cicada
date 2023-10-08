import styled, { css } from 'styled-components';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { CSSVariable } from '../global_style';
import useEvent from '../utils/use_event';
import selectFile from '../utils/select_file';

const Style = styled.div<{ disabled: boolean }>`
  padding: 10px 20px;

  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  cursor: pointer;
  text-align: center;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
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
const Placeholder = styled.div`
  ${upperCaseFirstLetter}
`;

function FileSelect({
  placeholder = '选择文件',
  value,
  onChange,
  disabled = false,
  acceptTypes,
}: {
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
    <Style onClick={onSelectFile} disabled={disabled}>
      {value ? value.name : <Placeholder>{placeholder}</Placeholder>}
    </Style>
  );
}

export default FileSelect;
