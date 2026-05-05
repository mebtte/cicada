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
import adminDeleteSingerPhoto from '@/server/api/admin_delete_singer_photo';
import adminReorderSingerPhotos from '@/server/api/admin_reorder_singer_photos';
import adminUpdateSingerPhoto from '@/server/api/admin_update_singer_photo';
import updateSinger from '@/server/api/update_singer';
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

const Form = styled.div<{ $page: boolean }>`
  width: 100%;
  max-width: ${({ $page }) => ($page ? '560px' : 'none')};
  padding: ${({ $page }) => ($page ? '24px' : '0')};
`;

const Header = styled.div`
  padding: 18px 20px 16px;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AvatarBox = styled.div`
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE}px;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
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
`;

const HeaderTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderSubTitle = styled.div`
  margin-top: 3px;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Body = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
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

const PhotoRow = styled.div<{ $dragging: boolean }>`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) max-content;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 8px;
  border-radius: 8px;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  opacity: ${({ $dragging }) => ($dragging ? 0.72 : 1)};
  z-index: ${({ $dragging }) => ($dragging ? 1 : 0)};
`;

const PhotoThumb = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const PhotoInfo = styled.div`
  min-width: 0;
`;

const PhotoDescriptionInput = styled(Input)`
  min-width: 0;
`;

const PhotoActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DragHandle = styled.button`
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  padding: 0;
  background: transparent;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition:
    background 120ms,
    color 120ms;

  &:hover {
    background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  &:active {
    cursor: grabbing;
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

const Footer = styled.div`
  position: sticky;
  bottom: 0;
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid ${CSSVariable.COLOR_BORDER};
  background: #fff;
`;

const normalizeName = (name: string) => name.replace(/\s+/g, ' ').trim();

const normalizeAliases = (aliases: string[]) =>
  aliases.map(normalizeName).filter((alias) => alias.length > 0);

type Photo = Singer['photos'][number];

function SortablePhoto({
  photo,
  singerName,
  disabled,
  onDescriptionChange,
  onDelete,
}: {
  photo: Photo;
  singerName: string;
  disabled: boolean;
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
  } = useSortable({ id: photo.id, disabled });

  return (
    <PhotoRow
      ref={setNodeRef}
      $dragging={isDragging}
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
        <PhotoDescriptionInput
          size="sm"
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
      <PhotoActions>
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
        <Button
          square
          size="sm"
          variant="plain"
          disabled={disabled}
          title={t('delete')}
          aria-label={t('delete')}
          onClick={() => onDelete(photo.id)}
        >
          <MdDelete />
        </Button>
      </PhotoActions>
    </PhotoRow>
  );
}

function SingerEditContent({
  singer,
  page = false,
  onSaved,
  onPhotosChanged,
}: {
  singer: Singer;
  page?: boolean;
  onSaved?: () => void;
  onPhotosChanged?: () => void;
}) {
  const [name, setName] = useState(singer.name);
  const [aliases, setAliases] = useState<string[]>(() => singer.aliases);
  const [photos, setPhotos] = useState(() => singer.photos);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
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

  return (
    <Form $page={page}>
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

      <Body>
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

      <Footer>
        <Button
          block
          variant="primary"
          onClick={onSave}
          loading={saving}
          disabled={!changed || photoSaving}
        >
          {t('save')}
        </Button>
      </Footer>
    </Form>
  );
}

export default SingerEditContent;
