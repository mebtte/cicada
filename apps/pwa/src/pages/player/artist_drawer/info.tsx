import { CSSVariable } from '@/global_style';
import styled, { css } from 'styled-components';
import { useEffect, useState, type Ref } from 'react';
import Cover, { Shape } from '@/components/cover';
import ImageViewer, { type ImageViewerPhoto } from '@/components/image_viewer';
import { t } from '@/i18n';
import { Artist } from './constants';
import { PAGE_HORIZONTAL_PADDING } from '../pages/page';

const Style = styled.div`
  background: #fff;
  font-size: 0;
`;
const Identity = styled.section<{
  $integrated: boolean;
}>`
  padding: ${({ $integrated }) =>
    $integrated ? 0 : `24px ${PAGE_HORIZONTAL_PADDING} 12px`};
  background: ${({ $integrated }) => ($integrated ? 'transparent' : '#fff')};

  ${({ $integrated }) =>
    $integrated
      ? css`
          > .name {
            -webkit-text-stroke: 0.35px rgb(255 255 255 / 0.9);
            text-shadow:
              0 1px 0 rgb(255 255 255 / 0.95),
              0 0 10px rgb(255 255 255 / 0.9);
          }

          > .aliases {
            color: rgb(68 68 68);
            text-shadow:
              0 1px 0 rgb(255 255 255 / 0.92),
              0 0 8px rgb(255 255 255 / 0.86);
          }
        `
      : null}

  > .name {
    margin: 0;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0;
    color: rgb(50 50 50);
    overflow-wrap: anywhere;
  }

  > .aliases {
    margin: 8px 0 0;

    display: flex;
    flex-direction: column;
    gap: 3px;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 600;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
`;
const Main = styled.div`
  position: relative;
  overflow: hidden;

  > .photo {
    display: block;
    width: 100%;
    border: none;
    padding: 0;
    background: transparent;
    cursor: zoom-in;
    -webkit-tap-highlight-color: transparent;

    &:focus-visible {
      outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
      outline-offset: -2px;
    }
  }
`;
const PhotoOverlay = styled.div<{ $hasThumbnails: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: ${({ $hasThumbnails }) =>
    $hasThumbnails
      ? `108px ${PAGE_HORIZONTAL_PADDING} 14px`
      : `108px ${PAGE_HORIZONTAL_PADDING} 18px`};
  box-sizing: border-box;
  background: linear-gradient(
    to bottom,
    rgb(255 255 255 / 0) 0%,
    rgb(255 255 255 / 0.08) 16%,
    rgb(255 255 255 / 0.24) 32%,
    rgb(255 255 255 / 0.48) 52%,
    rgb(255 255 255 / 0.72) 70%,
    rgb(255 255 255 / 0.9) 86%,
    #fff 100%
  );
`;
const ThumbnailRow = styled.div<{ $integrated: boolean }>`
  margin-top: ${({ $integrated }) => ($integrated ? '12px' : 0)};
  padding: ${({ $integrated }) =>
    $integrated ? '0 0 4px' : `0 ${PAGE_HORIZONTAL_PADDING} 18px`};
  box-sizing: border-box;

  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;

  &::-webkit-scrollbar {
    display: none;
  }
`;
const ThumbnailItem = styled.div<{ selected: boolean }>`
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  box-sizing: border-box;
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 3px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  cursor: pointer;
  scroll-snap-align: start;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;

  > * {
    width: 100%;
    border-radius: 9px;
  }

  ${({ selected }) =>
    selected
      ? css`
        border-color: ${CSSVariable.COLOR_PRIMARY_ACTIVE};
        box-shadow: 0 3px 0 ${CSSVariable.COLOR_PRIMARY_ACTIVE};
        transform: translateY(-1px);
      `
      : css`
          &:active {
            transform: translateY(2px);
            box-shadow: 0 1px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
          }
        `}
`;

function Info({
  artist,
  identityRef,
}: {
  artist: Artist;
  identityRef?: Ref<HTMLElement>;
}) {
  const { photos } = artist;
  const [selectedId, setSelectedId] = useState<string | undefined>(
    () => photos[0]?.id,
  );
  const [viewerPhoto, setViewerPhoto] = useState<ImageViewerPhoto | null>(null);

  useEffect(() => {
    if (!photos.length) {
      setSelectedId(undefined);
      return;
    }
    setSelectedId((prev) =>
      prev && photos.some((p) => p.id === prev) ? prev : photos[0].id,
    );
  }, [photos]);

  const selected = photos.find((p) => p.id === selectedId) ?? photos[0];
  const showThumbnails = photos.length > 1;
  const photoLabel = selected?.description || artist.name;
  const identity = (
    <Identity
      $integrated={!!selected}
      ref={identityRef}
    >
      <h1 className="name">{artist.name}</h1>
      {artist.aliases.length ? (
        <div className="aliases">
          {artist.aliases.map((alias, index) => (
            <div className="alias" key={index}>
              {alias}
            </div>
          ))}
        </div>
      ) : null}
    </Identity>
  );
  const thumbnails = showThumbnails ? (
    <ThumbnailRow $integrated={!!selected}>
      {photos.map((photo) => (
        <ThumbnailItem
          key={photo.id}
          role="button"
          tabIndex={0}
          selected={photo.id === selected?.id}
          onClick={() => setSelectedId(photo.id)}
          aria-label={photo.description || artist.name}
        >
          <Cover
            src={photo.asset}
            placeholderSrc={photo.thumbnail}
            size="100%"
            shape={Shape.SQUARE}
          />
        </ThumbnailItem>
      ))}
    </ThumbnailRow>
  ) : null;

  return (
    <Style>
      {selected ? (
        <Main>
          <button
            type="button"
            className="photo"
            aria-label={`${t('zoom_in')} ${photoLabel}`}
            onClick={() =>
              setViewerPhoto({ src: selected.asset, alt: photoLabel })
            }
          >
            <Cover
              src={selected.asset}
              placeholderSrc={selected.thumbnail}
              size="100%"
              shape={Shape.SQUARE}
            />
          </button>
          <PhotoOverlay $hasThumbnails={showThumbnails}>
            {identity}
            {thumbnails}
          </PhotoOverlay>
        </Main>
      ) : (
        identity
      )}
      {selected ? null : thumbnails}
      <ImageViewer
        photo={viewerPhoto}
        onClose={() => setViewerPhoto(null)}
      />
    </Style>
  );
}

export default Info;
