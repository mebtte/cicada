import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import withLogin from '@/platform/with_login';
import { useUser } from '@/global_states/server';
import { ADMIN_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import capitalize from '@/utils/capitalize';
import LanguageSelect from '@/components/language_select';
import Avatar from '@/components/avatar';
import Button from '@/components/button';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import definition from '@/definition';
import { CSS_VAR } from '@/components/theme';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import {
  MdAdd,
  MdClose,
  MdDashboard,
  MdHeadphones,
  MdLibraryMusic,
  MdMenu,
  MdPeopleOutline,
  MdRecordVoiceOver,
} from 'react-icons/md';
import Dashboard from './dashboard';
import MusicManagement from './music_management';
import SingerManagement from './singer_management';
import UserManagement from './user_management';
import UploadManagerHost from './music_management/import/upload_manager_host';
import FloatingUploadWindow from './music_management/import/floating_window';
import {
  toggleWindow,
  useMusicImport,
} from '@/global_states/music_import';

const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = 72;
const MOBILE_BREAKPOINT = 760;
const AVATAR_SIZE = 36;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_CONTROL_NEUTRAL;
const SURFACE_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

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
  background: rgb(247 247 247);
  overflow: hidden;
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  width: ${SIDEBAR_WIDTH}px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 4px 0 0
    color-mix(in srgb, ${SURFACE_SHADOW} 35%, transparent);
  z-index: 3;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    transition: transform 180ms ease;
  }
`;

const SidebarHeader = styled.div`
  padding: 18px 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BrandLogo = styled.img`
  width: 52px;
  height: 52px;
  padding: 8px;
  object-fit: contain;
  flex-shrink: 0;
  user-select: none;
  background: #fff;
  border: 2px solid ${NEUTRAL_SHADOW};
  border-radius: 15px;
  box-shadow: 0 4px 0 ${NEUTRAL_SHADOW};
`;

const BrandText = styled.div`
  min-width: 0;
`;

const BrandName = styled.div`
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
  color: rgb(75 75 75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BrandSubTitle = styled.div`
  margin-top: 3px;
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  color: rgb(150 150 150);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileCloseButton = styled(Button)`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    margin-left: auto;
    display: inline-flex;
  }
`;

const MenuList = styled.nav`
  padding: 4px 12px 18px;
  overflow-y: auto;
  ${autoScrollbar}
`;

const MenuLink = styled(NavLink)`
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0 12px;

  display: flex;
  align-items: center;
  gap: 10px;

  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 3px 0 ${SURFACE_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: 0;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    background 150ms ease-out,
    color 150ms ease-out,
    filter 120ms ease-out;
  -webkit-tap-highlight-color: transparent;

  > svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  > span {
    flex: 1;
    min-width: 0;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:focus-visible {
    outline: 3px solid ${PRIMARY};
    outline-offset: 2px;
  }

  &:not(.active):hover {
    color: ${PRIMARY};
    border-color: ${CSSVariable.COLOR_BORDER};
    filter: brightness(1.02);
  }

  &:active {
    transform: translateY(3px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  &.active {
    background: ${PRIMARY};
    border-color: ${PRIMARY_SHADOW};
    box-shadow: 0 4px 0 ${PRIMARY_SHADOW};
    color: #fff;

    &:hover {
      color: #fff;
      background: ${PRIMARY};
      border-color: ${PRIMARY_SHADOW};
      box-shadow: 0 4px 0 ${PRIMARY_SHADOW};
      filter: brightness(1.04);
    }

    &:active {
      box-shadow: none;
    }
  }

  & + & {
    margin-top: 8px;
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
    background: rgb(0 0 0 / 0.26);
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
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 18px;
  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 3px 0 ${SURFACE_SHADOW};
  z-index: 10;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    padding: 0 12px;
    gap: 12px;
  }
`;

const MenuToggle = styled(Button)`
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    flex-shrink: 0;
    display: inline-flex;
  }
`;

const HeaderLogo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: contain;
  flex-shrink: 0;
  user-select: none;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    display: none;
  }
`;

const HeaderTitle = styled.div`
  flex: 1;
  min-width: 0;
`;

const HeaderTitleText = styled.div`
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 21px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: 0;
  color: rgb(75 75 75);
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
  height: ${AVATAR_SIZE + 5}px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 150ms ease-out;

  &:active {
    transform: translateY(3px);
    transition: transform 60ms ease-in;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
    border-radius: 14px;
  }
`;

const PlayerLink = styled.button`
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE + 5}px;
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 150ms ease-out;

  &:active {
    transform: translateY(3px);
    transition: transform 60ms ease-in;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
    border-radius: 14px;
  }
