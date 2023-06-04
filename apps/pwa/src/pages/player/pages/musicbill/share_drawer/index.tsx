import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import styled from 'styled-components';
import useNavigate from '@/utils/use_navigate';
import useOpen from './use_open';
import { Musicbill, ZIndex } from '../../../constants';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.DRAWER,
  },
};
const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
    display: 'flex',
    flexDirection: 'column',
  },
};
const Title = styled.div``;

function ShareDrawer({ musicbill }: { musicbill: Musicbill }) {
  const navigate = useNavigate();
  const { open, onClose } = useOpen();
  return (
    <Drawer
      maskProps={maskProps}
      bodyProps={bodyProps}
      open={open}
      onClose={onClose}
    >
      <Title>共享用户列表</Title>
      shared user list
    </Drawer>
  );
}

export default ShareDrawer;
