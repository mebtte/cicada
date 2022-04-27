import React, { useCallback, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import Cropper from 'cropperjs';

import selectFile from '../utils/select_file';
import loadImage from '../utils/load_image';
import logger from '../platform/logger';
import dialog from '../platform/dialog';
import Dialog, { Content, Action } from './dialog';
import Button, { Type } from './button';

const Empty = styled.div`
  font-size: 12px;
`;
const ImgBox = styled.div`
  img {
    display: block;
    width: 100%;
    max-width: 100%;
  }
`;

const ImageCutterDialog = ({
  open,
  onClose,
  onUpdate,
  imageSize,
}: {
  open: boolean;
  onClose: () => void;
  onUpdate: (image: File) => void;
  imageSize: {
    width: number;
    height: number;
  };
}) => {
  const cropperRef = useRef<Cropper>();
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState('');
  const onSelectImage = useCallback(
    () =>
      selectFile({
        acceptTypes: ['image/png', 'image/jpeg'],
        onSelect: (file) => setImageUrl(URL.createObjectURL(file)),
      }),
    [],
  );
  const [saving, setSaving] = useState(false);
  const onUpdateWrapper = useCallback(async () => {
    setSaving(true);
    cropperRef.current.disable();
    const { width, height, x, y } = cropperRef.current.getData();
    const canvas = document.createElement('canvas');
    canvas.width = width > imageSize.width ? imageSize.width : width;
    canvas.height = height > imageSize.height ? imageSize.height : height;
    const context = canvas.getContext('2d');
    try {
      const imageNode = await loadImage(imageUrl);
      context.drawImage(
        imageNode,
        x,
        y,
        width,
        height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
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
      await onUpdate(blob as File);
      onClose();
    } catch (error) {
      logger.error(error, {
        description: '更新失败',
      });
      dialog.alert({
        title: '更新失败',
        content: error.message,
      });
    }
    cropperRef.current.enable();
    setSaving(false);
  }, [imageUrl, onUpdate, imageSize, onClose]);

  useEffect(() => {
    if (imageUrl) {
      setTimeout(() => {
        cropperRef.current = new Cropper(imageRef.current, {
          aspectRatio: imageSize.width / imageSize.height,
        });
      }, 0);
      return () => {
        URL.revokeObjectURL(imageUrl);
        cropperRef.current.destroy();
      };
    }
  }, [imageUrl, imageSize]);

  useEffect(() => {
    if (!open) {
      setImageUrl('');
    }
  }, [open]);

  return (
    <Dialog open={open}>
      <Content>
        {imageUrl ? (
          <ImgBox>
            <img src={imageUrl} ref={imageRef} alt="selected" />
          </ImgBox>
        ) : (
          <Empty>请选取一张图片</Empty>
        )}
      </Content>
      <Action>
        <div className="left">
          <Button
            label="选取图片"
            type={Type.PRIMARY}
            onClick={onSelectImage}
            disabled={saving}
          />
        </div>
        <Button label="取消" onClick={onClose} disabled={saving} />
        <Button
          label="更新"
          type={Type.PRIMARY}
          disabled={!imageUrl}
          loading={saving}
          onClick={onUpdateWrapper}
        />
      </Action>
    </Dialog>
  );
};

export default ImageCutterDialog;