`;


const PlayerLinkBox = styled.span`
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE}px;
  border: 2px solid ${NEUTRAL_SHADOW};
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 0 ${NEUTRAL_SHADOW};
  color: ${PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;

  ${PlayerLink}:hover & {
    color: ${PRIMARY};
    border-color: ${PRIMARY};
    box-shadow: 0 3px 0 ${PRIMARY_SHADOW};
  }
`;

const AvatarFallback = styled.div<{ $active?: boolean; $size?: number }>`
  width: ${({ $size }) => $size ?? AVATAR_SIZE}px;
  height: ${({ $size }) => $size ?? AVATAR_SIZE}px;
  border: 2px solid ${({ $active }) => ($active ? PRIMARY : NEUTRAL_SHADOW)};
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 0
    ${({ $active }) => ($active ? PRIMARY_SHADOW : NEUTRAL_SHADOW)};
  color: ${PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-weight: 800;
  font-size: 14px;
`;

const UserMenu = styled.div`
  position: absolute;
  top: 0;
  right: calc(100% + 12px);
  width: min(260px, calc(100vw - 72px));
  padding: 10px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  background: #fff;
  box-shadow:
    0 4px 0 ${SURFACE_SHADOW},
    0 18px 30px rgb(0 0 0 / 0.1);
  z-index: 20;
`;

const UserMenuProfile = styled.div`
  position: relative;
  padding: 10px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 3px 0 ${SURFACE_SHADOW};
`;

const UserMenuProfileText = styled.div`
  min-width: 0;
  flex: 1;
`;

const UserMenuName = styled.div`
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserMenuAccount = styled.div`
  margin-top: 3px;
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserMenuLanguage = styled(LanguageSelect)`
  position: relative;
  z-index: 1;
  padding: 10px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 3px 0 ${SURFACE_SHADOW};
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  z-index: 0;
`;

const getCurrentMenuItem = (pathname: string) => {
  return (
    ADMIN_MENU_ITEMS.find(({ path }) => {
      const adminPath = getAdminPath(path);
      return pathname === adminPath || pathname.startsWith(`${adminPath}/`);
    }) ??
    ADMIN_MENU_ITEMS[0]
  );
};

function AdminPage() {
  const user = useUser()!;
  const { pathname } = useLocation();
  const {
    top: titlebarTop,
    left: titlebarLeft,
    right: titlebarRight,
    windowWidth,
  } = useTitlebarOverlayInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentMenuItem = getCurrentMenuItem(pathname);
  const uploadWindowOpen = useMusicImport((s) => s.windowOpen);

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
  const headerSidePadding = windowWidth <= MOBILE_BREAKPOINT ? 12 : 18;
  const headerPaddingLeft = titlebarLeft
    ? titlebarLeft + headerSidePadding
    : headerSidePadding;
  const headerPaddingRight = titlebarRight
    ? titlebarRight + headerSidePadding
    : headerSidePadding;
  const sidebarTopPadding = titlebarLeft ? titlebarTop + 18 : 18;

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
      <UploadManagerHost />
      <FloatingUploadWindow />
      <Sidebar $open={sidebarOpen}>
        <SidebarHeader style={{ paddingTop: sidebarTopPadding }}>
          <BrandLogo src="/logo.png" alt={t('logo')} crossOrigin="anonymous" />
          <BrandText>
            <BrandName>{capitalize(t('cicada'))}</BrandName>
            <BrandSubTitle>{definition.VERSION}</BrandSubTitle>
          </BrandText>
          <MobileCloseButton
            square
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            aria-label={t('close_menu')}
          >
            <MdClose size={20} />
          </MobileCloseButton>
        </SidebarHeader>

        <MenuList>
          {ADMIN_MENU_ITEMS.map(({ path, label, Icon }) => (
            <MenuLink
              key={path}
              to={getAdminPath(path)}
              end={path === ADMIN_PATH.DASHBOARD}
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
        aria-label={t('close_menu_overlay')}
      />

      <Main>
        <Header
          style={{
            paddingLeft: headerPaddingLeft,
            paddingRight: headerPaddingRight,
          }}
        >
          <MenuToggle
            square
            variant="ghost"
            size="md"
            onClick={() => setSidebarOpen(true)}
            aria-label={t('open_menu')}
          >
            <MdMenu size={22} />
          </MenuToggle>
          <HeaderLogo src="/logo.png" alt={t('logo')} crossOrigin="anonymous" />
          <HeaderTitle>
            <HeaderTitleText>{capitalize(t(currentMenuItem.label))}</HeaderTitleText>
          </HeaderTitle>
          <HeaderActions>
            <Button
              size="sm"
              variant={uploadWindowOpen ? 'primary' : 'secondary'}
              icon={<MdAdd />}
              onClick={toggleWindow}
              title={capitalize(t('batch_import_music'))}
              aria-label={capitalize(t('batch_import_music'))}
              aria-pressed={uploadWindowOpen}
            >
              {capitalize(t('music'))}
            </Button>
            <PlayerLink
              type="button"
              onClick={() =>
                window.open(
                  `#${ROOT_PATH.PLAYER}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              title={capitalize(t('player'))}
              aria-label={capitalize(t('player'))}
            >
              <PlayerLinkBox>
                <MdHeadphones size={20} />
              </PlayerLinkBox>
            </PlayerLink>
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
                  <Avatar
                    src={avatarSrc}
                    size={AVATAR_SIZE}
                    active={userMenuOpen}
                  />
                ) : (
                  <AvatarFallback $active={userMenuOpen}>
                    {user.nickname[0]}
                  </AvatarFallback>
                )}
              </AvatarButton>
              {userMenuOpen ? (
                <UserMenu role="menu">
                  <UserMenuProfile>
                    {avatarSrc ? (
                      <Avatar src={avatarSrc} size={42} />
                    ) : (
                      <AvatarFallback $size={42}>
                        {user.nickname[0]}
                      </AvatarFallback>
                    )}
                    <UserMenuProfileText>
                      <UserMenuName title={user.nickname}>
                        {user.nickname}
                      </UserMenuName>
                      <UserMenuAccount title={user.username}>
                        @{user.username}
                      </UserMenuAccount>
                    </UserMenuProfileText>
                  </UserMenuProfile>
                  <UserMenuLanguage
                    confirmBeforeReload
                    label={t('language')}
                    size="sm"
                  />
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
              element={<UserManagement />}
            />
            <Route
              path={`${ADMIN_PATH.SINGER_MANAGEMENT}/*`}
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
