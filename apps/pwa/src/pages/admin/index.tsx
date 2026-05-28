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
  MdCloudUpload,
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
import MusicImportSidebar from './music_management/import/sidebar';
import {
  getMusicImportSummary,
  isActiveImportPhase,
  toggleWindow,
  useMusicImport,
} from '@/global_states/music_import';

const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = 72;
const MOBILE_BREAKPOINT = 760;
const MOBILE_OVERLAY_Z_INDEX = 20;
const MOBILE_SIDEBAR_Z_INDEX = 30;
const AVATAR_SIZE = 36;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_CONTROL_NEUTRAL;
const SURFACE_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

// 上传中: 一道斜向白色高光从左滑到右, 在 36x36 的小按钮里也清晰可见
const runningShimmer = `
  @keyframes admin-import-running-shimmer {
    0% {
      transform: translateX(-130%);
    }
    100% {
      transform: translateX(130%);
    }
  }
`;

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
    /* Keep the mobile drawer above the fixed admin header while it is open. */
    z-index: ${MOBILE_SIDEBAR_Z_INDEX};
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
    z-index: ${MOBILE_OVERLAY_Z_INDEX};
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
  /* window-controls-overlay 模式下让顶栏空白区域可拖动窗口;
     内部按钮/链接已由全局样式设为 no-drag, 点击不受影响。 */
  -webkit-app-region: drag;

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

// 导入按钮状态: idle 仅图标; active 显示百分比并高亮; failed 显示百分比并标红
type UploadStatusVariant = 'idle' | 'active' | 'failed';

const DANGER = 'rgb(242 80 66)';
const DANGER_SHADOW = 'rgb(190 46 34)';

const resolveStatusBackground = (
  status: UploadStatusVariant,
  open: boolean,
) => {
  if (status === 'failed') return DANGER;
  if (status === 'active' || open) return PRIMARY;
  return '#fff';
};

const resolveStatusBorder = (status: UploadStatusVariant, open: boolean) => {
  if (status === 'failed') return DANGER_SHADOW;
  if (status === 'active' || open) return PRIMARY_SHADOW;
  return NEUTRAL_SHADOW;
};

const resolveStatusForeground = (
  status: UploadStatusVariant,
  open: boolean,
) => (status !== 'idle' || open ? '#fff' : PRIMARY);

const UploadStatusButton = styled.button<{
  $status: UploadStatusVariant;
  $open: boolean;
  $running: boolean;
}>`
  position: relative;
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE + 5}px;
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms ease-out,
    filter 120ms;

  &:active {
    transform: translateY(3px);
    transition:
      transform 60ms ease-in,
      filter 60ms;
  }

  &:focus-visible {
    outline: 3px solid ${PRIMARY};
    outline-offset: 3px;
    border-radius: 14px;
  }

  /* 内层方形容器: 承担描边/底部阴影/颜色变体, 与 PlayerLinkBox 视觉一致 */
  > span.upload-status-box {
    position: relative;
    width: ${AVATAR_SIZE}px;
    height: ${AVATAR_SIZE}px;
    border: 2px solid
      ${({ $status, $open }) => resolveStatusBorder($status, $open)};
    border-radius: 14px;
    background: ${({ $status, $open }) =>
      resolveStatusBackground($status, $open)};
    box-shadow: 0 3px 0
      ${({ $status, $open }) => resolveStatusBorder($status, $open)};
    color: ${({ $status, $open }) => resolveStatusForeground($status, $open)};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
    white-space: nowrap;
    transition:
      border-color 150ms ease-out,
      box-shadow 150ms ease-out,
      color 150ms ease-out,
      background 150ms ease-out,
      filter 120ms;
  }

  /* 上传中: 全按钮斜向白光扫动, 比原来的横向波纹明显得多 */
  > span.upload-status-box::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(
      115deg,
      transparent 35%,
      rgb(255 255 255 / 0.75) 50%,
      transparent 65%
    );
    opacity: ${({ $running }) => ($running ? 1 : 0)};
    animation: ${({ $running }) =>
      $running ? 'admin-import-running-shimmer 1.05s linear infinite' : 'none'};
    pointer-events: none;
    transition: opacity 120ms;
  }

  > span.upload-status-box > svg {
    position: relative;
    z-index: 1;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  > span.upload-status-box > span {
    position: relative;
    z-index: 1;
  }

  &:hover > span.upload-status-box {
    border-color: ${({ $status, $open }) =>
      $status === 'failed'
        ? DANGER_SHADOW
        : $status === 'active' || $open
          ? PRIMARY_SHADOW
          : PRIMARY};
    box-shadow: 0 3px 0
      ${({ $status }) =>
        $status === 'failed' ? DANGER_SHADOW : PRIMARY_SHADOW};
    filter: brightness(1.04);
  }

  &:active > span.upload-status-box {
    box-shadow: none;
    transition:
      border-color 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  ${runningShimmer}
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
  const uploadTasks = useMusicImport((s) => s.tasks);
  const uploadSidebarOpen = useMusicImport((s) => s.windowOpen);
  const uploadSummary = getMusicImportSummary(uploadTasks);
  const uploadActive = uploadTasks.length > 0;
  const uploadRunning = uploadTasks.some((task) =>
    isActiveImportPhase(task.phase),
  );
  // 任意一条任务失败时, 按钮转为危险色提示用户
  const uploadFailed = uploadTasks.some((task) => task.phase === 'failed');
  const uploadStatus: 'idle' | 'active' | 'failed' = uploadFailed
    ? 'failed'
    : uploadActive
      ? 'active'
      : 'idle';
  // 按钮内只显示纯数字, tooltip 仍保留 % 提示是百分比
  const uploadPercentText = uploadSummary.pct.toFixed(0);
  const uploadStatusText = uploadActive
    ? `${uploadPercentText}%`
    : capitalize(t('upload_music'));

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
  const isMobileLayout = windowWidth <= MOBILE_BREAKPOINT;
  const headerSidePadding = isMobileLayout ? 12 : 18;
  // On desktop, the persistent sidebar already owns the left titlebar inset.
  const headerPaddingLeft = isMobileLayout && titlebarLeft
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
      <MusicImportSidebar />
      <Sidebar $open={sidebarOpen}>
        <SidebarHeader style={{ paddingTop: sidebarTopPadding }}>
          <BrandLogo src="/logo.png" alt={t('logo')} crossOrigin="anonymous" />
          <BrandText>
            <BrandName>{capitalize(t('cicada'))}</BrandName>
            <BrandSubTitle>{definition.VERSION}</BrandSubTitle>
          </BrandText>
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
            <UploadStatusButton
              type="button"
              onClick={toggleWindow}
              title={uploadStatusText}
              aria-label={uploadStatusText}
              aria-pressed={uploadSidebarOpen}
              $status={uploadStatus}
              $open={uploadSidebarOpen}
              $running={uploadRunning}
            >
              <span className="upload-status-box">
                {uploadActive ? (
                  <span>{uploadPercentText}</span>
                ) : (
                  <MdCloudUpload />
                )}
              </span>
            </UploadStatusButton>
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
                {/* Empty src lets Avatar render the shared default avatar image. */}
                <Avatar
                  src={avatarSrc}
                  size={AVATAR_SIZE}
                  active={userMenuOpen}
                />
              </AvatarButton>
              {userMenuOpen ? (
                <UserMenu role="menu">
                  <UserMenuProfile>
                    <Avatar src={avatarSrc} size={42} />
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
