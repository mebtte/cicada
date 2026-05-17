import {
  ChangeEventHandler,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import {
  MdOutlineAddBox,
  MdOutlineEdit,
  MdPeopleOutline,
  MdSearch,
} from 'react-icons/md';
import Avatar from '@/components/avatar';
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
import useNavigate from '@/utils/use_navigate';
import useQuery from '@/utils/use_query';
import useWindowWidth from '@/utils/use_window_width';
import getResizedImage from '@/server/asset/get_resized_image';
import { isComposingEnterKeyDown } from '@/utils/keyboard';
import adminGetUserList from '@/server/api/admin_get_user_list';
import UserEditDrawer from '../components/user_edit/drawer';
import type { User } from '../components/user_edit/types';
import CreateUserDialog from './create_user_dialog';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;
const AVATAR_SIZE = 38;
const MOBILE_BREAKPOINT = 640;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const TABLE_ROW_GAP = 10;

enum UserManagementQuery {
  FILTER_KEY = 'filter_key',
  PAGE_SIZE = 'page_size',
}

enum UserListFilterKey {
  ALL = 'all',
  USERNAME = 'username',
  NICKNAME = 'nickname',
  REMARK = 'remark',
}

interface Data {
  error: Error | null;
  loading: boolean;
  userList: User[];
}

const filterOptions: SelectOption<UserListFilterKey>[] = [
  {
    label: capitalize(t('all')),
    value: UserListFilterKey.ALL,
  },
  {
    label: capitalize(t('username')),
    value: UserListFilterKey.USERNAME,
  },
  {
    label: capitalize(t('nickname')),
    value: UserListFilterKey.NICKNAME,
  },
  {
    label: capitalize(t('remark')),
    value: UserListFilterKey.REMARK,
  },
];

const filterKeyValues = new Set<string>(Object.values(UserListFilterKey));

const parseFilterKey = (value?: string) =>
  value && filterKeyValues.has(value)
    ? (value as UserListFilterKey)
    : UserListFilterKey.ALL;

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
  padding: 0 20px 92px;
  background: rgb(247 247 247);
  overflow: auto;
  scroll-padding-bottom: 92px;
  ${autoScrollbar}
`;

const Table = styled.table`
  width: 100%;
  min-width: 1220px;
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

const UserName = styled.div`
  font-family: ${FONT};
  font-weight: 800;
  line-height: 1.45;
  color: rgb(75 75 75);
`;

const Remark = styled.div`
  max-width: 240px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MusicbillCount = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
  white-space: nowrap;

  > .total {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-weight: 800;
  }

  > .public {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: 11px;
    font-weight: 700;
  }
`;

const Badge = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  max-width: 160px;
  padding: 4px 8px;
  border: 2px solid
    ${({ $active }) =>
      $active ? CSSVariable.COLOR_PRIMARY : CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 0
    ${({ $active }) =>
      $active ? 'var(--cicada-color-primary-shadow)' : ROW_SHADOW};
  color: ${({ $active }) =>
    $active ? CSSVariable.COLOR_PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Muted = styled.span`
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
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

const formatTimestamp = (timestamp: number) =>
  timestamp ? day(timestamp).format('YYYY-MM-DD HH:mm') : t('unknown');

const getSearchText = (user: User, filterKey: UserListFilterKey) => {
  switch (filterKey) {
    case UserListFilterKey.USERNAME:
      return user.username;
    case UserListFilterKey.NICKNAME:
      return user.nickname;
    case UserListFilterKey.REMARK:
      return user.remark;
    default:
      return [user.username, user.nickname, user.remark].join(' ');
  }
};

function UserManagement() {
  const navigate = useNavigate();
  const compactPagination = useWindowWidth() <= MOBILE_BREAKPOINT;
  const query = useQuery<
    | Query.KEYWORD
    | Query.PAGE
    | UserManagementQuery.FILTER_KEY
    | UserManagementQuery.PAGE_SIZE
  >();
  const keyword = query[Query.KEYWORD] ?? '';
  const filterKey = parseFilterKey(query[UserManagementQuery.FILTER_KEY]);
  const page = parsePage(query[Query.PAGE]);
  const pageSize = parsePageSize(query[UserManagementQuery.PAGE_SIZE]);
  const [data, setData] = useState<Data>({
    error: null,
    loading: true,
    userList: [],
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
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
          [UserManagementQuery.FILTER_KEY]:
            filterKey === UserListFilterKey.ALL ? undefined : filterKey,
          [Query.PAGE]: page === 1 ? undefined : page,
          [UserManagementQuery.PAGE_SIZE]:
            pageSize === DEFAULT_PAGE_SIZE ? undefined : pageSize,
          ...query,
        },
        replace,
      }),
    [filterKey, keyword, navigate, page, pageSize],
  );

  useEffect(() => {
    if (!composingKeywordRef.current) {
      setKeywordInput(keyword);
    }
  }, [keyword]);

  const requestUserList = useCallback(
    ({ signal }: { signal?: AbortSignal } = {}) => {
      setData((d) => ({
        ...d,
        error: null,
        loading: true,
      }));
      return adminGetUserList()
        .then((userList) => {
          if (signal?.aborted) return;
          setData({
            error: null,
            loading: false,
            userList,
          });
        })
        .catch((error) => {
          if (signal?.aborted) return;
          setData({
            error,
            loading: false,
            userList: [],
          });
        });
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void requestUserList({ signal: controller.signal });
    return () => controller.abort();
  }, [requestUserList]);

  const reload = useCallback(() => {
    void requestUserList();
  }, [requestUserList]);

  const filteredUserList = useMemo(() => {
    const lowerCaseKeyword = keyword.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!lowerCaseKeyword) {
      return data.userList;
    }

    return data.userList.filter((user) =>
      getSearchText(user, filterKey).toLowerCase().includes(lowerCaseKeyword),
    );
  }, [data.userList, filterKey, keyword]);

  const totalPageCount = Math.ceil(filteredUserList.length / pageSize);
  useEffect(() => {
    if (data.loading || data.error || filteredUserList.length === 0) return;
    if (totalPageCount > 0 && page > totalPageCount) {
      updateQuery({
        [Query.PAGE]: totalPageCount === 1 ? undefined : totalPageCount,
      });
    }
  }, [
    data.error,
    data.loading,
    filteredUserList.length,
    page,
    totalPageCount,
    updateQuery,
  ]);

  const visibleUserList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUserList.slice(start, start + pageSize);
  }, [filteredUserList, page, pageSize]);

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

  const resetListQuery = useCallback(() => {
    updateQuery({
      [Query.KEYWORD]: undefined,
      [UserManagementQuery.FILTER_KEY]: undefined,
      [Query.PAGE]: undefined,
      [UserManagementQuery.PAGE_SIZE]: undefined,
    });
  }, [updateQuery]);

  const onCreated = useCallback(() => {
    if (
      keyword ||
      filterKey !== UserListFilterKey.ALL ||
      page !== 1 ||
      pageSize !== DEFAULT_PAGE_SIZE
    ) {
      resetListQuery();
    }
    reload();
  }, [filterKey, keyword, page, pageSize, reload, resetListQuery]);

  const onDeleted = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      userList: d.userList.filter((user) => user.id !== id),
    }));
  }, []);

  const rangeStart =
    filteredUserList.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredUserList.length);

  return (
    <Card>
      <Toolbar>
        <Select
          size="sm"
          options={filterOptions}
          value={filterKey}
          onChange={(value) => {
            updateQuery({
              [UserManagementQuery.FILTER_KEY]:
                value === UserListFilterKey.ALL ? undefined : value,
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
        ) : visibleUserList.length === 0 ? (
          <EmptyTip>
            <MdPeopleOutline />
            {t('no_suitable_user')}
          </EmptyTip>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>{capitalize(t('username'))}</Th>
                  <Th>{capitalize(t('avatar'))}</Th>
                  <Th>{capitalize(t('nickname'))}</Th>
                  <Th>{capitalize(t('role'))}</Th>
                  <Th>2FA</Th>
                  <Th>{capitalize(t('remark'))}</Th>
                  <Th>{capitalize(t('musicbill_count_column'))}</Th>
                  <Th>{capitalize(t('last_active_time'))}</Th>
                  <Th>{capitalize(t('join_time'))}</Th>
                  <Th>{capitalize(t('manage'))}</Th>
                </tr>
              </thead>
              <tbody>
                {visibleUserList.map((user) => (
                  <tr key={user.id}>
                    <Td>
                      <UserName title={user.username}>
                        @{user.username}
                      </UserName>
                    </Td>
                    <Td>
                      {/* 无头像时不使用默认图, 让头像列保持为空。 */}
                      {user.avatar ? (
                        <Avatar
                          src={getResizedImage({
                            url: user.avatar,
                            size: AVATAR_SIZE * 2,
                          })}
                          size={AVATAR_SIZE}
                        />
                      ) : null}
                    </Td>
                    <Td>
                      {user.nickname ? (
                        <UserName title={user.nickname}>{user.nickname}</UserName>
                      ) : (
                        <Muted>{t('unknown')}</Muted>
                      )}
                    </Td>
                    <Td>
                      <Badge $active={!!user.admin}>
                        {user.admin ? t('admin') : t('user')}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge $active={user.twoFAEnabled}>
                        {user.twoFAEnabled ? t('enabled') : t('disabled')}
                      </Badge>
                    </Td>
                    <Td>
                      {user.remark ? (
                        <Remark title={user.remark}>{user.remark}</Remark>
                      ) : null}
                    </Td>
                    <Td>
                      <MusicbillCount>
                        <span className="total">{user.musicbillCount}</span>
                        <span className="public">
                          {t(
                            'public_musicbill_count_label',
                            user.publicMusicbillCount.toString(),
                          )}
                        </span>
                      </MusicbillCount>
                    </Td>
                    <Td>{formatTimestamp(user.lastActiveTimestamp)}</Td>
                    <Td>{formatTimestamp(user.joinTimestamp)}</Td>
                    <Td>
                      <ActionButton
                        type="button"
                        title={t('manage')}
                        aria-label={t('manage')}
                        onClick={() => setEditUser(user)}
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
        <FloatingCreateButton
          square
          size="lg"
          variant="primary"
          icon={<MdOutlineAddBox />}
          aria-label={t('create_user')}
          title={t('create_user')}
          onClick={() => setCreateDialogOpen(true)}
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
                filteredUserList.length.toString(),
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
                    [UserManagementQuery.PAGE_SIZE]:
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

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={onCreated}
      />
      <UserEditDrawer
        open={editUser !== null}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={reload}
        onDeleted={onDeleted}
      />
    </Card>
  );
}

export default UserManagement;
