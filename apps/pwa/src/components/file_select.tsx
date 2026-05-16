import { CSSProperties } from 'react';
import styled from 'styled-components';
import Button from './button';
import { CSSVariable } from '../global_style';
import useEvent from '../utils/use_event';
import selectFile from '../utils/select_file';
import { t } from '@/i18n';

const SelectButton = styled(Button)`
  height: auto;
  min-height: 44px;
  padding-top: 10px;
  padding-bottom: 12px;
  white-space: normal;
  word-break: break-all;
  line-height: 1.25;

  > .placeholder {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }
`;

function FileSelect({
  placeholder = t('select_file'),
  value,
  onChange,
  disabled = false,
  acceptTypes,
  className,
  style,
}: {
  placeholder?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  acceptTypes?: string[];
  className?: string;
  style?: CSSProperties;
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
    <SelectButton
      className={className}
      style={style}
      onClick={onSelectFile}
      disabled={disabled}
      variant="ghost"
      block
    >
      {value ? value.name : <span className="placeholder">{placeholder}</span>}
    </SelectButton>
  );
}

export default FileSelect;
