import React, { useEffect, useState } from 'react';

import cmsUpdateMusic, { Key } from '@/server/cms_update_music';
import logger from '@/platform/logger';
import dialog from '@/platform/dialog';
import Button, { Type } from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import eventemitter, { EventType } from './eventemitter';
import { Music, Figure } from './constants';
import SingerListSelector from './singer_list_selector';

const EditMusicSingerListDialog = () => {
  const [music, setMusic] = useState<Music | null>(null);
  const [singerList, setSingerList] = useState<Figure[]>([]);
  const onSingerSelect = (singer: Figure) =>
    setSingerList((sl) => {
      const exist = sl.find((s) => s.id === singer.id);
      if (exist) {
        return sl;
      }
      return [...sl, singer];
    });
  const onSingerRemove = (singer: Figure) =>
    setSingerList((sl) => sl.filter((s) => s.id !== singer.id));

  const onClose = () => {
    setMusic(null);
    setTimeout(() => {
      setSingerList([]);
    }, 1000);
  };

  const [loading, setLoading] = useState(false);
  const onUpdate = async () => {
    if (singerList === music.singers) {
      return onClose();
    }
    setLoading(true);
    try {
      await cmsUpdateMusic({
        id: music.id,
        key: Key.SINGER,
        value: singerList.map((s) => s.id).join(','),
      });
      eventemitter.emit(EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED);
      onClose();
    } catch (error) {
      logger.error(error, {
        description: '更新音乐歌手列表失败',
        report: true,
      });
      dialog.alert({ title: '更新音乐歌手列表失败', content: error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    const openListener = (m: Music) => {
      setMusic(m);
      setSingerList(m.singers);
    };
    eventemitter.on(EventType.OPEN_EDIT_SINGER_LIST_DIALOG, openListener);
    return () =>
      void eventemitter.off(
        EventType.OPEN_EDIT_SINGER_LIST_DIALOG,
        openListener,
      );
  }, []);

  return (
    <Dialog open={!!music}>
      <Title>
        {music ? `编辑"${music.name}"歌手列表` : '编辑音乐歌手列表'}
      </Title>
      <Content>
        <SingerListSelector
          singerList={singerList}
          onSingerSelect={onSingerSelect}
          onSingerRemove={onSingerRemove}
          disabled={loading}
        />
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={loading} />
        <Button
          label="更新"
          onClick={onUpdate}
          type={Type.PRIMARY}
          loading={loading}
        />
      </Action>
    </Dialog>
  );
};

export default EditMusicSingerListDialog;
