import {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { AddBox, Search, Edit } from '@/components/icon';
import ImageViewer, { type ImageViewerPhoto } from '@/components/image_viewer';
import Button from '@/components/button';
import Empty from '@/components/empty';
import Input from '@/components/input';
import { Select, type SelectOption } from '@/components';
import Pagination from '@/components/pagination';
import Spinner from '@/components/spinner';
import ErrorCard from '@/components/error_card';
import { Query } from '@/constants';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import day from '@/utils/day';
import useNavigate from '@/utils/use_navigate';
import useQuery from '@/utils/use_query';
import useWindowWidth from '@/utils/use_window_width';
import getResizedImage from '@/server/asset/get_resized_image';
import { isComposingEnterKeyDown } from '@/utils/keyboard';
import adminGetArtistList, {
  AdminArtistListFilterKey,
} from '@/server/api/admin_get_artist_list';
import openCreateArtistDialog from '../open_create_artist_dialog';
import ArtistEditDrawer from '../components/artist_edit/drawer';
import type { Artist } from '../components/artist_edit/types';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;
const PHOTO_SIZE = 36;
const MOBILE_BREAKPOINT = 640;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const TABLE_ROW_GAP = 10;

enum ArtistManagementQuery {
  FILTER_KEY = 'filter_key',
  PAGE_SIZE = 'page_size',
  EDIT_ARTIST_ID = 'edit_artist_id',
}

interface Data {
  error: Error | null;
  loading: boolean;
  total: number;
  artistList: Artist[];
}

const filterOptions: SelectOption<AdminArtistListFilterKey>[] = [
  {
    label: capitalize(t('all')),
    value: AdminArtistListFilterKey.ALL,
  },
  {
    label: 'ID',
    value: AdminArtistListFilterKey.ID,
  },
  {
    label: capitalize(t('name')),
    value: AdminArtistListFilterKey.NAME,
  },
  {
    label: capitalize(t('alias')),
    value: AdminArtistListFilterKey.ALIAS,
  },
];

const filterKeyValues = new Set<string>(Object.values(AdminArtistListFilterKey));

const parseFilterKey = (value?: string) =>
  value && filterKeyValues.has(value)
    ? (value as AdminArtistListFilterKey)
    : AdminArtistListFilterKey.ALL;

const parsePage = (value?: string) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const parsePageSize = (value?: string) => {
  const pageSize = Number(value);
  return PAGE_SIZE_OPTIONS.includes(
    pageSize as (typeof PAGE_SIZE_OPTIONS)[number],
  )
    ? pageSize
    : DEFAULT_PAGE_SIZE;
};

const encodeKeyword = (keyword: string) =>
  keyword ? window.encodeURIComponent(keyword) : undefined;

const pageSizeOptions: SelectOption<number>[] = PAGE_SIZE_OPTIONS.map((size) => ({
  label: size.toString(),
  value: size,
}));

const ScrollArea = styled.div`
  height: 100%;
  overflow: hidden;
`;

const Card = styled.div`
  height: 100%;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  padding: 16px 20px;
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};

  @media (max-width: 640px) {
    grid-template-columns: minmax(112px, 34%) minmax(0, 1fr);
  }
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;

const FloatingCreateButton = styled(Button)`
  position: absolute;
  right: 40px;
  bottom: 34px;
  z-index: 3;

  @media (max-width: 640px) {
    right: 28px;
    bottom: 28px;
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: flex-start;
  width: 100%;

  > .search-input {
    flex: 1;
    min-width: 0;

    > div {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      border-right-width: 0;
    }
  }

  > button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

const StatusBox = styled.div`
  height: 100%;
  min-height: 360px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const TableScroll = styled.div`
  height: 100%;
  padding: 0 20px 92px;
  overflow: auto;
  scroll-padding-bottom: 92px;
  ${autoScrollbar}
`;

const Table = styled.table`
  width: 100%;
  min-width: 1080px;
  border-collapse: separate;
  border-spacing: 0 ${TABLE_ROW_GAP}px;
  font-family: ${FONT};
`;

const Th = styled.th`
  position: sticky;
  top: ${TABLE_ROW_GAP}px;
  z-index: 2;
  height: 40px;
  padding: 0 18px;
  background: #fff;
  border-top: 2px solid ${CSSVariable.COLOR_BORDER};
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-align: left;
  white-space: nowrap;

  &:first-child {
    border-left: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 15px 0 0 15px;
  }

  &:last-child {
    right: 0;
    z-index: 3;
    border-right: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 0 15px 15px 0;
    box-shadow:
      -6px 0 0 #fff,
      0 3px 0 ${ROW_SHADOW};
  }
`;

const Td = styled.td`
  padding: 12px 18px;
  background: #fff;
  border-top: 2px solid ${CSSVariable.COLOR_BORDER};
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  vertical-align: middle;

  &:first-child {
    border-left: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 15px 0 0 15px;
  }

  &:last-child {
    position: sticky;
    right: 0;
    z-index: 1;
    border-right: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 0 15px 15px 0;
    box-shadow:
      -6px 0 0 #fff,
      0 3px 0 ${ROW_SHADOW};
  }

  tbody tr:hover & {
    color: rgb(75 75 75);
    filter: brightness(1.01);
  }
`;

const Mono = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 700;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const Name = styled.div`
  font-family: ${FONT};
  font-weight: 800;
  line-height: 1.45;
  color: rgb(75 75 75);
`;

const AliasList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Alias = styled.span`
  max-width: 180px;
  padding: 4px 8px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PhotoList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const PhotoButton = styled.button`
  position: relative;
  width: ${PHOTO_SIZE}px;
  height: ${PHOTO_SIZE}px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  padding: 0;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  cursor: zoom-in;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms ease-out;

  &:hover {
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(3px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
  }
`;

const Photo = styled.img<{ $loaded: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* 加载完成前用透明遮住, 露出按钮白底, 避免快速滚动时露出 <img> 的浏览器原生裂图 */
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity 120ms ease-out;
`;

const Muted = styled.span`
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
`;

const MusicCount = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  font-weight: 800;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
`;

const UserName = styled.div`
  font-family: ${FONT};
  font-weight: 800;
  line-height: 1.45;
  color: rgb(75 75 75);
`;

const UserAccount = styled.div`
  margin-top: 2px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
`;

const ActionButton = styled.button`
  width: 34px;
  height: 34px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  padding: 0;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    color 120ms,
    filter 120ms;

  &:hover {
    color: ${CSSVariable.COLOR_PRIMARY};
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(3px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
  }
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 2px solid ${CSSVariable.COLOR_BORDER};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 14px 16px;
    background: rgb(247 247 247);
  }
`;

const FooterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding: 10px;
    border: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 3px 0 ${ROW_SHADOW};
  }
`;

const ResultRange = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PageSizeSelectBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 640px) {
    justify-content: flex-end;
  }
`;

const PageSizeLabel = styled.span`
  white-space: nowrap;

  @media (max-width: 420px) {
    display: none;
  }
`;

const PageSizeSelectControl = styled.div`
  width: 82px;
`;

const PaginationBox = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    max-width: 100%;
    padding: 10px;
    border: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 15px;
    background: #fff;
    box-shadow: 0 3px 0 ${ROW_SHADOW};
    overflow: hidden;
    justify-content: center;
  }
`;

const formatCreateUser = (artist: Artist) => {
  const { createUser } = artist;
  if (!createUser.id) return <Muted>{t('unknown')}</Muted>;

  return (
    <>
      <UserName title={createUser.nickname || createUser.username}>
        {createUser.nickname || createUser.username || t('unknown')}
      </UserName>
      <UserAccount title={createUser.id}>
        {createUser.username ? `@${createUser.username}` : createUser.id}
      </UserAccount>
    </>
  );
};

function LazyPhoto({
  src,
  alt,
  ...props
}: {
  src: string;
  alt: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // src 变化时重置, 防止旧照片/旧加载状态泄漏到新照片
    setLoaded(false);
    const image = ref.current;
    if (!image || !src) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      image.src = src;
      observer.disconnect();
    });
    observer.observe(image);
    return () => observer.disconnect();
  }, [src]);

  return (
    <PhotoButton type="button" {...props}>
      <Photo
        ref={ref}
        alt={alt}
        decoding="async"
        $loaded={loaded}
        onLoad={() => setLoaded(true)}
      />
    </PhotoButton>
  );
}

function ArtistManagement() {
  const navigate = useNavigate();
  const compactPagination = useWindowWidth() <= MOBILE_BREAKPOINT;
  const query = useQuery<
    | Query.KEYWORD
    | Query.PAGE
    | ArtistManagementQuery.FILTER_KEY
    | ArtistManagementQuery.PAGE_SIZE
    | ArtistManagementQuery.EDIT_ARTIST_ID
  >();
  const keyword = query[Query.KEYWORD] ?? '';
  const filterKey = parseFilterKey(query[ArtistManagementQuery.FILTER_KEY]);
  const page = parsePage(query[Query.PAGE]);
  const pageSize = parsePageSize(query[ArtistManagementQuery.PAGE_SIZE]);
  // 编辑抽屉以 URL 查询参数为唯一来源, 便于从 player 等其他位置深链直达
  const editArtistId = query[ArtistManagementQuery.EDIT_ARTIST_ID] ?? null;
  const [data, setData] = useState<Data>({
    error: null,
    loading: true,
    total: 0,
    artistList: [],
  });
  const [viewerPhoto, setViewerPhoto] = useState<ImageViewerPhoto | null>(null);
  const [keywordInput, setKeywordInput] = useState(keyword);
  const composingKeywordRef = useRef(false);

  const updateQuery = useCallback(
    (
      query: Record<string, number | string | undefined>,
      { replace = true }: { replace?: boolean } = {},
    ) =>
      navigate({
        query: {
          [Query.KEYWORD]: encodeKeyword(keyword),
          [ArtistManagementQuery.FILTER_KEY]:
            filterKey === AdminArtistListFilterKey.ALL ? undefined : filterKey,
          [Query.PAGE]: page === 1 ? undefined : page,
          [ArtistManagementQuery.PAGE_SIZE]:
            pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize,
          [ArtistManagementQuery.EDIT_ARTIST_ID]: editArtistId ?? undefined,
          ...query,
        },
        replace,
      }),
    [editArtistId, filterKey, keyword, navigate, page, pageSize],
  );

  useEffect(() => {
    if (!composingKeywordRef.current) {
      setKeywordInput(keyword);
    }
  }, [keyword]);

  const onKeywordChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const nextKeyword = event.target.value;
    setKeywordInput(nextKeyword);
  };
  const submitKeywordSearch = useCallback(() => {
    const normalizedKeyword = keywordInput.replace(/\s+/g, ' ').trim();
    updateQuery({
      [Query.KEYWORD]: encodeKeyword(normalizedKeyword),
      [Query.PAGE]: undefined,
    });
  }, [keywordInput, updateQuery]);
  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitKeywordSearch();
  };

  const requestArtistList = useCallback(
    ({
      signal,
      silent = false,
      page: requestPage = page,
      keyword: requestKeyword = keyword,
      filterKey: requestFilterKey = filterKey,
    }: {
      signal?: AbortSignal;
      silent?: boolean;
      page?: number;
      keyword?: string;
      filterKey?: AdminArtistListFilterKey;
    } = {}) => {
      // 静默刷新: 不触发 loading 态, 保持当前列表可见, 失败时再切到错误 UI
      if (!silent) {
        setData((d) => ({
          ...d,
          error: null,
          loading: true,
        }));
      }
      return adminGetArtistList({
        page: requestPage,
        pageSize,
        keyword: requestKeyword.trim(),
        filterKey: requestFilterKey,
        requestMinimalDuration: 0,
      })
        .then((result) => {
          if (signal?.aborted) return;
          setData({
            error: null,
            loading: false,
            total: result.total,
            artistList: result.artistList,
          });
        })
        .catch((error) => {
          if (signal?.aborted) return;
          setData({
            error,
            loading: false,
            total: 0,
            artistList: [],
          });
        });
    },
    [filterKey, keyword, page, pageSize],
  );

  useEffect(() => {
    const controller = new AbortController();
    void requestArtistList({ signal: controller.signal });
    return () => controller.abort();
  }, [requestArtistList]);

  // CRUD 完成后的刷新: 静默路径
  const reload = useCallback(() => {
    void requestArtistList({ silent: true });
  }, [requestArtistList]);

  // 错误 UI 的"重试"按钮: 显式 loading 反馈
  const retry = useCallback(() => {
    void requestArtistList();
  }, [requestArtistList]);

  const onOpenCreateArtistDialog = useCallback(() => {
    openCreateArtistDialog({
      onCreated: (id) => {
        if (
          !keyword &&
          filterKey === AdminArtistListFilterKey.ALL &&
          page === 1 &&
          pageSize === DEFAULT_PAGE_SIZE
        ) {
          reload();
          updateQuery({
            [ArtistManagementQuery.EDIT_ARTIST_ID]: id,
          });
        } else {
          updateQuery({
            [Query.KEYWORD]: undefined,
            [ArtistManagementQuery.FILTER_KEY]: undefined,
            [Query.PAGE]: undefined,
            [ArtistManagementQuery.PAGE_SIZE]: undefined,
            [ArtistManagementQuery.EDIT_ARTIST_ID]: id,
          });
        }
      },
    });
  }, [filterKey, keyword, page, pageSize, reload, updateQuery]);

  const onEditArtist = useCallback(
    (id: string) => {
      updateQuery({
        [ArtistManagementQuery.EDIT_ARTIST_ID]: id,
      });
    },
    [updateQuery],
  );

  const onCloseEditArtist = useCallback(() => {
    updateQuery({
      [ArtistManagementQuery.EDIT_ARTIST_ID]: undefined,
    });
  }, [updateQuery]);

  const totalPageCount = Math.ceil(data.total / pageSize);
  useEffect(() => {
    if (data.loading || data.error || data.total === 0) return;
    if (totalPageCount > 0 && page > totalPageCount) {
      updateQuery({
        [Query.PAGE]: totalPageCount === 1 ? undefined : totalPageCount,
      });
    }
  }, [data.error, data.loading, data.total, page, totalPageCount, updateQuery]);

  const rangeStart = data.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, data.total);

  return (
    <ScrollArea>
      <Card>
        <Toolbar>
          <Select
            size="sm"
            options={filterOptions}
            value={filterKey}
            onChange={(value) => {
              updateQuery({
                [ArtistManagementQuery.FILTER_KEY]:
                  value === AdminArtistListFilterKey.ALL ? undefined : value,
                [Query.PAGE]: undefined,
              });
            }}
          />
          <SearchForm onSubmit={onSearchSubmit} autoComplete="off">
            <Input
              className="search-input"
              type="search"
              size="sm"
              value={keywordInput}
              onChange={onKeywordChange}
              onCompositionStart={() => {
                composingKeywordRef.current = true;
              }}
              onCompositionEnd={(event) => {
                composingKeywordRef.current = false;
                const nextKeyword = event.currentTarget.value;
                setKeywordInput(nextKeyword);
              }}
              onKeyDown={(event) => {
                if (
                  isComposingEnterKeyDown(event) ||
                  (composingKeywordRef.current && event.key === 'Enter')
                ) {
                  event.preventDefault();
                }
              }}
              placeholder={t('search')}
            />
            <Button
              square
              type="submit"
              size="sm"
              variant="primary"
              aria-label={t('search')}
              title={t('search')}
            >
              <Search />
            </Button>
          </SearchForm>
        </Toolbar>

        <Content>
          {data.error ? (
            <StatusBox>
              <ErrorCard errorMessage={data.error.message} retry={retry} />
            </StatusBox>
          ) : data.loading ? (
            <StatusBox>
              <Spinner />
            </StatusBox>
          ) : data.artistList.length === 0 ? (
            <StatusBox>
              {/* 后台歌手列表为空时统一复用 Empty 组件展示空状态。 */}
              <Empty description={t('no_suitable_artist')} />
            </StatusBox>
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th>{capitalize(t('artist_id'))}</Th>
                    <Th>{capitalize(t('name'))}</Th>
                    <Th>{capitalize(t('alias'))}</Th>
                    <Th>{capitalize(t('photo'))}</Th>
                    <Th>{capitalize(t('music_amount'))}</Th>
                    <Th>{capitalize(t('creator'))}</Th>
                    <Th>{capitalize(t('create_time'))}</Th>
                    <Th>{capitalize(t('manage'))}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.artistList.map((artist) => (
                    <tr key={artist.id}>
                      <Td>
                        <Mono>{artist.id}</Mono>
                      </Td>
                      <Td>
                        <Name title={artist.name}>{artist.name}</Name>
                      </Td>
                      <Td>
                        {artist.aliases.length ? (
                          <AliasList>
                            {artist.aliases.map((alias, index) => (
                              <Alias key={`${alias}-${index}`} title={alias}>
                                {alias}
                              </Alias>
                            ))}
                          </AliasList>
                        ) : null}
                      </Td>
                      <Td>
                        {artist.photos.length ? (
                          <PhotoList>
                            {artist.photos.map((photo) => (
                              <LazyPhoto
                                key={photo.id}
                                src={getResizedImage({
                                  url: photo.asset,
                                  size: PHOTO_SIZE * 2,
                                })}
                                alt={photo.description || artist.name}
                                title={photo.description || artist.name}
                                onClick={() =>
                                  setViewerPhoto({
                                    src: photo.asset,
                                    alt: photo.description || artist.name,
                                  })
                                }
                              />
                            ))}
                          </PhotoList>
                        ) : null}
                      </Td>
                      <Td>
                        <MusicCount>{artist.musicCount ?? 0}</MusicCount>
                      </Td>
                      <Td>{formatCreateUser(artist)}</Td>
                      <Td>
                        {day(artist.createTimestamp).format(
                          'YYYY-MM-DD HH:mm',
                        )}
                      </Td>
                      <Td>
                        <ActionButton
                          type="button"
                          title={t('modify_artist')}
                          aria-label={t('modify_artist')}
                          onClick={() => onEditArtist(artist.id)}
                        >
                          <Edit size={18} />
                        </ActionButton>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
          <FloatingCreateButton
            square
            size="lg"
            variant="primary"
            icon={<AddBox />}
            aria-label={t('create_artist')}
            title={t('create_artist')}
            onClick={onOpenCreateArtistDialog}
          />
        </Content>

        <Footer>
          <FooterInfo>
            <ResultRange>
              {capitalize(
                t(
                  'page_result_range',
                  rangeStart.toString(),
                  rangeEnd.toString(),
                  data.total.toString(),
                ),
              )}
            </ResultRange>
            <PageSizeSelectBox>
              <PageSizeLabel>{capitalize(t('items_per_page'))}</PageSizeLabel>
              <PageSizeSelectControl>
                <Select
                  size="sm"
                  options={pageSizeOptions}
                  value={pageSize}
                  menuPlacement="top"
                  onChange={(nextPageSize) =>
                    updateQuery({
                      [ArtistManagementQuery.PAGE_SIZE]:
                        nextPageSize === DEFAULT_PAGE_SIZE
                          ? undefined
                          : nextPageSize,
                      [Query.PAGE]: undefined,
                    })
                  }
                />
              </PageSizeSelectControl>
            </PageSizeSelectBox>
          </FooterInfo>
          {totalPageCount > 1 ? (
            <PaginationBox>
              <Pagination
                count={totalPageCount}
                page={page}
                siblingCount={compactPagination ? 0 : 1}
                onChange={(nextPage) =>
                  updateQuery({
                    [Query.PAGE]: nextPage === 1 ? undefined : nextPage,
                  }, {
                    replace: false,
                  })
                }
              />
            </PaginationBox>
          ) : null}
        </Footer>
      </Card>
      <ImageViewer photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />
      <ArtistEditDrawer
        open={editArtistId !== null}
        artistId={editArtistId}
        onClose={onCloseEditArtist}
        onSaved={reload}
      />
    </ScrollArea>
  );
}

export default ArtistManagement;
