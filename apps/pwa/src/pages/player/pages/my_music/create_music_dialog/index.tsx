import {
  ChangeEventHandler,
  CSSProperties,
  useCallback,
  useEffect,
  useState,
} from 'react';
import styled from 'styled-components';
import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import Button, { Variant } from '@/components/button';
import Input from '@/components/input';
import Select, { Option as SelectOption } from '@/components/select';
import {
  AllowUpdateKey,
  MusicType,
  MUSIC_TYPES,
  MUSIC_TYPE_MAP,
  NAME_MAX_LENGTH,
} from '#/constants/music';
import FileSelect from '@/components/file_select';
import MultipleSelect, {
  Option as MultipleSelectOption,
} from '@/components/multiple_select';
import searchSingerRequest from '@/server/api/search_singer';
import { AssetType, ASSET_TYPE_MAP } from '#/constants';
import useEvent from '@/utils/use_event';
import notice from '@/utils/notice';
import uploadAsset from '@/server/form/upload_asset';
import createMusic from '@/server/api/create_music';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import updateMusic from '@/server/api/update_music';
import getMusicFileMetadata, {
  base64ToCover,
} from '@/utils/get_music_file_metadata';
import logger from '#/utils/logger';
import { ZIndex } from '../../../constants';
import useOpen from './use_open';
import e, { EventType } from '../eventemitter';
import CreateSinger from './create_singer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DIALOG },
};
const MUSIC_TYPE_OPTIONS: SelectOption<MusicType>[] = MUSIC_TYPES.map((t) => ({
  key: t,
  label: MUSIC_TYPE_MAP[t].label,
  value: t,
}));
interface Singer {
  id: string;
  name: string;
  aliases: string[];
}
const formatSingerToMultipleSelectOption = (
  singer: Singer,
): MultipleSelectOption<Singer> => ({
  key: singer.id,
  label: `${singer.name}${
    singer.aliases.length ? `(${singer.aliases[0]})` : ''
  }`,
  value: singer,
});
const searchSinger = (
  search: string,
): Promise<MultipleSelectOption<Singer>[]> => {
  const keyword = search.trim().substring(0, SEARCH_KEYWORD_MAX_LENGTH);
  return searchSingerRequest({ keyword, page: 1, pageSize: 100 }).then((data) =>
    data.singerList.map(formatSingerToMultipleSelectOption),
  );
};

const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function CreateMusicDialog() {
  const { open, onClose } = useOpen();
  const [name, setName] = useState('');
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const [singerList, setSingerList] = useState<Singer[]>([]);
  const onSingerListChange = useCallback(
    (sl: MultipleSelectOption<Singer>[]) =>
      setSingerList(sl.map((s) => s.value)),
    [],
  );

  const [musicType, setMusicType] = useState(MusicType.SONG);
  const onMusicTypeChange = (option: SelectOption<MusicType>) =>
    setMusicType(option.value);

  const [sq, setSq] = useState<File | null>(null);
  const onSqChange = (s) => {
    setSq(s);

    getMusicFileMetadata(s)
      .then((metadata) => {
        const { title, artist } = metadata;
        if (!name && title) {
          setName(title);
        }
        if (!singerList.length && artist) {
          searchSingerRequest({
            keyword: artist,
            page: 1,
            pageSize: 10,
            minDuration: 0,
          })
            .then((data) => {
              if (!singerList.length) {
                setSingerList(data.singerList);
              }
            })
            .catch((error) => logger.error(error, '搜索歌手列表失败'));
        }
      })
      .catch((error) => logger.error(error, '解析音乐文件 metadata 失败'));
  };

  const [loading, setLoading] = useState(false);
  const onCreate = useEvent(async () => {
    if (!singerList) {
      return notice.error('请选择歌手');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return notice.error('请输入名字');
    }

    if (!sq) {
      return notice.error('请选择标准音质文件');
    }

    setLoading(true);
    try {
      const asset = await uploadAsset(sq, AssetType.MUSIC_SQ);
      const id = await createMusic({
        name: trimmedName,
        singerIds: singerList.map((s) => s.id),
        type: musicType,
        sq: asset.id,
      });

      try {
        const { lyric, pictureBase64 } = await getMusicFileMetadata(sq);
        const updateCover = async (pb: string) => {
          const coverBlob = await base64ToCover(pb);
          const { id: assetId } = await uploadAsset(
            coverBlob,
            AssetType.MUSIC_COVER,
            0,
          );
          await updateMusic({
            id,
            key: AllowUpdateKey.COVER,
            value: assetId,
            minDuration: 0,
          });
        };

        await Promise.all([
          musicType === MusicType.SONG && lyric
            ? await updateMusic({
                id,
                key: AllowUpdateKey.LYRIC,
                value: [lyric],
                minDuration: 0,
              })
            : null,
          pictureBase64 ? updateCover(pictureBase64) : null,
        ]);
      } catch (error) {
        logger.error(error, '从音乐文件解析 metadata 失败');
      }

      e.emit(EventType.RELOAD_MUSIC_LIST, null);
      playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });

      onClose();
    } catch (error) {
      logger.error(error, '创建音乐失败');
      notice.error(error.message);
    }
    setLoading(false);
  });

  useEffect(() => {
    if (!open) {
      setName('');
      setSingerList([]);
      setMusicType(MusicType.SONG);
      setSq(null);
    }
  }, [open]);

  return (
    <Dialog open={open} maskProps={maskProps}>
      <Container>
        <Title>创建音乐</Title>
        <StyledContent>
          <Select<MusicType>
            label="类型"
            data={MUSIC_TYPE_OPTIONS}
            value={{
              key: musicType,
              label: MUSIC_TYPE_MAP[musicType].label,
              value: musicType,
            }}
            onChange={onMusicTypeChange}
            disabled={loading}
          />
          <FileSelect
            label="标准音质文件"
            value={sq}
            onChange={onSqChange}
            disabled={loading}
            acceptTypes={ASSET_TYPE_MAP[AssetType.MUSIC_SQ].acceptTypes}
            placeholder={`选择文件, 支持以下格式 ${ASSET_TYPE_MAP[
              AssetType.MUSIC_SQ
            ].acceptTypes.join(', ')}`}
          />
          <MultipleSelect<Singer>
            label="歌手列表"
            value={singerList.map(formatSingerToMultipleSelectOption)}
            onChange={onSingerListChange}
            dataGetter={searchSinger}
            disabled={loading}
            addon={<CreateSinger />}
          />
          <Input
            label="音乐名字"
            inputProps={{
              value: name,
              onChange: onNameChange,
              maxLength: NAME_MAX_LENGTH,
            }}
            disabled={loading}
          />
        </StyledContent>
        <Action>
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            variant={Variant.PRIMARY}
            onClick={onCreate}
            loading={loading}
          >
            创建
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default CreateMusicDialog;
