import {
  ChangeEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MdAddPhotoAlternate,
  MdDelete,
  MdDragIndicator,
  MdImage,
  MdRecordVoiceOver,
} from 'react-icons/md';
import Button from '@/components/button';
import Input from '@/components/input';
import Textarea from '@/components/textarea';
import { AssetType } from '@/constants/asset';
import { IS_TOUCHABLE } from '@/constants/browser';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import stringArrayEqual from '@/utils/string_array_equal';
import getResizedImage from '@/server/asset/get_resized_image';
import uploadAsset from '@/server/form/upload_asset';
import adminCreateSingerPhoto from '@/server/api/admin_create_singer_photo';
import adminDeleteSinger from '@/server/api/admin_delete_singer';
import adminDeleteSingerPhoto from '@/server/api/admin_delete_singer_photo';
import adminReorderSingerPhotos from '@/server/api/admin_reorder_singer_photos';
import adminUpdateSingerPhoto from '@/server/api/admin_update_singer_photo';
import updateSinger from '@/server/api/update_singer';
import { ExceptionCode } from '@/constants/exception';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '@/pages/player/eventemitter';
import {
  ALIAS_MAX_LENGTH,
  AllowUpdateKey,
  NAME_MAX_LENGTH,
  SINGER_ALIAS_MAX_COUNT,
} from '@/constants/singer';
import type { Singer } from './types';

const AVATAR_SIZE = 48;
const PHOTO_DESCRIPTION_MAX_LENGTH = 500;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const NEUTRAL_SHADOW = CSSVariable.COLOR_CONTROL_NEUTRAL;

const Form = styled.div<{ $page: boolean }>`
  position: ${({ $page }) => ($page ? 'static' : 'relative')};
  width: 100%;
  max-width: ${({ $page }) => ($page ? '560px' : 'none')};
  height: ${({ $page }) => ($page ? 'auto' : '100%')};
  padding: ${({ $page }) => ($page ? '24px' : '0')};
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: ${({ $page }) => ($page ? 'visible' : 'hidden')};
`;

const Header = styled.div`
  flex-shrink: 0;
  padding: 14px 16px 18px;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
`;

