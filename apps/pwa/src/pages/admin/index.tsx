import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import withLogin from '@/platform/with_login';
import { useUser } from '@/global_states/server';
import { ADMIN_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import capitalize from '@/utils/capitalize';
import UserManage from '@/pages/player/pages/user_manage';
import LanguageSelect from '@/components/language_select';
import Avatar from '@/components/avatar';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import definition from '@/definition';
import {
  MdClose,
  MdDashboard,
  MdLibraryMusic,
  MdMenu,
  MdPeopleOutline,
  MdRecordVoiceOver,
} from 'react-icons/md';
import Dashboard from './dashboard';
import MusicManagement from './music_management';
import SingerManagement from './singer_management';

const SIDEBAR_WIDTH = 216;
const HEADER_HEIGHT = 64;
const MOBILE_BREAKPOINT = 760;
const AVATAR_SIZE = 36;

const ADMIN_MENU_ITEMS = [
  {
    path: ADMIN_PATH.DASHBOARD,
    label: 'dashboard',
    Icon: MdDashboard,
  },
  {
    path: ADMIN_PATH.USER_MANAGEMENT,
    label: 'user_management',
    Icon: MdPeopleOutline,
  },
  {
    path: ADMIN_PATH.SINGER_MANAGEMENT,
    label: 'singer_management',
    Icon: MdRecordVoiceOver,
  },
  {
    path: ADMIN_PATH.MUSIC_MANAGEMENT,
    label: 'music_management',
    Icon: MdLibraryMusic,
  },
] as const;

const getAdminPath = (path: string) => `${ROOT_PATH.ADMIN}/${path}`;

const Page = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  background: #f5f6f8;
  overflow: hidden;
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  width: ${SIDEBAR_WIDTH}px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 1px 0 3px rgb(0 0 0 / 0.03);
  z-index: 3;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    transition: transform 180ms ease;
  }
`;

const SidebarHeader = styled.div`
  height: ${HEADER_HEIGHT}px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
`;

const BrandLogo = styled.img`
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
  user-select: none;
`;

const BrandText = styled.div`
  min-width: 0;
`;

const BrandName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BrandSubTitle = styled.div`
  margin-top: 1px;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileCloseButton = styled.button`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    margin-left: auto;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active {
      background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    }
  }
`;

const MenuList = styled.nav`
  padding: 14px 10px;
  overflow-y: auto;
  ${autoScrollbar}
`;

const MenuLink = styled(NavLink)`
  width: 100%;
  min-height: 42px;
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 120ms,
    color 120ms;
  -webkit-tap-highlight-color: transparent;

  > svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &.active {
    background: ${CSSVariable.COLOR_PRIMARY};
    color: #fff;
    font-weight: 600;

    &:hover {
      background: ${CSSVariable.COLOR_PRIMARY};
    }
  }

  & + & {
    margin-top: 6px;
  }
`;

const Overlay = styled.button<{ $open: boolean }>`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    position: fixed;
    inset: 0;
    display: ${({ $open }) => ($open ? 'block' : 'none')};
    z-index: 2;
    border: none;
    padding: 0;
    background: rgb(0 0 0 / 0.22);
  }
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  height: ${HEADER_HEIGHT}px;
  flex-shrink: 0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.04);
  z-index: 10;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    padding: 0 14px;
  }
`;

const MenuToggle = styled.button`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active {
      background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    }
  }
`;

const HeaderTitle = styled.div`
  flex: 1;
  min-width: 0;
`;

const HeaderTitleText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

const UserMenuRoot = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const AvatarButton = styled.div`
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE + 4}px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
    border-radius: 10px;
  }
`;

const AvatarFallback = styled.div`
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE}px;
  border: none;
  border-radius: 10px;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  color: ${CSSVariable.COLOR_PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;

const UserMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  padding: 12px;
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.12);
  z-index: 20;
`;

const UserMenuProfile = styled.div`
  padding: 2px 2px 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
`;

const UserMenuName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserMenuAccount = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  z-index: 0;
`;

const UserManageWrapper = styled.div`
  position: absolute;
  inset: 0;
