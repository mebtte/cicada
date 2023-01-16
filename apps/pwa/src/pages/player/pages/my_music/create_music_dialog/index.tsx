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
import searchSingerRequest from '@/server/search_singer';
import { AssetType, ASSET_TYPE_MAP } from '#/constants';
import useEvent from '@/utils/use_event';
import notice from '@/utils/notice';
import uploadAsset from '@/server/upload_asset';
import createMusic from '@/server/create_music';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import updateMusic from '@/server/update_music';
import { extraMetaDataFromFile } from '@/pages/player/utils';
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
  const onSqChange = (s) => setSq(s);

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

      const { lyric, picture } = await extraMetaDataFromFile(sq);

      if (lyric) {
        // 更新歌词
        await updateMusic({
          id,
          key: AllowUpdateKey.LYRIC,
          value: [lyric],
        });
      }
      if (picture) {
        // 更新封面图
        const { id: assetId } = await uploadAsset(
          picture,
          AssetType.MUSIC_COVER,
        );
        await updateMusic({
          id,
          key: AllowUpdateKey.COVER,
          value: assetId,
        });
      }

      e.emit(EventType.RELOAD_MUSIC_LIST, null);
      playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });

      onClose();
    } catch (error) {
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
          <MultipleSelect<Singer>
            label="歌手列表"
            value={singerList.map(formatSingerToMultipleSelectOption)}
            onChange={onSingerListChange}
            dataGetter={searchSinger}
            disabled={loading}
            addon={<CreateSinger />}
          />
          <Input
            label="名字"
            inputProps={{
              value: name,
              onChange: onNameChange,
              maxLength: NAME_MAX_LENGTH,
            }}
            disabled={loading}
          />
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