const AvatarBox = styled.div`
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE}px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  flex-shrink: 0;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  font-size: 22px;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const HeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const HeaderTitle = styled.div`
  font-family: ${FONT};
  font-size: 17px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: 0;
  color: rgb(75 75 75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderSubTitle = styled.div`
  margin-top: 4px;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Body = styled.div<{ $page: boolean }>`
  flex: ${({ $page }) => ($page ? 'initial' : '1')};
  min-height: 0;
  background: #fff;
  padding: ${({ $page }) =>
    $page ? '20px' : '20px 20px calc(96px + env(safe-area-inset-bottom, 0))'};
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: ${({ $page }) => ($page ? 'visible' : 'auto')};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const GroupTitle = styled.div`
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: rgb(66 66 66);
  ${upperCaseFirstLetter}
`;

const AliasInputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 8px;
  align-items: start;
`;

const PhotoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PhotoRow = styled.div<{ $dragging: boolean; $sortable: boolean }>`
  position: relative;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: ${({ $sortable }) => ($sortable ? '12px 12px 12px 30px' : '12px')};
  border: 2px solid
    ${({ $dragging }) =>
      $dragging ? CSSVariable.COLOR_PRIMARY : CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 4px 0
    ${({ $dragging }) =>
      $dragging ? CSSVariable.COLOR_PRIMARY_ACTIVE : ROW_SHADOW};
  overflow: visible;
  opacity: ${({ $dragging }) => ($dragging ? 0.72 : 1)};
  z-index: ${({ $dragging }) => ($dragging ? 1 : 0)};
  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms ease-out;

  &:hover {
    filter: brightness(1.01);
  }
`;

const PhotoThumb = styled.div`
  position: relative;
  width: 56px;
  height: 56px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  > img {
    width: 100%;
    height: 100%;
    border-radius: 13px;
    object-fit: cover;
    display: block;
  }
`;

const PhotoInfo = styled.div`
  min-width: 0;
`;

const PhotoDescriptionTextarea = styled(Textarea)`
  min-width: 0;
  height: 78px;
  max-height: 128px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 13px;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  font-family: ${FONT};
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.4;
  overflow-y: auto;
  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out;

  &:focus {
    border-color: ${CSSVariable.COLOR_PRIMARY};
    box-shadow: 0 3px 0 ${CSSVariable.COLOR_PRIMARY_ACTIVE};
  }
`;

const PhotoDeleteButton = styled(Button)`
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 2;
  width: 26px;
  height: 26px;
  min-width: 0;
  border-radius: 8px;
  font-size: 14px;
`;

const DragHandle = styled.button`
  position: absolute;
  top: 50%;
  left: -14px;
  z-index: 2;
  width: 30px;
  height: 52px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 12px;
  padding: 0;
  background: #fff;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  transform: translateY(-50%);
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition:
    color 120ms,
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms ease-out;

  &:hover {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    filter: brightness(1.04);
  }

  &:active {
    cursor: grabbing;
    transform: translateY(calc(-50% + 3px));
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
  }
`;

const Footer = styled.div<{ $page: boolean }>`
  flex-shrink: ${({ $page }) => ($page ? '0' : 'initial')};
  position: ${({ $page }) => ($page ? 'sticky' : 'absolute')};
  left: ${({ $page }) => ($page ? 'auto' : '0')};
  right: ${({ $page }) => ($page ? 'auto' : '0')};
  bottom: 0;
  z-index: ${({ $page }) => ($page ? 'auto' : '2')};
  padding: 14px 16px calc(16px + env(safe-area-inset-bottom, 0));
  display: flex;
  gap: 10px;
`;

const SaveButton = styled(Button)`
  flex: 1;
  min-width: 0;
`;

const normalizeName = (name: string) => name.replace(/\s+/g, ' ').trim();

const normalizeAliases = (aliases: string[]) =>
  aliases.map(normalizeName).filter((alias) => alias.length > 0);

type Photo = Singer['photos'][number];

function SortablePhoto({
  photo,
  singerName,
  disabled,
  sortable,
  onDescriptionChange,
  onDelete,
}: {
  photo: Photo;
  singerName: string;
  disabled: boolean;
  sortable: boolean;
  onDescriptionChange: (id: string, description: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id, disabled: disabled || !sortable });

  return (
    <PhotoRow
      ref={setNodeRef}
      $dragging={isDragging}
      $sortable={sortable}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <PhotoThumb>
        {photo.asset ? (
          <img
            src={getResizedImage({
              url: photo.asset,
              size: 96,
            })}
            alt={photo.description || singerName}
          />
        ) : (
          <MdImage />
        )}
      </PhotoThumb>
      <PhotoInfo>
        <PhotoDescriptionTextarea
          value={photo.description}
          maxLength={PHOTO_DESCRIPTION_MAX_LENGTH}
          disabled={disabled}
          aria-label={t('description')}
          placeholder={capitalize(t('description'))}
          onChange={(event) =>
            onDescriptionChange(photo.id, event.target.value)
          }
        />
      </PhotoInfo>
      {sortable ? (
        <DragHandle
          type="button"
          title={t('sort')}
          aria-label={t('sort')}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <MdDragIndicator size={18} />
        </DragHandle>
      ) : null}
      <PhotoDeleteButton
        square
        size="sm"
        variant="danger"
        disabled={disabled}
        title={t('delete')}
        aria-label={t('delete')}
        onClick={() => onDelete(photo.id)}
      >
        <MdDelete />
      </PhotoDeleteButton>
    </PhotoRow>
  );
}

function SingerEditContent({
  singer,
  page = false,
  onSaved,
  onPhotosChanged,
  onDeleted,
}: {
  singer: Singer;
  page?: boolean;
  onSaved?: () => void;
  onPhotosChanged?: () => void;
  onDeleted?: () => void;
}) {
  const [name, setName] = useState(singer.name);
  const [aliases, setAliases] = useState<string[]>(() => singer.aliases);
  const [photos, setPhotos] = useState(() => singer.photos);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // musicCount > 0 时禁止删除歌手, 需要先把所有关联音乐解绑或删除
  const hasMusic = singer.musicCount > 0;
  const aliasInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusAliasIndexRef = useRef<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: IS_TOUCHABLE ? 250 : 0, tolerance: 5 },
    }),
  );

  useEffect(() => {
    setName(singer.name);
    setAliases(singer.aliases);
    setPhotos(singer.photos);
  }, [singer]);

  useEffect(() => {
    aliasInputRefs.current.length = aliases.length;
    const pendingIndex = pendingFocusAliasIndexRef.current;
    if (pendingIndex === null) return;

    pendingFocusAliasIndexRef.current = null;
    aliasInputRefs.current[pendingIndex]?.focus();
  }, [aliases.length]);

  const avatar = photos[0]?.asset;

  const normalizedAliases = useMemo(() => normalizeAliases(aliases), [aliases]);
  const originalPhotoIds = useMemo(
    () => singer.photos.map((photo) => photo.id),
    [singer.photos],
  );
  const originalPhotoDescriptions = useMemo(
    () =>
      new Map(singer.photos.map((photo) => [photo.id, photo.description])),
    [singer.photos],
  );
  const photoIds = useMemo(() => photos.map((photo) => photo.id), [photos]);
  const photoDescriptionChanges = useMemo(
    () =>
      photos.filter(
        (photo) =>
          photo.description !== (originalPhotoDescriptions.get(photo.id) ?? ''),
      ),
    [photos, originalPhotoDescriptions],
  );
  const changed =
    normalizeName(name) !== singer.name ||
    !stringArrayEqual(normalizedAliases, singer.aliases) ||
    photoDescriptionChanges.length > 0 ||
    !stringArrayEqual(photoIds, originalPhotoIds);

  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const onAliasChange = (index: number, value: string) =>
    setAliases((list) =>
      list.map((alias, i) => (i === index ? value : alias)),
    );

  const onAddAlias = () =>
    setAliases((list) =>
      {
        if (list.length >= SINGER_ALIAS_MAX_COUNT) {
          return list;
        }
        pendingFocusAliasIndexRef.current = list.length;
        return [...list, ''];
      },
    );

  const onRemoveAlias = (index: number) =>
    setAliases((list) => list.filter((_, i) => i !== index));

  const onPhotoDescriptionChange = (photoId: string, description: string) =>
    setPhotos((list) =>
      list.map((photo) =>
        photo.id === photoId ? { ...photo, description } : photo,
      ),
    );

  const notifySingerUpdated = () =>
    playerEventemitter.emit(PlayerEventType.SINGER_UPDATED, {
      id: singer.id,
    });

  const handlePhotosChanged = () => {
    notifySingerUpdated();
    onPhotosChanged?.();
  };

  const onAddPhoto = () =>
    dialog.imageCut({
      title: `${t('add')} ${t('photo')}`,
      confirmVariant: 'primary',
      onConfirm: async (photo) => {
        if (!photo) {
          notice.error(t('empty_photo_warning'));
          return false;
        }
        setPhotoSaving(true);
        try {
          const { id: asset } = await uploadAsset(photo, AssetType.SINGER_PHOTO);
          await adminCreateSingerPhoto({
            singerId: singer.id,
            asset,
          });
          handlePhotosChanged();
        } catch (error) {
          logger.error(error, 'Failed to add singer photo');
          notice.error(error.message);
          return false;
        } finally {
          setPhotoSaving(false);
        }
      },
    });

  const onDeletePhoto = (photoId: string) =>
    dialog.confirm({
      content: t('delete_singer_photo_question'),
      confirmText: t('delete'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        setPhotoSaving(true);
        try {
          await adminDeleteSingerPhoto(photoId);
          handlePhotosChanged();
        } catch (error) {
          logger.error(error, 'Failed to delete singer photo');
          notice.error(error.message);
          return false;
        } finally {
          setPhotoSaving(false);
        }
      },
    });

  const onPhotoDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setPhotos((list) => arrayMove(list, oldIndex, newIndex));
  };

  const onSave = async () => {
    const nextName = normalizeName(name);
    if (!nextName) {
      notice.error(t('empty_name_warning'));
      return;
    }

    setSaving(true);
    try {
      if (nextName !== singer.name) {
        await updateSinger({
          id: singer.id,
          key: AllowUpdateKey.NAME,
          value: nextName,
        });
      }

      if (!stringArrayEqual(normalizedAliases, singer.aliases)) {
        await updateSinger({
          id: singer.id,
          key: AllowUpdateKey.ALIASES,
          value: normalizedAliases,
        });
      }

      if (!stringArrayEqual(photoIds, originalPhotoIds)) {
        await adminReorderSingerPhotos({
          singerId: singer.id,
          ids: photoIds,
        });
      }

      if (photoDescriptionChanges.length > 0) {
        await Promise.all(
          photoDescriptionChanges.map((photo) =>
            adminUpdateSingerPhoto({
              id: photo.id,
              description: photo.description,
            }),
          ),
        );
      }

      notifySingerUpdated();
      onSaved?.();
    } catch (error) {
      logger.error(error, 'Failed to update singer');
      notice.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () =>
    dialog.confirm({
      content: t('delete_singer_question'),
      confirmText: t('delete'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await adminDeleteSinger(singer.id);
          onDeleted?.();
        } catch (error) {
          logger.error(error, 'Failed to delete singer');
          // 服务端兜底返回的错误码需要翻译成可读文案
          notice.error(
            error.code === ExceptionCode.SINGER_HAS_MUSIC_CAN_NOT_BE_DELETED
              ? t('singer_has_music_can_not_be_deleted')
              : error.message,
          );
          return false;
        } finally {
          setDeleting(false);
        }
      },
    });

  return (
    <Form $page={page}>
      {page ? (
        <Header>
          <AvatarBox>
            {avatar ? (
              <img
                src={getResizedImage({ url: avatar, size: AVATAR_SIZE * 2 })}
                alt={singer.name}
              />
            ) : (
              <MdRecordVoiceOver />
            )}
          </AvatarBox>
          <HeaderInfo>
            <HeaderTitle>{singer.name}</HeaderTitle>
            <HeaderSubTitle>{singer.id}</HeaderSubTitle>
          </HeaderInfo>
        </Header>
      ) : null}

      <Body $page={page}>
        <Input
          label={capitalize(t('name'))}
          value={name}
          onChange={onNameChange}
          maxLength={NAME_MAX_LENGTH}
          disabled={saving}
        />

        <Group>
          <GroupTitle>{t('photos')}</GroupTitle>
          <FieldGroup>
            {photos.length ? (
              <DndContext sensors={sensors} onDragEnd={onPhotoDragEnd}>
                <SortableContext
                  items={photoIds}
                  strategy={verticalListSortingStrategy}
                >
                  <PhotoList>
                    {photos.map((photo) => (
                      <SortablePhoto
                        key={photo.id}
                        photo={photo}
                        singerName={singer.name}
                        disabled={saving || photoSaving}
                        sortable={photos.length > 1}
                        onDescriptionChange={onPhotoDescriptionChange}
                        onDelete={onDeletePhoto}
                      />
                    ))}
                  </PhotoList>
                </SortableContext>
              </DndContext>
            ) : null}
            <Button
              variant="secondary"
              icon={<MdAddPhotoAlternate />}
              onClick={onAddPhoto}
              loading={photoSaving}
              disabled={saving}
            >
              {t('add')} {t('photo')}
            </Button>
          </FieldGroup>
        </Group>

        <Group>
          <GroupTitle>{t('aliases')}</GroupTitle>
          <FieldGroup>
            {aliases.map((alias, index) => (
              <AliasInputRow key={index}>
                <Input
                  ref={(element) => {
                    aliasInputRefs.current[index] = element;
                  }}
                  value={alias}
                  onChange={(event) => onAliasChange(index, event.target.value)}
                  maxLength={ALIAS_MAX_LENGTH}
                  disabled={saving}
                  placeholder={`${capitalize(t('alias'))} ${index + 1}`}
                />
                <Button
                  square
                  size="md"
                  variant="ghost"
                  onClick={() => onRemoveAlias(index)}
                  disabled={saving}
                  title={t('delete')}
                  aria-label={t('delete')}
                >
                  <MdDelete />
                </Button>
              </AliasInputRow>
            ))}
            {aliases.length < SINGER_ALIAS_MAX_COUNT ? (
              <Button variant="secondary" onClick={onAddAlias} disabled={saving}>
                {t('add')} {t('alias')}
              </Button>
            ) : null}
          </FieldGroup>
        </Group>
      </Body>

      <Footer $page={page}>
        <SaveButton
          variant="primary"
          onClick={onSave}
          loading={saving}
          disabled={!changed || photoSaving || deleting}
        >
          {t('save')}
        </SaveButton>
        {hasMusic ? null : (
          <Button
            variant="danger"
            onClick={onDelete}
            loading={deleting}
            disabled={saving || photoSaving}
          >
            {t('delete')}
          </Button>
        )}
      </Footer>
    </Form>
  );
}

export default SingerEditContent;
