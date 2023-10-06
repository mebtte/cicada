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
import Label from '@/components/label';
import Select, { Option as SelectOption } from '@/components/select';
import { t } from '@/i18n';
import {
  AllowUpdateKey,
  MusicType,
  MUSIC_TYPES,
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
import logger from '@/utils/logger';
import { MUSIC_TYPE_MAP } from '@/constants/music';
import capitalize from '#/utils/capitalize';
import { ZIndex } from '../../../constants';
import useOpen from './use_open';
import e, { EventType } from '../eventemitter';
import MissingSinger from '../../../components/missing_singer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { Singer } from './constants';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DIALOG },
};
const MUSIC_TYPE_OPTIONS: SelectOption<MusicType>[] = MUSIC_TYPES.map((mt) => ({
  label: capitalize(MUSIC_TYPE_MAP[mt].label),
  value: mt,
}));

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

  const [asset, setAsset] = useState<File | null>(null);
  const onAssetChange = (a) => {
    setAsset(a);

    getMusicFileMetadata(a)
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
            requestMinimalDuration: 0,
          })
            .then((data) => {
              if (!singerList.length) {
                setSingerList(data.singerList);
              }
            })
            .catch((error) => logger.error(error, 'Failed to search singers'));
        }
      })
      .catch((error) =>
        logger.error(error, "Failed to parse music's metadata"),
      );
  };

  const [loading, setLoading] = useState(false);
  const onCreate = useEvent(async () => {
    if (!singerList.length) {
      return notice.error(t('emtpy_singers_warning'));
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return notice.error(t('empty_name_warning'));
    }

    if (!asset) {
      return notice.error(t('empty_file_warning'));
    }

    setLoading(true);
    try {
      const { id: musicAssetId } = await uploadAsset(asset, AssetType.MUSIC);
      const id = await createMusic({
        name: trimmedName,
        singerIds: singerList.map((s) => s.id),
        type: musicType,
        asset: musicAssetId,
      });

      try {
        const { lyric, pictureBase64 } = await getMusicFileMetadata(asset);
        const updateCover = async (pb: string) => {
          const coverBlob = await base64ToCover(pb);
          const { id: assetId } = await uploadAsset(
            coverBlob,
            AssetType.MUSIC_COVER,
          );
          await updateMusic({
            id,
            key: AllowUpdateKey.COVER,
            value: assetId,
            requestMinimalDuration: 0,
          });
        };

        await Promise.all([
          musicType === MusicType.SONG && lyric
            ? await updateMusic({
                id,
                key: AllowUpdateKey.LYRIC,
                value: [lyric],
                requestMinimalDuration: 0,
              })
            : null,
          pictureBase64 ? updateCover(pictureBase64) : null,
        ]);
      } catch (error) {
        logger.error(error, "Failed to parse music's metadata");
      }

      e.emit(EventType.RELOAD_MUSIC_LIST, null);
      playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });

      onClose();
    } catch (error) {
      logger.error(error, 'Failed to create music');
      notice.error(error.message);
    }
    setLoading(false);
  });

  useEffect(() => {
    if (!open) {
      setName('');
      setSingerList([]);
      setMusicType(MusicType.SONG);
      setAsset(null);
    }
  }, [open]);

  return (
    <Dialog open={open} maskProps={maskProps}>
      <Container>
        <Title>{t('create_music')}</Title>
        <StyledContent>
          <Label label={t('music_type_short')}>
            <Select<MusicType>
              value={{
                label: capitalize(MUSIC_TYPE_MAP[musicType].label),
                value: musicType,
              }}
              onChange={onMusicTypeChange}
              options={MUSIC_TYPE_OPTIONS}
              disabled={loading}
            />
          </Label>
          <Label label={t('music_file')}>
            <FileSelect
              value={asset}
              onChange={onAssetChange}
              disabled={loading}
              acceptTypes={ASSET_TYPE_MAP[AssetType.MUSIC].acceptTypes}
              placeholder={`${t('empty_file_warning')}, ${t(
                'supported_formats',
              )} ${ASSET_TYPE_MAP[AssetType.MUSIC].acceptTypes.join(', ')}`}
            />
          </Label>
          <Label
            label={t('singer_list')}
            addon={
              <MissingSinger
                afterCreating={(s) => setSingerList((sl) => [...sl, s])}
              />
            }
          >
            <MultipleSelect<Singer>
              value={singerList.map(formatSingerToMultipleSelectOption)}
              onChange={onSingerListChange}
              optionsGetter={searchSinger}
              disabled={loading}
            />
          </Label>
          <Label label={t('name')}>
            <Input
              value={name}
              onChange={onNameChange}
              maxLength={NAME_MAX_LENGTH}
              disabled={loading}
            />
          </Label>
        </StyledContent>
        <Action>
          <Button onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            variant={Variant.PRIMARY}
            onClick={onCreate}
            loading={loading}
          >
            {t('create')}
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default CreateMusicDialog;
