import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import FileSelect from '#/components/file_select';
import Cropper from 'cropperjs';
import { Ref, RenderProps } from './constants';
import { EditDialogType } from '../eventemitter';

const ACCEPT_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 1000;
const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const ImgBox = styled.div`
  img {
    display: block;
    width: 100%;
    max-width: 100%;
  }
`;

function Cover(
  { loading }: RenderProps<EditDialogType.COVER>,
  ref: ForwardedRef<Ref>,
) {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');

  useImperativeHandle(ref, () => ({
    getValue: async () => {
      if (cropperRef.current) {
        const { width, x, y } = cropperRef.current.getData();
        const size = Math.min(MAX_SIZE, width);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d')!;

        const imgNode = document.createElement('img');
        imgNode.src = url;
        await new Promise((resolve) =>
          imgNode.addEventListener('load', resolve),
        );

        context.drawImage(imgNode, x, y, width, width, 0, 0, size, size);
        return new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => {
              if (!b) {
                return reject(new Error('无法导出图片'));
              }
              return resolve(b);
            },
            'image/jpeg',
            0.8,
          ),
        );
      }
      return undefined;
    },
  }));

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

  useEffect(() => {
    if (loading) {
      cropperRef.current?.disable();
    } else {
      cropperRef.current?.enable();
    }
  }, [loading]);

  return (
    <Style>
      {url ? (
        <ImgBox>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={url} ref={imageRef} />
        </ImgBox>
      ) : null}
      <FileSelect
        placeholder="选择图片, 支持 JPEG/PNG 类型"
        value={file}
        onChange={(f) => setFile(f)}
        acceptTypes={ACCEPT_TYPES}
        disabled={loading}
      />
    </Style>
  );
}

export default forwardRef<Ref, RenderProps<EditDialogType.COVER>>(Cover);
