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
import {
  MdArrowDownward,
  MdArrowUpward,
  MdMusicNote,
  MdOpenInNew,
  MdOutlineEdit,
  MdPlayArrow,
  MdSearch,
  MdUnfoldMore,
} from 'react-icons/md';
import ImageViewer, { type ImageViewerPhoto } from '@/components/image_viewer';
import Button from '@/components/button';
import Empty from '@/components/empty';
import Input from '@/components/input';
import { Select, type SelectOption } from '@/components';
import Pagination from '@/components/pagination';
import Spinner from '@/components/spinner';
import ErrorCard from '@/components/error_card';
import { Query } from '@/constants';
import { MUSIC_TYPE_MAP } from '@/constants/music';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import day from '@/utils/day';
import useNavigate from '@/utils/use_navigate';
import useQuery from '@/utils/use_query';
import useWindowWidth from '@/utils/use_window_width';
import getResizedImage from '@/server/asset/get_resized_image';
import adminGetMusicList, {
  AdminMusicListFilterKey,
  AdminMusicListSortBy,
  AdminMusicListSortOrder,
} from '@/server/api/admin_get_music_list';
import FloatingMusicPlayer from './floating_music_player';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;
const COVER_SIZE = 42;
const MOBILE_BREAKPOINT = 640;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const TABLE_ROW_GAP = 10;

enum MusicManagementQuery {
  FILTER_KEY = 'filter_key',
  PAGE_SIZE = 'page_size',
  SORT_BY = 'sort_by',
  SORT_ORDER = 'sort_order',
}

type MusicItem = Awaited<ReturnType<typeof adminGetMusicList>>['musicList'][number];

interface Data {
  error: Error | null;
  loading: boolean;
  total: number;
  musicList: MusicItem[];
}

const filterOptions: SelectOption<AdminMusicListFilterKey>[] = [
  {
    label: capitalize(t('all')),
    value: AdminMusicListFilterKey.ALL,
  },
  {
    label: 'ID',
    value: AdminMusicListFilterKey.ID,
  },
  {
    label: capitalize(t('name')),
    value: AdminMusicListFilterKey.NAME,
  },
  {
    label: capitalize(t('alias')),
    value: AdminMusicListFilterKey.ALIAS,
  },
  {
    label: capitalize(t('singer')),
    value: AdminMusicListFilterKey.SINGER,
  },
];

const filterKeyValues = new Set<string>(Object.values(AdminMusicListFilterKey));

const parseFilterKey = (value?: string) =>
  value && filterKeyValues.has(value)
    ? (value as AdminMusicListFilterKey)
    : AdminMusicListFilterKey.ALL;

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

const sortByValues = new Set<string>(Object.values(AdminMusicListSortBy));
const sortOrderValues = new Set<string>(Object.values(AdminMusicListSortOrder));

const parseSortBy = (value?: string) =>
  value && sortByValues.has(value)
    ? (value as AdminMusicListSortBy)
    : undefined;

const parseSortOrder = (value?: string) =>
  value && sortOrderValues.has(value)
    ? (value as AdminMusicListSortOrder)
    : undefined;

const encodeKeyword = (keyword: string) =>
  keyword ? window.encodeURIComponent(keyword) : undefined;

const pageSizeOptions: SelectOption<number>[] = PAGE_SIZE_OPTIONS.map((size) => ({
  label: size.toString(),
  value: size,
}));

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
  padding: 0 20px 18px;
  background: rgb(247 247 247);
  overflow: auto;
  ${autoScrollbar}
`;

const Table = styled.table`
  width: 100%;
  min-width: 1560px;
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
      -6px 0 0 rgb(247 247 247),
      0 3px 0 ${ROW_SHADOW};
  }
`;

const SortHeaderButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  margin: 0 -8px;
  border: 0;
  background: transparent;
  color: ${({ $active }) =>
    $active ? CSSVariable.COLOR_PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 120ms,
    background 120ms;

  &:hover {
    color: ${CSSVariable.COLOR_PRIMARY};
    background: rgb(247 247 247);
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
  }

  > svg {
    font-size: 14px;
    opacity: ${({ $active }) => ($active ? 1 : 0.6)};
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
      -6px 0 0 rgb(247 247 247),
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

const CoverButton = styled.button`
  position: relative;
  width: ${COVER_SIZE}px;
  height: ${COVER_SIZE}px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  padding: 0;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  cursor: zoom-in;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
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

  > svg {
    font-size: 18px;
  }
`;

const Cover = styled.img<{ $loaded: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* 加载完成前用透明遮住底层占位图标, 避免快速滚动时露出 <img> 的浏览器原生裂图 */
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity 120ms ease-out;
`;

