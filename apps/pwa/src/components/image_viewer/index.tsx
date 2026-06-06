import {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import {
  Add,
  Refresh,
  Close,
  Remove,
} from '@/components/icon';
import {
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch';
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import Button from '@/components/button';
import { CSS_VAR, useTheme } from '@/components/theme';
import { t } from '@/i18n';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';

export interface ImageViewerPhoto {
  src: string;
  alt: string;
}

const ANIMATION_DURATION = 180;

const Backdrop = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 9500;
  padding: 28px;
  background: rgb(0 0 0 / 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 160ms ease;
`;

const Panel = styled.div<{ $visible: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  max-width: min(960px, 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: scale(${({ $visible }) => ($visible ? 1 : 0.96)});
  transition:
    opacity 160ms ease,
    transform ${ANIMATION_DURATION}ms cubic-bezier(0.2, 0.8, 0.2, 1);
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
`;

const Toolbar = styled.div`
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 2;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const CloseSlot = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
`;

const transformBoxStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const stopPropagation = (event: { stopPropagation: () => void }) =>
  event.stopPropagation();

function ImageViewer({
  photo,
  onClose,
}: {
  photo: ImageViewerPhoto | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const {
    top: titlebarTop,
    right: titlebarRight,
  } = useTitlebarOverlayInsets();
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);
  const scaleRef = useRef(1);

  const themeVars: CSSProperties = {
    [CSS_VAR.colorPrimary]: theme.colorPrimary,
    [CSS_VAR.colorPrimaryShadow]: `color-mix(in srgb, ${theme.colorPrimary} 70%, #000)`,
  } as CSSProperties;

  useEffect(() => {
    if (!photo) return;
    closingRef.current = false;
    scaleRef.current = 1;
    setVisible(false);
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [photo]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    window.setTimeout(onClose, ANIMATION_DURATION);
  }, [onClose]);

  if (!photo) return null;

  const onBackdropClick = () => {
    if (scaleRef.current > 1.01) return;
    close();
  };

  return createPortal(
    <DismissableLayer
      asChild
      disableOutsidePointerEvents
      onEscapeKeyDown={(event) => {
        event.preventDefault();
        close();
      }}
      onPointerDownOutside={(event) => event.preventDefault()}
      onFocusOutside={(event) => event.preventDefault()}
    >
      <Backdrop
        $visible={visible}
        style={themeVars}
        onClick={onBackdropClick}
      >
        <Panel $visible={visible} onClick={stopPropagation}>
          <TransformWrapper
            minScale={1}
            maxScale={5}
            centerOnInit
            doubleClick={{ mode: 'toggle', step: 1.5 }}
            wheel={{ step: 0.2 }}
            pinch={{ step: 5 }}
            onTransform={(_, state) => {
              scaleRef.current = state.scale;
            }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent
                  wrapperStyle={transformBoxStyle}
                  contentStyle={transformBoxStyle}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    draggable={false}
                    decoding="async"
                  />
                </TransformComponent>
                <Toolbar onClick={stopPropagation}>
                  <Button
                    square
                    size="sm"
                    variant="ghost"
                    title={t('zoom_out')}
                    aria-label={t('zoom_out')}
                    onClick={() => zoomOut()}
                  >
                    <Remove size={18} />
                  </Button>
                  <Button
                    square
                    size="sm"
                    variant="ghost"
                    title={t('reset_zoom')}
                    aria-label={t('reset_zoom')}
                    onClick={() => resetTransform()}
                  >
                    <Refresh size={18} />
                  </Button>
                  <Button
                    square
                    size="sm"
                    variant="ghost"
                    title={t('zoom_in')}
                    aria-label={t('zoom_in')}
                    onClick={() => zoomIn()}
                  >
                    <Add size={18} />
                  </Button>
                </Toolbar>
              </>
            )}
          </TransformWrapper>
          <CloseSlot
            style={{
              top: titlebarTop + 8,
              right: titlebarRight + 8,
            }}
            onClick={stopPropagation}
          >
            <Button
              square
              size="sm"
              variant="ghost"
              title={t('close')}
              aria-label={t('close')}
              onClick={close}
            >
              <Close size={18} />
            </Button>
          </CloseSlot>
        </Panel>
      </Backdrop>
    </DismissableLayer>,
    document.body,
  );
}

export default ImageViewer;
