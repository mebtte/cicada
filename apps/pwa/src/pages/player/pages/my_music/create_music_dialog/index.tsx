import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, Select, MultiSelect, SelectOption } from '@/components_next';
import Button from '@/components_next/button';
import Input from '@/components_next/input';
import { Label } from '@/components_next';
import { t } from '@/i18n';
import {
  AllowUpdateKey,
  MusicType,
  MUSIC_TYPES,
  NAME_MAX_LENGTH,
} from '#/constants/music';
import FileSelect from '@/components/file_select';
import searchSingerRequest from '@/server/api/search_singer';
import { AssetType, ASSET_TYPE_MAP } from '#/constants';
import useEvent from '@/utils/use_event';
import notice from '@/utils/notice';
import uploadAsset from '@/server/form/upload_asset';
import createMusic from '@/server/api/create_music';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import updateMusic from '@/server/api/update_music';
import getMusicFileMetadata from '#/utils/get_music_file_metadata';
import logger from '@/utils/logger';
import { MUSIC_TYPE_MAP } from '@/constants/music';
import capitalize from '#/utils/capitalize';
import useOpen from './use_open';
import e, { EventType } from '../eventemitter';
import MissingSinger from '../../../components/missing_singer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { Singer } from './constants';
import upperCaseFirstLetter from '#/utils/upper_case_first_letter';
import { base64ToCover, canAudioPlay, getMusicNameFromFilename } from './utils';

const MUSIC_TYPE_OPTIONS: SelectOption<MusicType>[] = MUSIC_TYPES.map((mt) => ({
  label: capitalize(MUSIC_TYPE_MAP[mt].label),
  value: mt,
}));

const formatSingerToOption = (singer: Singer): SelectOption<Singer> => ({
  label: `${singer.name}${singer.aliases.length ? `(${singer.aliases[0]})` : ''}`,
  value: singer,
});
const searchSinger = (search: string): Promise<SelectOption<Singer>[]> => {
  const keyword = search.trim().substring(0, SEARCH_KEYWORD_MAX_LENGTH);
  return searchSingerRequest({ keyword, page: 1, pageSize: 100 }).then((data) =>
    data.singerList.map(formatSingerToOption),
  );
};


function CreateMusicDialog() {
  const { open, onClose } = useOpen();
  const [name, setName] = useState('');
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const [singerList, setSingerList] = useState<SelectOption<Singer>[]>([]);

  const [musicType, setMusicType] = useState(MusicType.SONG);

  const [asset, setAsset] = useState<File | null>(null);
  const onAssetChange = (a: File | null) => {
    setAsset(a);

    if (a) {
      canAudioPlay(a).then((canPlay) => {
        if (!canPlay) {
          setAsset(null);
          return notice.error(t('can_not_play_audio_file'));
        }
      });
      getMusicFileMetadata(a)
        .then((metadata) => {
          const { title, artist } = metadata;
          if (!name) {
            setName(title || getMusicNameFromFilename(a.name));
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
                  setSingerList(data.singerList.map(formatSingerToOption));
                }
              })
              .catch((error) =>
                logger.error(error, 'Failed to search singers'),
              );
          }
        })
        .catch((error) =>
          logger.error(error, "Failed to parse music's metadata"),
        );
    }
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
        singerIds: singerList.map((s) => s.value.id),
        type: musicType,
        asset: musicAssetId,
      });

      try {
        const { picture, year } = await getMusicFileMetadata(asset);
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
          picture ? updateCover(picture.dataURI) : null,
          year
            ? updateMusic({
                id,
                key: AllowUpdateKey.YEAR,
                value: year,
                requestMinimalDuration: 0,
              })
            : null,
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showClose={false} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('create_music')}</DialogTitle>
        </DialogHeader>
        <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Select<MusicType>
            label={t('music_type_short')}
            value={musicType}
            onChange={(value) => setMusicType(value)}
            options={MUSIC_TYPE_OPTIONS}
            disabled={loading}
          />
          <Label label={t('music_file')}>
            <FileSelect
              value={asset}
              onChange={onAssetChange}
              disabled={loading}
              acceptTypes={Object.values(
                ASSET_TYPE_MAP[AssetType.MUSIC].acceptType,
              ).flat()}
              placeholder={upperCaseFirstLetter(
                `${t('supported_formats')}: ${Object.keys(
                  ASSET_TYPE_MAP[AssetType.MUSIC].acceptType,
                ).join('/')}`,
              )}
            />
          </Label>
          <Label
            label={t('singer_list')}
            addon={
              <MissingSinger
                afterCreating={(s) =>
                  setSingerList((sl) => [...sl, formatSingerToOption(s)])
                }
              />
            }
          >
            <MultiSelect<Singer>
              value={singerList}
              onChange={setSingerList}
              loadOptions={searchSinger}
              disabled={loading}
            />
          </Label>
          <Input
            label={t('name')}
            value={name}
            onChange={onNameChange}
            maxLength={NAME_MAX_LENGTH}
            disabled={loading}
          />
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            variant={'primary'}
            onClick={onCreate}
            loading={loading}
          >
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateMusicDialog;
