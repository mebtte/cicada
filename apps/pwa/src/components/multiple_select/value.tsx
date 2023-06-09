import styled, { css } from 'styled-components';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { MdClose } from 'react-icons/md';
import preventDefault from '@/utils/prevent_default';
import { Option } from './constants';

const Style = styled.div<{ disabled: boolean }>`
  max-width: 100%;
  padding: 3px 3px 3px 7px;

  border: 1px solid ${CSSVariable.COLOR_BORDER};
  cursor: default;
  user-select: none;

  display: flex;
  align-items: center;
  gap: 3px;

  > .label {
    font-size: 12px;
    line-height: 1;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .remove {
    width: 16px;
    flex-shrink: 0;
  }

  ${({ disabled }) => css`
    > .remove {
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      color: ${disabled
        ? CSSVariable.TEXT_COLOR_DISABLED
        : CSSVariable.TEXT_COLOR_SECONDARY};
    }
  `}
`;

function Wrapper<Value>({
  option,
  disabled,
  onRemove,
}: {
  option: Option<Value>;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <Style key={option.key} disabled={disabled} onPointerDown={preventDefault}>
      <div className="label">{option.label}</div>
      <MdClose className="remove" onClick={disabled ? undefined : onRemove} />
    </Style>
  );
}

export default Wrapper;
