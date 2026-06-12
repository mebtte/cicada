import { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import { ADMIN_PATH, ROOT_PATH } from '@/constants/route';
import definition from '@/definition';
import { useSelectedServer } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import autoScrollbar from '@/style/auto_scrollbar';
import capitalize from '@/utils/capitalize';
import day from '@/utils/day';
import formatBytes from '@/utils/format_bytes';
import adminGetDashboard, {
  type AdminDashboard,
} from '@/server/api/admin_get_dashboard';
import {
  LibraryMusic,
  People,
  PlayCircle,
  QueueMusic as QueueMusicIcon,
  Voice,
} from '@/components/icon';

const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const PRIMARY = CSSVariable.COLOR_PRIMARY;
const PRIMARY_SHADOW = 'var(--cicada-color-primary-shadow)';

type CardTone = 'play' | 'music' | 'artist' | 'user' | 'musicbill';

const CARD_TONE_MAP: Record<CardTone, { face: string; shadow: string }> = {
  play: {
    face: 'rgb(29 130 255)',
    shadow: 'rgb(19 92 190)',
  },
  music: {
    face: PRIMARY,
    shadow: PRIMARY_SHADOW,
  },
  artist: {
    face: 'rgb(255 177 25)',
    shadow: 'rgb(201 132 8)',
  },
  user: {
    face: 'rgb(156 99 255)',
    shadow: 'rgb(112 62 196)',
  },
  musicbill: {
    face: 'rgb(242 80 66)',
    shadow: 'rgb(190 46 34)',
  },
};

interface Data {
  error: Error | null;
  loading: boolean;
  dashboard: AdminDashboard | null;
}

const Page = styled.div`
  height: 100%;
  padding: 20px;
  background: rgb(247 247 247);
  overflow: auto;
  font-family: ${FONT};
  ${autoScrollbar}

  @media (max-width: 640px) {
    padding: 14px;
  }
`;

const DashboardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StatusBar = styled.div`
  min-width: 0;
  padding: 14px 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 0 ${ROW_SHADOW};

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const StatusItem = styled.div`
  min-width: 0;
  padding: 0 10px;
  border-left: 2px solid ${CSSVariable.COLOR_BORDER};

  &:first-child {
    border-left: 0;
  }

  @media (max-width: 760px) {
    padding: 0;
    border-left: 0;
  }
`;

const StatusLabel = styled.div`
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusValue = styled.div`
  margin-top: 4px;
  color: rgb(75 75 75);
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const cardStyle = css`
  min-height: 236px;
  min-width: 0;
  padding: 18px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
  text-align: left;
`;

const StaticCard = styled.div`
  ${cardStyle}
`;

const ActionCard = styled.button`
  ${cardStyle}
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${ROW_SHADOW};
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in;
  }

  &:focus-visible {
    outline: 3px solid ${PRIMARY};
    outline-offset: 3px;
  }
`;

const CardHeader = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const CardTitle = styled.div`
  min-width: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IconBox = styled.div<{ $tone: CardTone }>`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: 2px solid ${({ $tone }) => CARD_TONE_MAP[$tone].shadow};
  border-radius: 14px;
  background: ${({ $tone }) => CARD_TONE_MAP[$tone].face};
  box-shadow: 0 3px 0 ${({ $tone }) => CARD_TONE_MAP[$tone].shadow};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;

  > svg {
    width: 24px;
    height: 24px;
  }
`;

const PrimaryValue = styled.div`
  color: rgb(75 75 75);
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
`;

const MetaList = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const MetaRow = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;

  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > strong {
    flex-shrink: 0;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-weight: 900;
    white-space: nowrap;
  }
`;

const StatusBox = styled.div`
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const formatCount = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

const formatDuration = (millisecond: number) => {
  if (!Number.isFinite(millisecond) || millisecond <= 0) return '-';
  const totalSecond = Math.round(millisecond / 1000);
  const dayCount = Math.floor(totalSecond / 86400);
  const hour = Math.floor((totalSecond % 86400) / 3600);
  const minute = Math.floor((totalSecond % 3600) / 60);
  if (dayCount > 0) {
    return `${dayCount}d ${hour}h ${minute}m`;
  }
  if (hour > 0) {
    return `${hour}h ${minute}m`;
  }
  return `${Math.max(1, minute)}m`;
};

const formatTimestamp = (timestamp: number) =>
  timestamp ? day(timestamp).format('YYYY-MM-DD HH:mm') : t('unknown');

const getAdminPath = (path: string) => `${ROOT_PATH.ADMIN}/${path}`;

const getErrorMessage = (error: Error | null) =>
  error ? error.message : t('unknown_error', '');

