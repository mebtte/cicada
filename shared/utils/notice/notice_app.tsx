import { useCallback, useEffect, useMemo, useState } from 'react';
import { Notice, NOTICE_ITEM_SPACE, TRANSITION_DURATION } from './constants';
import NoticeItem from './notice_item';
import e, { EventType } from './eventemitter';
import useTitlebarAreaRect from '../use_titlebar_area_rect';

function NoticeApp() {
  const rect = useTitlebarAreaRect();
  const baseTop = useMemo(() => (rect.height ? 15 : 60), [rect.height]);

  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const handleNoticeListTop = useCallback(
    (nl: Notice[]) => {
      let nextTop = baseTop + rect.height;
      return nl.map((n) => {
        const notice = {
          ...n,
          top: nextTop,
        };

        if (notice.visible) {
          nextTop += n.height + NOTICE_ITEM_SPACE;
        }

        return notice;
      });
    },
    [baseTop, rect.height],
  );

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN, (data) =>
      setNoticeList((nl) => {
        const top = nl.reduce(
          (t, n) => t + n.height + NOTICE_ITEM_SPACE,
          baseTop + rect.height,
        );
        return [
          ...nl,
          {
            id: data.id,
            type: data.type,
            duration: data.duration,
            content: data.content,
            visible: true,
            closable: data.closable,

            height: 0,
            top,
          },
        ];
      }),
    );
    const unlistenClose = e.listen(EventType.CLOSE, ({ id }) => {
      setNoticeList((nl) => {
        const newNoticeList = nl.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              visible: false,
            };
          }
          return n;
        });
        return handleNoticeListTop(newNoticeList);
      });
      window.setTimeout(
        () => setNoticeList((nl) => nl.filter((n) => n.id !== id)),
        TRANSITION_DURATION,
      );
    });
    const unlistenUpdateHeight = e.listen(
      EventType.UPDATE_HEIGHT,
      ({ id, height }) =>
        setNoticeList((nl) => {
          const newNoticeList = nl.map((n) => {
            if (n.id === id) {
              return {
                ...n,
                height,
              };
            }
            return n;
          });
          return handleNoticeListTop(newNoticeList);
        }),
    );
    return () => {
      unlistenOpen();
      unlistenClose();
      unlistenUpdateHeight();
    };
  }, [baseTop, handleNoticeListTop, rect.height]);

  return (
    <>
      {noticeList.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </>
  );
}

export default NoticeApp;