const Name = styled.div`
  max-width: 210px;
  font-family: ${FONT};
  font-weight: 800;
  line-height: 1.45;
  color: rgb(75 75 75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  max-width: 170px;
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

const SingerButton = styled.button`
  max-width: 170px;
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
    transform: translateY(2px);
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

const TypeTag = styled(Tag)`
  color: ${CSSVariable.COLOR_PRIMARY};
`;

const Muted = styled.span`
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
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

const FileInfoBox = styled.div`
  min-width: 170px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${FONT};
  font-weight: 800;
  line-height: 1.4;
  color: rgb(75 75 75);
  white-space: nowrap;
`;

const FileInfoText = styled.div`
  min-width: 0;
  flex: 1;
`;

const FileInfoSecondary = styled.div`
  margin-top: 2px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  width: 34px;
  height: 34px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  padding: 0;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  color: ${({ $active }) =>
    $active ? CSSVariable.COLOR_PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
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

const formatCreateUser = (music: MusicItem) => {
  const { createUser } = music;
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

const formatDurationMs = (durationMs: number) => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minute = Math.floor(totalSeconds / 60);
  const second = totalSeconds % 60;
  return `${minute > 9 ? minute : `0${minute}`}:${
    second > 9 ? second : `0${second}`
  }`;
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)}KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)}MB`;
};

const formatBitRate = (bitRate: number) => `${Math.round(bitRate / 1000)}kbps`;

function MusicFileInfo({ music }: { music: MusicItem }) {
  const primary = [
    music.assetDurationMs ? formatDurationMs(music.assetDurationMs) : '',
    music.assetSize ? formatFileSize(music.assetSize) : '',
  ].filter(Boolean);
  const secondary = [
    music.assetCodec ? music.assetCodec.toUpperCase() : '',
    music.assetBitRate ? formatBitRate(music.assetBitRate) : '',
  ].filter(Boolean);

  const hasInfo = primary.length || secondary.length;

  return (
    <FileInfoBox>
      <ActionButton
        type="button"
        title={t('open_original_music_file')}
        aria-label={t('open_original_music_file')}
        onClick={() =>
          window.open(music.asset, '_blank', 'noopener,noreferrer')
        }
      >
        <MdOpenInNew size={18} />
      </ActionButton>
      <FileInfoText>
        {hasInfo ? (
          <>
            {primary.length ? <div>{primary.join(' · ')}</div> : null}
            {secondary.length ? (
              <FileInfoSecondary>{secondary.join(' · ')}</FileInfoSecondary>
            ) : null}
          </>
        ) : (
          <Muted>{t('unknown')}</Muted>
        )}
      </FileInfoText>
    </FileInfoBox>
  );
}

function LazyCover({
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
    // src 变化时重置, 防止旧封面/旧加载状态泄漏到新封面
    setLoaded(false);
    const image = ref.current;
    if (!image) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      image.src = src;
      observer.disconnect();
    });
    observer.observe(image);
    return () => observer.disconnect();
  }, [src]);

  return (
    <CoverButton type="button" {...props}>
      {/* 占位图标始终存在, 加载完成前作为兜底显示, 避免裂图 */}
      <MdMusicNote />
      <Cover
        ref={ref}
        alt={alt}
        decoding="async"
        $loaded={loaded}
        onLoad={() => setLoaded(true)}
      />
    </CoverButton>
  );
}

function MusicList({
  reloadToken = 0,
  onEdit,
  onSingerEdit,
}: {
  reloadToken?: number;
  onEdit: (id: string) => void;
  onSingerEdit: (id: string) => void;
}) {
  const navigate = useNavigate();
  const compactPagination = useWindowWidth() <= MOBILE_BREAKPOINT;
  const query = useQuery<
    | Query.KEYWORD
    | Query.PAGE
    | MusicManagementQuery.FILTER_KEY
    | MusicManagementQuery.PAGE_SIZE
    | MusicManagementQuery.SORT_BY
    | MusicManagementQuery.SORT_ORDER
  >();
  const keyword = query[Query.KEYWORD] ?? '';
  const filterKey = parseFilterKey(query[MusicManagementQuery.FILTER_KEY]);
  const page = parsePage(query[Query.PAGE]);
  const pageSize = parsePageSize(query[MusicManagementQuery.PAGE_SIZE]);
  const sortBy = parseSortBy(query[MusicManagementQuery.SORT_BY]);
  const sortOrder = sortBy
    ? parseSortOrder(query[MusicManagementQuery.SORT_ORDER]) ??
      AdminMusicListSortOrder.DESC
    : undefined;
  const [data, setData] = useState<Data>({
    error: null,
    loading: true,
    total: 0,
    musicList: [],
  });
  const [viewerPhoto, setViewerPhoto] = useState<ImageViewerPhoto | null>(null);
  const [playerMusic, setPlayerMusic] = useState<MusicItem | null>(null);
  const [playerPlayToken, setPlayerPlayToken] = useState(0);
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
          [MusicManagementQuery.FILTER_KEY]:
            filterKey === AdminMusicListFilterKey.ALL ? undefined : filterKey,
          [Query.PAGE]: page === 1 ? undefined : page,
          [MusicManagementQuery.PAGE_SIZE]:
            pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize,
          [MusicManagementQuery.SORT_BY]: sortBy,
          [MusicManagementQuery.SORT_ORDER]:
            sortOrder && sortOrder !== AdminMusicListSortOrder.DESC
              ? sortOrder
              : undefined,
          ...query,
        },
        replace,
      }),
    [filterKey, keyword, navigate, page, pageSize, sortBy, sortOrder],
  );

  useEffect(() => {
    if (!composingKeywordRef.current) {
      setKeywordInput(keyword);
    }
  }, [keyword]);

  const onKeywordChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setKeywordInput(event.target.value);
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

  const requestMusicList = useCallback(
    ({
      signal,
      page: requestPage = page,
      keyword: requestKeyword = keyword,
      filterKey: requestFilterKey = filterKey,
    }: {
      signal?: AbortSignal;
      page?: number;
      keyword?: string;
      filterKey?: AdminMusicListFilterKey;
    } = {}) => {
      setData((d) => ({
        ...d,
        error: null,
        loading: true,
      }));
      return adminGetMusicList({
        page: requestPage,
        pageSize,
        keyword: requestKeyword.trim(),
        filterKey: requestFilterKey,
        sortBy,
        sortOrder,
        requestMinimalDuration: 0,
      })
        .then((result) => {
          if (signal?.aborted) return;
          setData({
            error: null,
            loading: false,
            total: result.total,
            musicList: result.musicList,
          });
        })
        .catch((error) => {
          if (signal?.aborted) return;
          setData({
            error,
            loading: false,
            total: 0,
            musicList: [],
          });
        });
    },
    [filterKey, keyword, page, pageSize, sortBy, sortOrder],
  );

  useEffect(() => {
    const controller = new AbortController();
    void requestMusicList({ signal: controller.signal });
    return () => controller.abort();
  }, [requestMusicList, reloadToken]);

  const onHeatSortClick = useCallback(() => {
    if (sortBy !== AdminMusicListSortBy.HEAT) {
      updateQuery({
        [MusicManagementQuery.SORT_BY]: AdminMusicListSortBy.HEAT,
        [MusicManagementQuery.SORT_ORDER]: undefined,
        [Query.PAGE]: undefined,
      });
      return;
    }
    if (sortOrder === AdminMusicListSortOrder.DESC) {
      updateQuery({
        [MusicManagementQuery.SORT_BY]: AdminMusicListSortBy.HEAT,
        [MusicManagementQuery.SORT_ORDER]: AdminMusicListSortOrder.ASC,
        [Query.PAGE]: undefined,
      });
      return;
    }
    updateQuery({
      [MusicManagementQuery.SORT_BY]: undefined,
      [MusicManagementQuery.SORT_ORDER]: undefined,
      [Query.PAGE]: undefined,
    });
  }, [sortBy, sortOrder, updateQuery]);

  useEffect(() => {
    if (!playerMusic) return;

    const latestMusic = data.musicList.find((music) => music.id === playerMusic.id);
    if (latestMusic && latestMusic !== playerMusic) {
      setPlayerMusic(latestMusic);
    }
  }, [data.musicList, playerMusic]);

  const reload = useCallback(() => {
    void requestMusicList();
  }, [requestMusicList]);

  const playMusic = useCallback((music: MusicItem) => {
    setPlayerMusic(music);
    setPlayerPlayToken((token) => token + 1);
  }, []);

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
    <Card>
      <Toolbar>
        <Select
          size="sm"
          options={filterOptions}
          value={filterKey}
          onChange={(value) => {
            updateQuery({
              [MusicManagementQuery.FILTER_KEY]:
                value === AdminMusicListFilterKey.ALL ? undefined : value,
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
            <MdSearch />
          </Button>
        </SearchForm>
      </Toolbar>

      <Content>
        {data.error ? (
          <StatusBox>
            <ErrorCard errorMessage={data.error.message} retry={reload} />
          </StatusBox>
        ) : data.loading ? (
          <StatusBox>
            <Spinner />
          </StatusBox>
        ) : data.musicList.length === 0 ? (
          <StatusBox>
            {/* 后台音乐列表为空时统一复用 Empty 组件展示空状态。 */}
            <Empty description={t('no_suitable_music')} />
          </StatusBox>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>{capitalize(t('music_id'))}</Th>
                  <Th>{capitalize(t('cover'))}</Th>
                  <Th>{capitalize(t('name'))}</Th>
                  <Th>{capitalize(t('alias'))}</Th>
                  <Th>{capitalize(t('singer'))}</Th>
                  <Th>{capitalize(t('music_type_short'))}</Th>
                  <Th>{capitalize(t('file_info'))}</Th>
                  <Th>{capitalize(t('year_of_issue'))}</Th>
                  <Th>
                    <SortHeaderButton
                      type="button"
                      $active={sortBy === AdminMusicListSortBy.HEAT}
                      onClick={onHeatSortClick}
                      title={capitalize(t('music_heat'))}
                    >
                      {capitalize(t('music_heat'))}
                      {sortBy === AdminMusicListSortBy.HEAT ? (
                        sortOrder === AdminMusicListSortOrder.ASC ? (
                          <MdArrowUpward />
                        ) : (
                          <MdArrowDownward />
                        )
                      ) : (
                        <MdUnfoldMore />
                      )}
                    </SortHeaderButton>
                  </Th>
                  <Th>{capitalize(t('creator'))}</Th>
                  <Th>{capitalize(t('create_time'))}</Th>
                  <Th>{capitalize(t('manage'))}</Th>
                </tr>
              </thead>
              <tbody>
                {data.musicList.map((music) => (
                  <tr key={music.id}>
                    <Td>
                      <Mono>{music.id}</Mono>
                    </Td>
                    <Td>
                      {/* 无封面时不使用默认图, 让封面列保持为空。 */}
                      {music.cover ? (
                        <LazyCover
                          src={getResizedImage({
                            url: music.cover,
                            size: COVER_SIZE * 2,
                          })}
                          alt={music.name}
                          title={music.name}
                          onClick={() =>
                            setViewerPhoto({
                              src: music.cover,
                              alt: music.name,
                            })
                          }
                        />
                      ) : null}
                    </Td>
                    <Td>
                      <Name title={music.name}>{music.name}</Name>
                    </Td>
                    <Td>
                      {music.aliases.length ? (
                        <TagList>
                          {music.aliases.map((alias, index) => (
                            <Tag key={`${alias}-${index}`} title={alias}>
                              {alias}
                            </Tag>
                          ))}
                        </TagList>
                      ) : null}
                    </Td>
                    <Td>
                      {music.singers.length ? (
                        <TagList>
                          {music.singers.map((singer) => (
                            <SingerButton
                              key={singer.id}
                              type="button"
                              title={singer.name}
                              onClick={() => onSingerEdit(singer.id)}
                            >
                              {singer.name}
                            </SingerButton>
                          ))}
                        </TagList>
                      ) : (
                        <Muted>{t('unknown')}</Muted>
                      )}
                    </Td>
                    <Td>
                      <TypeTag>
                        {MUSIC_TYPE_MAP[music.type]?.label ?? t('unknown')}
                      </TypeTag>
                    </Td>
                    <Td>
                      <MusicFileInfo music={music} />
                    </Td>
                    <Td>
                      {music.year === null ? (
                        <Muted>{t('unknown')}</Muted>
                      ) : (
                        music.year
                      )}
                    </Td>
                    <Td>
                      <Mono>{music.heat}</Mono>
                    </Td>
                    <Td>{formatCreateUser(music)}</Td>
                    <Td>
                      {day(music.createTimestamp).format('YYYY-MM-DD HH:mm')}
                    </Td>
                    <Td>
                      <ActionGroup>
                        <ActionButton
                          type="button"
                          title={t('play')}
                          aria-label={t('play')}
                          $active={playerMusic?.id === music.id}
                          onClick={() => playMusic(music)}
                        >
                          <MdPlayArrow size={18} />
                        </ActionButton>
                        <ActionButton
                          type="button"
                          title={t('edit_name')}
                          aria-label={t('edit_name')}
                          onClick={() => onEdit(music.id)}
                        >
                          <MdOutlineEdit size={18} />
                        </ActionButton>
                      </ActionGroup>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
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
                    [MusicManagementQuery.PAGE_SIZE]:
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
                updateQuery(
                  {
                    [Query.PAGE]: nextPage === 1 ? undefined : nextPage,
                  },
                  {
                    replace: false,
                  },
                )
              }
            />
          </PaginationBox>
        ) : null}
      </Footer>
      <ImageViewer photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />
      <FloatingMusicPlayer
        music={playerMusic}
        playToken={playerPlayToken}
        onClose={() => setPlayerMusic(null)}
      />
    </Card>
  );
}

export default MusicList;