function Dashboard() {
  const navigate = useNavigate();
  const selectedServer = useSelectedServer();
  const [reloadToken, setReloadToken] = useState(0);
  const [data, setData] = useState<Data>({
    error: null,
    loading: true,
    dashboard: null,
  });

  useEffect(() => {
    let ignore = false;
    setData((d) => ({
      ...d,
      error: null,
      loading: true,
    }));

    // 仪表盘所有服务端数字来自同一个聚合接口，避免页面并发多次请求。
    adminGetDashboard()
      .then((dashboard) => {
        if (ignore) return;
        setData({
          error: null,
          loading: false,
          dashboard,
        });
      })
      .catch((error) => {
        if (ignore) return;
        setData({
          error,
          loading: false,
          dashboard: null,
        });
      });

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  if (data.loading) {
    return (
      <Page>
        <StatusBox>
          <Spinner size={36} />
        </StatusBox>
      </Page>
    );
  }

  if (data.error || !data.dashboard) {
    return (
      <Page>
        <StatusBox>
          <ErrorCard
            errorMessage={getErrorMessage(data.error)}
            retry={() => setReloadToken((token) => token + 1)}
          />
        </StatusBox>
      </Page>
    );
  }

  const { dashboard } = data;

  return (
    <Page>
      <DashboardContent>
        <StatusBar>
          <StatusItem>
            <StatusLabel>{capitalize(t('server_name'))}</StatusLabel>
            <StatusValue title={selectedServer?.hostname || t('unknown')}>
              {selectedServer?.hostname || t('unknown')}
            </StatusValue>
          </StatusItem>
          <StatusItem>
            <StatusLabel>{capitalize(t('server_version'))}</StatusLabel>
            <StatusValue title={selectedServer?.version || t('unknown')}>
              {selectedServer?.version || t('unknown')}
            </StatusValue>
          </StatusItem>
          <StatusItem>
            <StatusLabel>{capitalize(t('pwa_version'))}</StatusLabel>
            <StatusValue title={definition.VERSION}>
              {definition.VERSION}
            </StatusValue>
          </StatusItem>
          <StatusItem>
            <StatusLabel>{capitalize(t('dashboard_updated_at'))}</StatusLabel>
            <StatusValue title={formatTimestamp(dashboard.generatedTimestamp)}>
              {formatTimestamp(dashboard.generatedTimestamp)}
            </StatusValue>
          </StatusItem>
        </StatusBar>

        <CardGrid>
          <StaticCard>
            <CardHeader>
              <CardTitle>{capitalize(t('today_play_count'))}</CardTitle>
              <IconBox $tone="play">
                <PlayCircle />
              </IconBox>
            </CardHeader>
            <PrimaryValue>{formatCount(dashboard.todayPlayCount)}</PrimaryValue>
            <MetaList>
              <MetaRow>
                <span>{capitalize(t('play_count_7d'))}</span>
                <strong>{formatCount(dashboard.playCount7d)}</strong>
              </MetaRow>
            </MetaList>
          </StaticCard>

          <ActionCard
            type="button"
            onClick={() => navigate(getAdminPath(ADMIN_PATH.MUSIC_MANAGEMENT))}
            aria-label={capitalize(t('music_management'))}
          >
            <CardHeader>
              <CardTitle>{capitalize(t('music_total'))}</CardTitle>
              <IconBox $tone="music">
                <LibraryMusic />
              </IconBox>
            </CardHeader>
            <PrimaryValue>{formatCount(dashboard.music.total)}</PrimaryValue>
            <MetaList>
              <MetaRow>
                <span>{capitalize(t('total_file_size'))}</span>
                <strong>{formatBytes(dashboard.music.totalAssetSize)}</strong>
              </MetaRow>
              <MetaRow>
                <span>{capitalize(t('total_duration'))}</span>
                <strong>{formatDuration(dashboard.music.totalDurationMs)}</strong>
              </MetaRow>
              <MetaRow>
                <span>{capitalize(t('new_music_7d'))}</span>
                <strong>{formatCount(dashboard.music.created7d)}</strong>
              </MetaRow>
            </MetaList>
          </ActionCard>

          <ActionCard
            type="button"
            onClick={() => navigate(getAdminPath(ADMIN_PATH.ARTIST_MANAGEMENT))}
            aria-label={capitalize(t('artist_management'))}
          >
            <CardHeader>
              <CardTitle>{capitalize(t('artist_total'))}</CardTitle>
              <IconBox $tone="artist">
                <Voice />
              </IconBox>
            </CardHeader>
            <PrimaryValue>{formatCount(dashboard.artist.total)}</PrimaryValue>
            <MetaList>
              <MetaRow>
                <span>{capitalize(t('new_artist_7d'))}</span>
                <strong>{formatCount(dashboard.artist.created7d)}</strong>
              </MetaRow>
              <MetaRow>
                <span>{capitalize(t('artist_photo_total'))}</span>
                <strong>{formatCount(dashboard.artist.photoCount)}</strong>
              </MetaRow>
            </MetaList>
          </ActionCard>

          <ActionCard
            type="button"
            onClick={() => navigate(getAdminPath(ADMIN_PATH.USER_MANAGEMENT))}
            aria-label={capitalize(t('user_management'))}
          >
            <CardHeader>
              <CardTitle>{capitalize(t('user_total'))}</CardTitle>
              <IconBox $tone="user">
                <People />
              </IconBox>
            </CardHeader>
            <PrimaryValue>{formatCount(dashboard.user.total)}</PrimaryValue>
            <MetaList>
              <MetaRow>
                <span>{capitalize(t('admin_count'))}</span>
                <strong>{formatCount(dashboard.user.adminCount)}</strong>
              </MetaRow>
              <MetaRow>
                <span>{capitalize(t('active_user_7d'))}</span>
                <strong>{formatCount(dashboard.user.activeUser7dCount)}</strong>
              </MetaRow>
            </MetaList>
          </ActionCard>

          <StaticCard>
            <CardHeader>
              <CardTitle>{capitalize(t('musicbill_total'))}</CardTitle>
              <IconBox $tone="musicbill">
                <QueueMusicIcon />
              </IconBox>
            </CardHeader>
            <PrimaryValue>{formatCount(dashboard.musicbill.total)}</PrimaryValue>
            <MetaList>
              <MetaRow>
                <span>{capitalize(t('public_musicbill_total'))}</span>
                <strong>{formatCount(dashboard.musicbill.public)}</strong>
              </MetaRow>
              <MetaRow>
                <span>{capitalize(t('shared_musicbill_total'))}</span>
                <strong>{formatCount(dashboard.musicbill.shared)}</strong>
              </MetaRow>
            </MetaList>
          </StaticCard>
        </CardGrid>
      </DashboardContent>
    </Page>
  );
}

export default Dashboard;
