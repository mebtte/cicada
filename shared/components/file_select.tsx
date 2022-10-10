import styled from 'styled-components';
import { CSSVariable } from '../global_style';
import useEvent from '../utils/use_event';
import Label from './label';
import selectFile from '../utils/select_file';
import { MUSIC_SQ } from '../constants/music';

const Style = styled.div`
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
`;

function FileSelect({
  label,
  placeholder = '选择文件',
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const onSelectFile = useEvent(() =>
    selectFile({ acceptTypes: MUSIC_SQ.ACCEPT_MIMES, onSelect: onChange }),
  );

  return (
    <Label label={label}>
      <Style onClick={onSelectFile}>{value ? value.name : placeholder}</Style>
    </Label>
  );
}

export default FileSelect;
