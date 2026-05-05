import {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import {
  MdClose,
  MdOutlineAddBox,
  MdOutlineEdit,
  MdRecordVoiceOver,
} from 'react-icons/md';
import Button from '@/components/button';
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
import notice from '@/utils/notice';
import useNavigate from '@/utils/use_navigate';
import useQuery from '@/utils/use_query';
import useWindowWidth from '@/utils/use_window_width';
import getResizedImage from '@/server/asset/get_resized_image';
import adminGetSingerList, {
  AdminSingerListFilterKey,
} from '@/server/api/admin_get_singer_list';
import { ADMIN_PATH, ROOT_PATH } from '@/constants/route';
import openCreateSingerDialog from '../open_create_singer_dialog';
import SingerEditDrawer from './singer_edit_drawer';
import SingerEditPage from './singer_edit_page';
import type { Singer } from './types';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;
const PHOTO_SIZE = 36;
const VIEWER_ANIMATION_DURATION = 180;
const EDIT_PAGE_BREAKPOINT = 760;

enum SingerManagementQuery {
  FILTER_KEY = 'filter_key',
  PAGE_SIZE = 'page_size',
}

interface Data {
  error: Error | null;
  loading: boolean;
  total: number;
  singerList: Singer[];
}

interface ViewerPhoto {
  src: string;
  alt: string;
}

const filterOptions: SelectOption<AdminSingerListFilterKey>[] = [
  {
    label: capitalize(t('all')),
    value: AdminSingerListFilterKey.ALL,
  },
  {
    label: 'ID',
    value: AdminSingerListFilterKey.ID,
  },
  {
    label: capitalize(t('name')),
    value: AdminSingerListFilterKey.NAME,
  },
  {
    label: capitalize(t('alias')),
    value: AdminSingerListFilterKey.ALIAS,
  },
];

const filterKeyValues = new Set<string>(Object.values(AdminSingerListFilterKey));

const parseFilterKey = (value?: string) =>
  value && filterKeyValues.has(value)
    ? (value as AdminSingerListFilterKey)
    : AdminSingerListFilterKey.ALL;

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
  grid-template-columns: 180px minmax(220px, 420px) max-content;
  gap: 12px;
  align-items: start;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;

const StatusBox = styled.div`
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const EmptyTip = styled.div`
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  font-size: 13px;

  > svg {
    font-size: 36px;
  }
`;

const TableScroll = styled.div`
  height: 100%;
  overflow: auto;
  ${autoScrollbar}
`;

const Table = styled.table`
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
`;

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  height: 42px;
  padding: 0 20px;
  background: #fafafa;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px 20px;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: 13px;
  vertical-align: middle;
`;

const Mono = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const Name = styled.div`
  font-weight: 600;
  line-height: 1.45;
`;

const AliasList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Alias = styled.span`
  max-width: 180px;
  padding: 3px 7px;
  border-radius: 999px;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
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
  width: ${PHOTO_SIZE}px;
  height: ${PHOTO_SIZE}px;
  border: none;
  border-radius: 6px;
  padding: 0;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  cursor: zoom-in;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
  }
`;

const Photo = styled.img`
  width: ${PHOTO_SIZE}px;
  height: ${PHOTO_SIZE}px;
  object-fit: cover;
  display: block;
`;

const Muted = styled.span`
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
`;

const UserName = styled.div`
  font-weight: 500;
  line-height: 1.45;
`;

const UserAccount = styled.div`
  margin-top: 2px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
`;

const ActionButton = styled.button`
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 120ms,
    color 120ms;

  &:hover {
    background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    color: ${CSSVariable.COLOR_PRIMARY};
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
  }
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 1px solid ${CSSVariable.COLOR_BORDER};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FooterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const PageSizeSelectBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PageSizeLabel = styled.span`
  white-space: nowrap;
`;

const PageSizeSelectControl = styled.div`
  width: 82px;
`;

const PaginationBox = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 640px) {
    justify-content: center;
  }
`;

const ViewerBackdrop = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgb(0 0 0 / 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 160ms ease;
`;

const ViewerPanel = styled.div<{ $visible: boolean }>`
  position: relative;
  max-width: min(960px, 100%);
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: scale(${({ $visible }) => ($visible ? 1 : 0.96)});
  transition:
    opacity 160ms ease,
    transform ${VIEWER_ANIMATION_DURATION}ms cubic-bezier(0.2, 0.8, 0.2, 1);
`;

const ViewerImage = styled.img`
  max-width: 100%;
  max-height: calc(100vh - 56px);
  object-fit: contain;
  border-radius: 10px;
  background: #111;
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.36);
`;

const ViewerCloseButton = styled.button`
  position: absolute;
  top: -14px;
  right: -14px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.24);
