import styled, { keyframes } from 'styled-components';
import { MdArrowBack } from 'react-icons/md';
import { t } from '@/i18n';
import ManageContent from './first_step/manage_content';

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
`;

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgb(248 248 248);
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 300ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  padding-top: max(14px, env(safe-area-inset-top, 14px));
  background: #fff;
  border-bottom: 2px solid rgb(220 220 220);
  box-shadow: 0 4px 0 rgb(210 210 210);
`;

const BackButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: rgb(240 240 240);
  color: rgb(88 88 88);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms, transform 120ms;

  &:hover {
    background: rgb(228 228 228);
  }

  &:active {
    transform: scale(0.93);
  }

  > svg {
    font-size: 22px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${FONT};
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: rgb(50 50 50);
  line-height: 1.2;
`;

const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgb(210 210 210);
    border-radius: 4px;
  }
`;

function ManagePage({ onClose }: { onClose: () => void }) {
  return (
    <Wrapper>
      <Header>
        <BackButton onClick={onClose} aria-label="Back">
          <MdArrowBack />
        </BackButton>
        <Title>{t('manage_origins')}</Title>
      </Header>
      <ScrollArea>
        <ManageContent onEmpty={onClose} />
      </ScrollArea>
    </Wrapper>
  );
}

export default ManagePage;
