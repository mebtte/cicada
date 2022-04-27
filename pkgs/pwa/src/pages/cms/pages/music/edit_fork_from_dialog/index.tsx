import React, { ReactNode, useCallback, useEffect, useState } from 'react';

import cmsUpdateMusic, { Key } from '@/server/cms_update_music';
import dialog from '@/platform/dialog';
import LoadingCard from '@/components/loading_card';
import ErrorCard from '@/components/error_card';
import logger from '@/platform/logger';
import getMusicDetail from '@/server/get_music_detail';
import Button, { Type } from '@/components/button';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import eventemitter, { EventType } from '../eventemitter';
import MusicListSelector from './music_list_selector';
import { Music as WholeMusic } from '../constants';
import { Music } from './constants';

const cardStyle = {
  padding: '50px 0',
};

const EditForkFromDialog = () => {
  const [music, setMusic] = useState<null | WholeMusic>(null);
  const onClose = () => {
    setMusic(null);
    setTimeout(() => {}, 0);
  };

  const [forkFromList, setForkFromList] = useState<Music[]>([]);
  const onMusicSelect = (m: Music) => {
    const existIdList = forkFromList.map((fk) => fk.id);
    if (existIdList.includes(m.id)) {
      return;
    }
    return setForkFromList([...forkFromList, m]);
  };
  const onMusicRemove = (m: Music) =>
    setForkFromList((fkl) => fkl.filter((fk) => fk.id !== m.id));

  const [error, setError] = useState<Error | null>(null);
  const [getting, setGetting] = useState(false);
  const getMusicForkFrom = useCallback(async () => {
    if (!music) {
      return;
    }
    setError(null);
    if (!music.forkFrom.length) {
      return setForkFromList([]);
    }
    setGetting(true);
    try {
      const data = await getMusicDetail(music.id);
      setForkFromList(data.fork_from);
    } catch (e) {
      logger.error(e, {
        description: '获取音乐二次创作来源失败',
        report: true,
      });
      setError(e);
    }
    setGetting(false);
  }, [music]);

  const [updating, setUpdating] = useState(false);
  const onUpdate = async () => {
    setUpdating(true);
    try {
      await cmsUpdateMusic({
        id: music.id,
        key: Key.FORK_FROM,
        value: forkFromList.map((fk) => fk.id).join(','),
      });
      onClose();
      eventemitter.emit(EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED);
    } catch (e) {
      logger.error(e, {
        description: '更新音乐二次创作来源失败',
        report: true,
      });
      dialog.alert({ title: '更新音乐二次创作来源失败', content: e.message });
    }
    setUpdating(false);
  };

  useEffect(() => {
    const openListener = (m: WholeMusic) => setMusic(m);
    eventemitter.on(EventType.OPEN_EDIT_FORK_FROM_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_EDIT_FORK_FROM_DIALOG, openListener);
  }, []);

  useEffect(() => {
    getMusicForkFrom();
  }, [getMusicForkFrom]);

  let content: ReactNode;
  if (error) {
    content = (
      <ErrorCard
        errorMessage={error.message}
        retry={getMusicForkFrom}
        style={cardStyle}
      />
    );
  } else if (getting) {
    content = <LoadingCard style={cardStyle} />;
  } else {
    content = (
      <MusicListSelector
        musicList={forkFromList}
        onMusicSelect={onMusicSelect}
        onMusicRemove={onMusicRemove}
        disabled={updating}
      />
    );
  }
  return (
    <Dialog open={!!music}>
      <Title>{music ? `"${music.name}"` : ''}二次创作自</Title>
      <Content>{content}</Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={getting || updating} />
        <Button
          label="更新"
          type={Type.PRIMARY}
          onClick={onUpdate}
          disabled={getting}
          loading={updating}
        />
      </Action>
    </Dialog>
  );
};

export default EditForkFromDialog;
