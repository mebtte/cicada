import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components';
import Button from '@/components/button';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Cropper from 'cropperjs';
import styled from 'styled-components';
import { IMAGE_MAX_SIZE } from '@/constants/asset';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import DialogBase from './dialog_base';
import { DEFAULT_CANCEL_VARIANT, ImageCut as ImageCutShape } from './constants';
import useEvent from '../use_event';
import loadImage from '../load_image';
import selectFile from '../select_file';

const ACCEPT_TYPES = ['image/*'];

const Body = styled(DialogBody)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ImgBox = styled.div`
  overflow: hidden;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 5px 0 rgb(185 185 185);

  img {
    display: block;
    width: 100%;
    max-width: 100%;
  }

  .cropper-container {
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  }

  .cropper-view-box {
    outline-color: ${CSSVariable.COLOR_PRIMARY};
  }

  .cropper-line,
  .cropper-point {
    background-color: ${CSSVariable.COLOR_PRIMARY};
  }
`;

const SelectImageButton = styled(Button)`
  margin-right: auto;
`;

function ImageCutContent({
  onClose,
  options,
}: {
  onClose: () => void;
  options: ImageCutShape;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (file) {
      const nextUrl = URL.createObjectURL(file);
      setUrl(nextUrl);
      return () => URL.revokeObjectURL(nextUrl);
    }
  }, [file]);

  useLayoutEffect(() => {
    if (url) {
      cropperRef.current = new Cropper(imageRef.current!, {
        aspectRatio: 1,
      });
      return () => {
        cropperRef.current?.destroy();
      };
    }
  }, [url]);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(options.onCancel ? options.onCancel() : undefined)
      .then((result) => {
        if (result === undefined || !!result) {
          onClose();
        }
      })
      .finally(() => setCanceling(false));
  });

  const [confirming, setConfirming] = useState(false);
  const onConfirm = async () => {
    if (options.onConfirm) {
      setConfirming(true);
      let payload: Blob | null = null;
      if (cropperRef.current) {
        const { width, x, y } = cropperRef.current.getData();
        const size = Math.min(IMAGE_MAX_SIZE, width);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d')!;

        /**
         * fill canvas with white backgroud
         * @author mebtte<panhongyi.phy@alibaba-inc.com>
         */
        context.fillStyle = '#fff';
        context.fillRect(0, 0, size, size);

        const imgNode = await loadImage(url);
        context.drawImage(imgNode, x, y, width, width, 0, 0, size, size);
        payload = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => {
              if (!b) {
                return reject(new Error('Failed to export image from canvas'));
              }
              return resolve(b);
            },
            'image/jpeg',
            0.8,
          ),
        );
      }

      const result = await Promise.resolve(options.onConfirm(payload));
      if (result === undefined || !!result) {
        onClose();
      }
      setConfirming(false);
    } else {
      return onClose();
    }
  };

  useEffect(() => {
    if (confirming || canceling) {
      cropperRef.current?.disable();
    } else {
      cropperRef.current?.enable();
    }
  }, [confirming, canceling]);

  const onSelectImage = useEvent(() => {
    if (confirming || canceling) {
      return;
    }
    return selectFile({
      acceptTypes: ACCEPT_TYPES,
      onSelect: (f) => setFile(f),
    });
  });

  return (
    <>
      {options.title && (
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
        </DialogHeader>
      )}
      <Body>
        {url ? (
          <ImgBox>
            <img src={url} ref={imageRef} />
          </ImgBox>
        ) : null}
      </Body>
      <DialogFooter $inline={options.inlineFooter}>
        <SelectImageButton
          variant="secondary"
          onClick={onSelectImage}
          disabled={confirming || canceling}
        >
          {t('select_image')}
        </SelectImageButton>
        <Button
          variant={options.cancelVariant ?? DEFAULT_CANCEL_VARIANT}
          onClick={onCancel}
          loading={canceling}
          disabled={confirming}
        >
          {options.cancelText || t('cancel')}
        </Button>
        <Button
          variant={options.confirmVariant}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {options.confirmText || t('confirm')}
        </Button>
      </DialogFooter>
    </>
  );
}

function Wrapper({
  onDestroy,
  options,
}: {
  onDestroy: (id: string) => void;
  options: ImageCutShape;
}) {
  return (
    <DialogBase onDestroy={onDestroy} options={options}>
      {({ onClose }) => <ImageCutContent onClose={onClose} options={options} />}
    </DialogBase>
  );
}

export default Wrapper;
