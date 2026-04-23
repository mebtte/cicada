import { useState } from 'react';
import styled from 'styled-components';
import { Navigate } from 'react-router-dom';
import withLogin from '@/platform/with_login';
import { useUser } from '@/global_states/server';
import { ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import capitalize from '#/utils/capitalize';
import UserManage from '@/pages/player/pages/user_manage';
import LanguageSelect from '@/components/language_select';
import MusicManagement from './music_management';

const enum Tab {
  USER_MANAGEMENT = 'user_management',
  MUSIC_MANAGEMENT = 'music_management',
}

const Page = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
`;

const Header = styled.header`
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.04);
`;

const HeaderTop = styled.div`
  min-height: 56px;
  padding: 10px 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const HeaderActions = styled.div`
  margin-left: auto;
  width: 176px;
  min-width: 176px;

  @media (max-width: 640px) {
    margin-left: 0;
    width: 100%;
    min-width: 0;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const BrandDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${CSSVariable.COLOR_PRIMARY};
`;

const BrandName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  letter-spacing: 0.01em;
`;

const Divider = styled.div`
  width: 1px;
  height: 16px;
  background: ${CSSVariable.COLOR_BORDER};
  flex-shrink: 0;
`;

const SubTitle = styled.div`
  font-size: 13px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  flex-shrink: 0;
`;

const TabBar = styled.nav`
  padding: 0 28px;
  display: flex;
  gap: 0;
`;

const TabItem = styled.button<{ $active: boolean }>`
  position: relative;
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active }) =>
    $active ? CSSVariable.COLOR_PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
  transition: color 0.15s;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: ${({ $active }) =>
      $active ? CSSVariable.COLOR_PRIMARY : 'transparent'};
    transition: background 0.15s;
  }

  &:hover {
    color: ${({ $active }) =>
      $active ? CSSVariable.COLOR_PRIMARY : CSSVariable.TEXT_COLOR_PRIMARY};
  }
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;

const UserManageWrapper = styled.div`
  position: absolute;
  inset: 0;
`;

function AdminPage() {
  const user = useUser()!;
  const [tab, setTab] = useState<Tab>(Tab.USER_MANAGEMENT);

  if (!user.admin) {
    return <Navigate to={ROOT_PATH.PLAYER} replace />;
  }

  return (
    <Page>
      <Header>
        <HeaderTop>
          <HeaderInfo>
            <Brand>
              <BrandDot />
              <BrandName>{capitalize(t('cicada'))}</BrandName>
            </Brand>
            <Divider />
            <SubTitle>{capitalize(t('admin_panel'))}</SubTitle>
          </HeaderInfo>
          <HeaderActions>
            <LanguageSelect confirmBeforeReload size="sm" />
          </HeaderActions>
        </HeaderTop>
        <TabBar>
          <TabItem
            $active={tab === Tab.USER_MANAGEMENT}
            onClick={() => setTab(Tab.USER_MANAGEMENT)}
          >
            {capitalize(t('user_management'))}
          </TabItem>
          <TabItem
            $active={tab === Tab.MUSIC_MANAGEMENT}
            onClick={() => setTab(Tab.MUSIC_MANAGEMENT)}
          >
            {capitalize(t('music_management'))}
          </TabItem>
        </TabBar>
      </Header>
      <Content>
        {tab === Tab.USER_MANAGEMENT ? (
          <UserManageWrapper>
            <UserManage />
          </UserManageWrapper>
        ) : (
          <MusicManagement />
        )}
      </Content>
    </Page>
  );
}

export default withLogin(AdminPage);
