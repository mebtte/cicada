import React from 'react';
import styled from 'styled-components';

import Button, { Type } from '@/components/button';
import { closeConfigWindow } from '@/platform/electron_new';
import { ACTION_HEIGHT } from './constant';

const Style = styled.div`
  z-index: 2;
  position: fixed;
  left: 0;
  bottom: 0;
  box-sizing: border-box;
  padding: 0 30px;
  width: 100%;
  height: ${ACTION_HEIGHT}px;
  display: flex;
  align-items: center;
  gap: 20px;
  backdrop-filter: blur(5px);
  > .action {
    flex: 1;
  }
`;

const Action = ({
  loading,
  onSave,
}: {
  loading: boolean;
  onSave: () => void;
}) => (
  <Style>
    <Button
      className="action"
      label="取消"
      size={32}
      onClick={closeConfigWindow}
      disabled={loading}
    />
    <Button
      className="action"
      label="保存配置"
      size={32}
      type={Type.PRIMARY}
      onClick={onSave}
      loading={loading}
    />
  </Style>
);

export default Action;