`;

const formatCreateUser = (singer: Singer) => {
  const { createUser } = singer;
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

  useEffect(() => {
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
      <Photo ref={ref} alt={alt} decoding="async" />
    </PhotoButton>
  );
}

function ImageViewer({
  photo,
  onClose,
}: {
  photo: ViewerPhoto;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    window.setTimeout(onClose, VIEWER_ANIMATION_DURATION);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    createPortal(<ViewerBackdrop $visible={visible} onClick={close}>
      <ViewerPanel
        $visible={visible}
        onClick={(event) => event.stopPropagation()}
      >
        <ViewerImage src={photo.src} alt={photo.alt} decoding="async" />
        <ViewerCloseButton
          type="button"
          aria-label="Close image viewer"
          onClick={close}
        >
          <MdClose size={20} />
        </ViewerCloseButton>
      </ViewerPanel>
    </ViewerBackdrop>, document.body)
  );
}

function SingerManagement() {
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const query = useQuery<
    | Query.KEYWORD
    | Query.PAGE
    | SingerManagementQuery.FILTER_KEY
    | SingerManagementQuery.PAGE_SIZE
  >();
  const keyword = query[Query.KEYWORD] ?? '';
  const filterKey = parseFilterKey(query[SingerManagementQuery.FILTER_KEY]);
  const page = parsePage(query[Query.PAGE]);
  const pageSize = parsePageSize(query[SingerManagementQuery.PAGE_SIZE]);
  const [data, setData] = useState<Data>({
    error: null,
    loading: true,
    total: 0,
    singerList: [],
  });
  const [viewerPhoto, setViewerPhoto] = useState<ViewerPhoto | null>(null);
  const [editSingerId, setEditSingerId] = useState<string | null>(null);

  const updateQuery = useCallback(
    (
      query: Record<string, number | string | undefined>,
      { replace = true }: { replace?: boolean } = {},
    ) =>
      navigate({
        query: {
          [Query.KEYWORD]: encodeKeyword(keyword),
          [SingerManagementQuery.FILTER_KEY]:
            filterKey === AdminSingerListFilterKey.ALL ? undefined : filterKey,
          [Query.PAGE]: page === 1 ? undefined : page,
          [SingerManagementQuery.PAGE_SIZE]:
            pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize,
          ...query,
        },
        replace,
      }),
    [filterKey, keyword, navigate, page, pageSize],
  );

  const getCurrentListQuery = useCallback(
    () => ({
      [Query.KEYWORD]: encodeKeyword(keyword),
      [SingerManagementQuery.FILTER_KEY]:
        filterKey === AdminSingerListFilterKey.ALL ? undefined : filterKey,
      [Query.PAGE]: page === 1 ? undefined : page,
      [SingerManagementQuery.PAGE_SIZE]:
        pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize,
    }),
    [filterKey, keyword, page, pageSize],
  );

  const onKeywordChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const nextKeyword = event.target.value;
    updateQuery({
      [Query.KEYWORD]: encodeKeyword(nextKeyword),
      [Query.PAGE]: undefined,
    });
  };

  const requestSingerList = useCallback(
    ({
      signal,
      page: requestPage = page,
      keyword: requestKeyword = keyword,
      filterKey: requestFilterKey = filterKey,
    }: {
      signal?: AbortSignal;
      page?: number;
      keyword?: string;
      filterKey?: AdminSingerListFilterKey;
    } = {}) => {
      setData((d) => ({
        ...d,
        error: null,
        loading: true,
      }));
      return adminGetSingerList({
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
            singerList: result.singerList,
          });
        })
        .catch((error) => {
          if (signal?.aborted) return;
          setData({
            error,
            loading: false,
            total: 0,
            singerList: [],
          });
        });
    },
    [filterKey, keyword, page, pageSize],
  );

  useEffect(() => {
    const controller = new AbortController();
    void requestSingerList({ signal: controller.signal });
    return () => controller.abort();
  }, [requestSingerList]);

  const reload = useCallback(() => {
    void requestSingerList();
  }, [requestSingerList]);

  const onOpenCreateSingerDialog = useCallback(() => {
    openCreateSingerDialog({
      onCreated: () => {
        notice.info(t('created'));
        if (
          !keyword &&
          filterKey === AdminSingerListFilterKey.ALL &&
          page === 1 &&
          pageSize === DEFAULT_PAGE_SIZE
        ) {
          reload();
        } else {
          updateQuery({
            [Query.KEYWORD]: undefined,
            [SingerManagementQuery.FILTER_KEY]: undefined,
            [Query.PAGE]: undefined,
            [SingerManagementQuery.PAGE_SIZE]: undefined,
          });
        }
      },
    });
  }, [filterKey, keyword, page, pageSize, reload, updateQuery]);

  const onEditSinger = useCallback(
    (id: string) => {
      if (windowWidth <= EDIT_PAGE_BREAKPOINT) {
        navigate({
          path: `${ROOT_PATH.ADMIN}/${ADMIN_PATH.SINGER_MANAGEMENT}/${id}`,
          query: getCurrentListQuery(),
        });
        return;
      }
      setEditSingerId(id);
    },
    [getCurrentListQuery, navigate, windowWidth],
  );

  useEffect(() => {
    if (!editSingerId || windowWidth > EDIT_PAGE_BREAKPOINT) return;
    navigate({
      path: `${ROOT_PATH.ADMIN}/${ADMIN_PATH.SINGER_MANAGEMENT}/${editSingerId}`,
      query: getCurrentListQuery(),
    });
    setEditSingerId(null);
  }, [editSingerId, getCurrentListQuery, navigate, windowWidth]);

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
                [SingerManagementQuery.FILTER_KEY]:
                  value === AdminSingerListFilterKey.ALL ? undefined : value,
                [Query.PAGE]: undefined,
              });
            }}
          />
          <Input
            size="sm"
            value={keyword}
            onChange={onKeywordChange}
            placeholder={t('search')}
          />
          <Button
            size="sm"
            variant="primary"
            icon={<MdOutlineAddBox />}
            onClick={onOpenCreateSingerDialog}
          >
            {t('create_singer')}
          </Button>
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
          ) : data.singerList.length === 0 ? (
            <EmptyTip>
              <MdRecordVoiceOver />
              {t('no_suitable_singer')}
            </EmptyTip>
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th>{capitalize(t('singer_id'))}</Th>
                    <Th>{capitalize(t('name'))}</Th>
                    <Th>{capitalize(t('alias'))}</Th>
                    <Th>{capitalize(t('photo'))}</Th>
                    <Th>{capitalize(t('creator'))}</Th>
                    <Th>{capitalize(t('create_time'))}</Th>
                    <Th>{capitalize(t('manage'))}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.singerList.map((singer) => (
                    <tr key={singer.id}>
                      <Td>
                        <Mono>{singer.id}</Mono>
                      </Td>
                      <Td>
                        <Name title={singer.name}>{singer.name}</Name>
                      </Td>
                      <Td>
                        {singer.aliases.length ? (
                          <AliasList>
                            {singer.aliases.map((alias, index) => (
                              <Alias key={`${alias}-${index}`} title={alias}>
                                {alias}
                              </Alias>
                            ))}
                          </AliasList>
                        ) : null}
                      </Td>
                      <Td>
                        {singer.photos.length ? (
                          <PhotoList>
                            {singer.photos.map((photo) => (
                              <LazyPhoto
                                key={photo.id}
                                src={getResizedImage({
                                  url: photo.asset,
                                  size: PHOTO_SIZE * 2,
                                })}
                                alt={photo.description || singer.name}
                                title={photo.description || singer.name}
                                onClick={() =>
                                  setViewerPhoto({
                                    src: photo.asset,
                                    alt: photo.description || singer.name,
                                  })
                                }
                              />
                            ))}
                          </PhotoList>
                        ) : null}
                      </Td>
                      <Td>{formatCreateUser(singer)}</Td>
                      <Td>
                        {day(singer.createTimestamp).format(
                          'YYYY-MM-DD HH:mm',
                        )}
                      </Td>
                      <Td>
                        <ActionButton
                          type="button"
                          title={t('modify_singer')}
                          aria-label={t('modify_singer')}
                          onClick={() => onEditSinger(singer.id)}
                        >
                          <MdOutlineEdit size={18} />
                        </ActionButton>
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
            <div>
              {t(
                'page_result_range',
                rangeStart.toString(),
                rangeEnd.toString(),
                data.total.toString(),
              )}
            </div>
            <PageSizeSelectBox>
              <PageSizeLabel>{t('items_per_page')}</PageSizeLabel>
              <PageSizeSelectControl>
                <Select
                  size="sm"
                  options={pageSizeOptions}
                  value={pageSize}
                  menuPlacement="top"
                  onChange={(nextPageSize) =>
                    updateQuery({
                      [SingerManagementQuery.PAGE_SIZE]:
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
      {viewerPhoto ? (
        <ImageViewer
          photo={viewerPhoto}
          onClose={() => setViewerPhoto(null)}
        />
      ) : null}
      <SingerEditDrawer
        open={editSingerId !== null}
        singerId={editSingerId}
        onClose={() => setEditSingerId(null)}
        onSaved={reload}
      />
      <SingerEditPage onSaved={reload} />
    </ScrollArea>
  );
}

export default SingerManagement;