`;

const getCurrentMenuItem = (pathname: string) => {
  return (
    ADMIN_MENU_ITEMS.find(({ path }) => pathname === getAdminPath(path)) ??
    ADMIN_MENU_ITEMS[0]
  );
};

function AdminPage() {
  const user = useUser()!;
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentMenuItem = getCurrentMenuItem(pathname);

  useEffect(() => {
    if (!userMenuOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (userMenuRef.current?.contains(target)) return;
      if (target.closest('[role="listbox"]')) return;
      setUserMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointerDown);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown);
  }, [userMenuOpen]);

  if (!user.admin) {
    return <Navigate to={ROOT_PATH.PLAYER} replace />;
  }

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const avatarSrc = getResizedImage({
    url: user.avatar,
    size: AVATAR_SIZE * 2,
  });
  const toggleUserMenu = () => setUserMenuOpen((open) => !open);
  const onAvatarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleUserMenu();
    }
    if (event.key === 'Escape') {
      setUserMenuOpen(false);
    }
  };

  return (
    <Page>
      <Sidebar $open={sidebarOpen}>
        <SidebarHeader>
          <BrandLogo src="/logo.png" alt="logo" crossOrigin="anonymous" />
          <BrandText>
            <BrandName>{capitalize(t('cicada'))}</BrandName>
            <BrandSubTitle>{definition.VERSION}</BrandSubTitle>
          </BrandText>
          <MobileCloseButton
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <MdClose size={20} />
          </MobileCloseButton>
        </SidebarHeader>

        <MenuList>
          {ADMIN_MENU_ITEMS.map(({ path, label, Icon }) => (
            <MenuLink
              key={path}
              to={getAdminPath(path)}
              end
              onClick={closeSidebar}
            >
              <Icon />
              <span>{capitalize(t(label))}</span>
            </MenuLink>
          ))}
        </MenuList>
      </Sidebar>
      <Overlay
        type="button"
        $open={sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close menu overlay"
      />

      <Main>
        <Header>
          <MenuToggle
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <MdMenu size={22} />
          </MenuToggle>
          <HeaderTitle>
            <HeaderTitleText>{capitalize(t(currentMenuItem.label))}</HeaderTitleText>
          </HeaderTitle>
          <HeaderActions>
            <UserMenuRoot ref={userMenuRef}>
              <AvatarButton
                role="button"
                tabIndex={0}
                title={user.nickname}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={toggleUserMenu}
                onKeyDown={onAvatarKeyDown}
              >
                {avatarSrc ? (
                  <Avatar src={avatarSrc} size={AVATAR_SIZE} />
                ) : (
                  <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                )}
              </AvatarButton>
              {userMenuOpen ? (
                <UserMenu role="menu">
                  <UserMenuProfile>
                    <UserMenuName title={user.nickname}>
                      {user.nickname}
                    </UserMenuName>
                    <UserMenuAccount title={user.username}>
                      @{user.username}
                    </UserMenuAccount>
                  </UserMenuProfile>
                  <LanguageSelect confirmBeforeReload size="sm" />
                </UserMenu>
              ) : null}
            </UserMenuRoot>
          </HeaderActions>
        </Header>
        <Content>
          <Routes>
            <Route
              index
              element={
                <Navigate to={getAdminPath(ADMIN_PATH.DASHBOARD)} replace />
              }
            />
            <Route path={ADMIN_PATH.DASHBOARD} element={<Dashboard />} />
            <Route
              path={ADMIN_PATH.USER_MANAGEMENT}
              element={
                <UserManageWrapper>
                  <UserManage />
                </UserManageWrapper>
              }
            />
            <Route
              path={ADMIN_PATH.SINGER_MANAGEMENT}
              element={<SingerManagement />}
            />
            <Route
              path={ADMIN_PATH.MUSIC_MANAGEMENT}
              element={<MusicManagement />}
            />
            <Route
              path="*"
              element={
                <Navigate to={getAdminPath(ADMIN_PATH.DASHBOARD)} replace />
              }
            />
          </Routes>
        </Content>
      </Main>
    </Page>
  );
}

export default withLogin(AdminPage);
