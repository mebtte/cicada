import { memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { useUser } from '@/global_states/server';
import { useSetting } from '@/global_states/setting';
import { t } from '@/i18n';
import Item from './item';
import { itemStyle } from './constants';

const SwitchButton = styled.button<{ $checked: boolean }>`
  position: relative;
  flex: 0 0 auto;
  width: 58px;
  height: 34px;
  padding: 3px;
  border: 2px solid
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_CONTROL_NEUTRAL};
  border-radius: 999px;
  background: ${({ $checked }) =>
    $checked ? CSSVariable.COLOR_PRIMARY : '#fff'};
  box-shadow: 0 4px 0
    ${({ $checked }) =>
      $checked
        ? CSSVariable.COLOR_PRIMARY_ACTIVE
        : CSSVariable.COLOR_CONTROL_NEUTRAL};
  cursor: pointer;
  transition:
    transform 150ms ease-out,
    background 150ms ease,
    box-shadow 150ms ease,
    filter 120ms;

  &:hover {
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
  }

  > .thumb {
    display: block;
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    border: 2px solid
      ${({ $checked }) =>
        $checked
          ? CSSVariable.COLOR_PRIMARY_ACTIVE
          : CSSVariable.COLOR_CONTROL_NEUTRAL};
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 0
      ${({ $checked }) =>
        $checked
          ? CSSVariable.COLOR_PRIMARY_ACTIVE
          : CSSVariable.COLOR_CONTROL_NEUTRAL};
    transform: translateX(${({ $checked }) => ($checked ? '24px' : '0')});
    transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

function AdminQuickEdit() {
  const user = useUser();
  const checked = useSetting((s) => s.adminQuickEdit);

  // 非管理员不展示该项
  if (!user?.admin) {
    return null;
  }

  return (
    <Item label={t('admin_quick_edit')} style={itemStyle}>
      <SwitchButton
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={t('admin_quick_edit')}
        $checked={checked}
        onClick={() =>
          useSetting.setState({ adminQuickEdit: !checked })
        }
      >
        <span className="thumb" />
      </SwitchButton>
    </Item>
  );
}

export default memo(AdminQuickEdit);
