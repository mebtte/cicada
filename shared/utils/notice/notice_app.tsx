import { useEffect, useState } from 'react';
import {
  BASE_TOP,
  Notice,
  NOTICE_ITEM_SPACE,
  TRANSITION_DURATION,
} from './constants';
import NoticeItem from './notice_item';
import e, { EventType } from './eventemitter';
import generateRandomString from '../generate_random_string';

function handleNoticeListTop(noticeList: Notice[]) {
  let nextTop = BASE_TOP;
  return noticeList.map((n) => {
    const notice = {
      ...n,
      top: nextTop,
    };

    if (notice.visible) {
      nextTop += n.height + NOTICE_ITEM_SPACE;
    }

    return notice;
  });
}

function NoticeApp() {
  const [noticeList, setNoticeList] = useState<Notice[]>([]);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN, (data) =>
      setNoticeList((nl) => {
        const top = nl.reduce(
          (t, n) => t + n.height + NOTICE_ITEM_SPACE,
          BASE_TOP,
        );
        return [
          ...nl,
          {
            id: generateRandomString(),
            type: data.type,
            duration: data.duration,
            content: data.content,
            visible: true,

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
  }, []);

  return (
    <>
      {noticeList.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </>
  );
}

export default NoticeApp;
