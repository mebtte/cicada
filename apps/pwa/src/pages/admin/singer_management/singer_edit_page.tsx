import { useCallback, useEffect, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { MdArrowBack } from 'react-icons/md';
import Button from '@/components/button';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import { ADMIN_PATH, ROOT_PATH } from '@/constants/route';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import adminGetSinger from '@/server/api/admin_get_singer';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import SingerEditContent from '../components/singer_edit/content';
import type { Singer } from '../components/singer_edit/types';

const Page = styled.div`
  position: absolute;
  inset: 0;
  z-index: 20;
  height: 100%;
  overflow-y: auto;
  ${autoScrollbar}
  background: #fff;
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  height: 56px;
  padding: 0 14px;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Title = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Content = styled.div`
  display: flex;
  justify-content: center;
`;

const CenterBox = styled.div`
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const getSingerManagementPath = () =>
  `${ROOT_PATH.ADMIN}/${ADMIN_PATH.SINGER_MANAGEMENT}`;

const getSingerEditMatch = (pathname: string) =>
  matchPath(
    `${getSingerManagementPath()}/:singerId`,
    pathname,
  );

const toEditableSinger = (
  singer: Awaited<ReturnType<typeof adminGetSinger>>,
): Singer => ({
  id: singer.id,
  name: singer.name,
  aliases: singer.aliases,
  photos: singer.photos,
  createUser: {
    id: singer.createUser.id,
    username: singer.createUser.username,
    nickname: singer.createUser.nickname,
  },
  createTimestamp: singer.createTimestamp,
});

function SingerEditPage({ onSaved }: { onSaved: () => void }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const singerId = getSingerEditMatch(pathname)?.params.singerId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [singer, setSinger] = useState<Singer | null>(null);

  const loadSinger = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      setSinger(toEditableSinger(await adminGetSinger(id)));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (singerId) {
      void loadSinger(singerId);
    }
  }, [loadSinger, singerId]);

  const back = () => navigate(`${getSingerManagementPath()}${search}`);

  const handleSaved = () => {
    onSaved();
    back();
  };

  const handlePhotosChanged = () => {
    onSaved();
    if (singerId) {
      void loadSinger(singerId);
    }
  };

  if (!singerId) {
    return null;
  }

  return (
    <Page>
      <Header>
        <Button square size="sm" variant="plain" onClick={back}>
          <MdArrowBack />
        </Button>
        <Title>{capitalize(t('modify_singer'))}</Title>
      </Header>

      {loading ? (
        <CenterBox>
          <Spinner />
        </CenterBox>
      ) : error ? (
        <CenterBox>
          <ErrorCard
            errorMessage={error.message}
            retry={() => singerId && loadSinger(singerId)}
          />
        </CenterBox>
      ) : singer ? (
        <Content>
          <SingerEditContent
            page
            singer={singer}
            onSaved={handleSaved}
            onPhotosChanged={handlePhotosChanged}
          />
        </Content>
      ) : null}
    </Page>
  );
}

export default SingerEditPage;
