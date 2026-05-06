import { CSSVariable } from '@/global_style';
import styled, { css } from 'styled-components';
import { useEffect, useState } from 'react';
import Cover, { Shape } from '@/components/cover';
import ImageViewer, { type ImageViewerPhoto } from '@/components/image_viewer';
import { t } from '@/i18n';
import { Singer } from './constants';

const Style = styled.div`
  font-size: 0;
`;
const Main = styled.div`
  position: relative;

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
const ThumbnailRow = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  max-width: 90%;
  padding: 10px 20px;

  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;
const ThumbnailItem = styled.div<{ selected: boolean }>`
  flex: 0 0 auto;
  border: 2px solid rgb(220 220 220);
  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
  overflow: hidden;
  cursor: pointer;

  ${({ selected }) =>
    selected
      ? css`
          border-color: ${CSSVariable.COLOR_PRIMARY};
        `
      : css`
          opacity: 0.7;
        `}
`;

function Info({ singer }: { singer: Singer }) {
  const { photos } = singer;
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

  if (!photos.length) {
    return null;
  }

  const selected = photos.find((p) => p.id === selectedId) ?? photos[0];
  const showThumbnails = photos.length > 1;
  const photoLabel = selected.description || singer.name;

  return (
    <Style>
      <Main>
        <button
          type="button"
          className="photo"
          aria-label={`${t('zoom_in')} ${photoLabel}`}
          onClick={() =>
            setViewerPhoto({ src: selected.asset, alt: photoLabel })
          }
        >
          <Cover src={selected.asset} size="100%" shape={Shape.SQUARE} />
        </button>
        {showThumbnails ? (
          <ThumbnailRow>
            {photos.map((photo) => (
              <ThumbnailItem
                key={photo.id}
                role="button"
                tabIndex={0}
                selected={photo.id === selected.id}
                onClick={() => setSelectedId(photo.id)}
                aria-label={photo.description || singer.name}
              >
                <Cover src={photo.asset} size={30} shape={Shape.SQUARE} />
              </ThumbnailItem>
            ))}
          </ThumbnailRow>
        ) : null}
      </Main>
      <ImageViewer
        photo={viewerPhoto}
        onClose={() => setViewerPhoto(null)}
      />
    </Style>
  );
}

export default Info;
