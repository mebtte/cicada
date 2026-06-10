import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import absoluteFullSize from '@/style/absolute_full_size';
import autoScrollbar from '@/style/auto_scrollbar';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import Cover, { Shape } from '@/components/cover';
import getResizedImage from '@/server/asset/get_resized_image';
import useData from './use_data';
import { UserDetail as UserDetailType } from './constants';
import Info from './info';
import MusicbillList from './musicbill_list';

const TRANSITION = {
  from: { opacity: 0 },
  enter: { opacity: 1 },
  leave: { opacity: 0 },
};
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const DetailContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;

  > .scrollable {
    flex: 1;
    min-height: 0;
    overflow: auto;
    ${autoScrollbar}

    > .first-screen {
      min-height: 100%;
    }
  }
`;
const Header = styled(DrawerHeader)<{ $visible: boolean }>`
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  padding: 0 20px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  pointer-events: none;

  background-color: ${({ $visible }) =>
    $visible ? 'rgb(255 255 255 / 0.92)' : 'transparent'};
  border-bottom: 1px solid
    ${({ $visible }) => ($visible ? 'rgb(229 229 229)' : 'transparent')};
  backdrop-filter: ${({ $visible }) => ($visible ? 'blur(8px)' : 'none')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? 0 : '-4px')});
  transition:
    opacity 160ms ease,
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
`;
const HeaderAvatar = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  margin-right: 10px;
  padding: 2px;
  box-sizing: border-box;

  background: #fff;
  border: 2px solid rgb(210 210 210);
  border-radius: 14px;
  box-shadow: 0 4px 0 rgb(210 210 210);

  > .header-avatar-image {
    border-radius: 10px;
  }
`;
const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;
const titleStyle = css`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  && {
    color: rgb(50 50 50);
    font-weight: 800;
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: 0.2px;
  }
`;
const UserDrawerTitle = styled(DrawerTitle)`
  ${titleStyle}
`;
const descriptionStyle = css`
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  && {
    margin-top: 4px;
    color: rgb(140 140 140);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.1px;
  }
`;
const UserDrawerDescription = styled(DrawerDescription)`
  ${descriptionStyle}
`;
type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

function UserDetail({
  style,
  user,
}: {
  style: AnimatedStyle;
  user: UserDetailType;
}) {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const identityRef = useRef<HTMLElement | null>(null);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState(false);

  const updateCollapsedHeaderVisibility = useCallback(() => {
    const scrollableElement = scrollableRef.current;
    const identityElement = identityRef.current;
    if (!scrollableElement || !identityElement) {
      setShowCollapsedHeader(false);
      return;
    }

    const scrollableRect = scrollableElement.getBoundingClientRect();
    const identityRect = identityElement.getBoundingClientRect();
    const nextVisible = identityRect.bottom <= scrollableRect.top + 8;
    setShowCollapsedHeader((current) =>
      current === nextVisible ? current : nextVisible,
    );
  }, []);

  useEffect(() => {
    setShowCollapsedHeader(false);
    const frame = window.requestAnimationFrame(updateCollapsedHeaderVisibility);
    return () => window.cancelAnimationFrame(frame);
  }, [user.id, updateCollapsedHeaderVisibility]);

  return (
    <DetailContainer style={style}>
      <Header $visible={showCollapsedHeader}>
        <HeaderAvatar>
          <Cover
            className="header-avatar-image"
            src={getResizedImage({
              url: user.avatar,
              size: Math.ceil(48 * window.devicePixelRatio),
            })}
            size="100%"
            shape={Shape.SQUARE}
          />
        </HeaderAvatar>
        <HeaderText>
          <UserDrawerTitle>{user.nickname}</UserDrawerTitle>
          <UserDrawerDescription>@{user.username}</UserDrawerDescription>
        </HeaderText>
      </Header>
      <div
        className="scrollable"
        ref={scrollableRef}
        onScroll={updateCollapsedHeaderVisibility}
      >
        <div className="first-screen">
          <Info user={user} identityRef={identityRef} />
          <MusicbillList musicbillList={user.musicbillList} />
        </div>
      </div>
    </DetailContainer>
  );
}

function Wrapper({
  open,
  onClose,
  id,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  zIndex: number;
}) {
  const { data, reload } = useData(id);
  const { top: titlebarTop } = useTitlebarOverlayInsets();

  const transitions = useTransition(data, TRANSITION);
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 'min(85%, 400px)', paddingTop: titlebarTop }}
        showClose={false}
        zIndex={zIndex}
      >
        {transitions((style, d) => {
          const { error, loading, userDetail } = d;
          if (error) {
            return (
              <StatusContainer style={style}>
                <ErrorCard errorMessage={error.message} retry={reload} />
              </StatusContainer>
            );
          }
          if (loading) {
            return (
              <StatusContainer style={style}>
                <Spinner />
              </StatusContainer>
            );
          }
          return (
            <UserDetail style={style} user={userDetail!} />
          );
        })}
      </DrawerContent>
    </Drawer>
  );
}

export default Wrapper;
