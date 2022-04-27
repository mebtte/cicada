import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { easeCubicInOut } from 'd3-ease';

import { RequestStatus } from '@/constants';
import getRandomCover from '@/utils/get_random_cover';
import createMusicbill from '@/server/create_musicbill';
import { PLAYER_PATH } from '@/constants/route';
import { NAME } from '@/constants/musicbill';
import toast from '@/platform/toast';
import logger from '@/platform/logger';
import dialog from '@/platform/dialog';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';
import Input from '@/components/input';
import eventemitter, { EventType } from './eventemitter';
import { Musicbill } from './constants';

const DIALOG_TRANSITION_DURATION = 650;

const springConfig = {
  duration: DIALOG_TRANSITION_DURATION,
  easing: easeCubicInOut,
};
const inputStyle = {
  display: 'block',
  width: '100%',
};

const CreateMusicbillDialog = () => {
  const history = useHistory();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => {
    inputRef.current.value = '';
    setOpen(false);
  }, []);
  const onCreate = async () => {
    const name = inputRef.current.value;
    if (name.length < NAME.MIN_LENGTH) {
      return toast.error(`"歌单名字"长度应大于等于${NAME.MIN_LENGTH}`);
    }
    if (name.length > NAME.MAX_LENGTH) {
      return toast.error(`"歌单名字"长度应小于等于${NAME.MAX_LENGTH}`);
    }
    setCreating(true);
    try {
      const data = await createMusicbill(name);
      const musicbill: Musicbill = {
        id: data.id,
        name: data.name,
        cover: getRandomCover(),
        order: data.order,
        description: '',
        createTime: new Date(data.create_time),
        musicList: [],
        public: false,

        status: RequestStatus.SUCCESS,
        error: null,
      };
      eventemitter.emit(EventType.MUSICBILL_CREATED, { musicbill });
      onClose();

      setTimeout(
        () => history.push(PLAYER_PATH.MUSICBILL.replace(':id', data.id)),
        0,
      );
    } catch (error) {
      logger.error(error, { description: '创建歌单失败', report: true });
      dialog.alert({
        title: '创建歌单失败',
        content: error.message,
      });
    }
    setCreating(false);
  };

  useEffect(() => {
    const listener = () => {
      setOpen(true);
      setTimeout(
        () => inputRef.current && inputRef.current.focus(),
        DIALOG_TRANSITION_DURATION,
      );
    };
    eventemitter.on(EventType.OPEN_CREATE_MUSICBILL_DIALOG, listener);
    return () =>
      void eventemitter.off(EventType.OPEN_CREATE_MUSICBILL_DIALOG, listener);
  }, []);

  return (
    <Dialog open={open} springConfig={springConfig}>
      <Title>创建歌单</Title>
      <Content>
        <Input
          ref={inputRef}
          type="text"
          style={inputStyle}
          placeholder="歌单名字"
          disabled={creating}
        />
      </Content>
      <Action>
        <Button label="取消" onClick={onClose} disabled={creating} />
        <Button
          label="创建"
          onClick={onCreate}
          loading={creating}
          type={Type.PRIMARY}
        />
      </Action>
    </Dialog>
  );
};

export default React.memo(CreateMusicbillDialog);
