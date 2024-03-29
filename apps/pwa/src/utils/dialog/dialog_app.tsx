import { useCallback, useEffect, useState } from 'react';
import {
  DialogOptions,
  DialogType,
  Input as InputShape,
  InputList as InputListShape,
  Alert as AlertShape,
  Captcha as CaptchaShape,
  Confirm as ConfirmShape,
  MultipleSelect as MultipleSelectShape,
  FileSelect as FileSelectShape,
  TextareaList as TextareaListShape,
  ImageCut as ImageCutShape,
  Password as PasswordShape,
} from './constants';
import e, { EventType } from './eventemitter';
import Alert from './alert';
import Confirm from './confirm';
import Captcha from './captcha';
import Input from './input';
import InputList from './input_list';
import MultipleSelect from './multiple_select';
import FileSelect from './file_select';
import TextareaList from './textarea_list';
import ImageCut from './image_cut';
import Password from './password';

function DialogApp() {
  const [dialogList, setDialogList] = useState<DialogOptions[]>([]);
  const onDestroy = useCallback(
    (id: string) => setDialogList((dl) => dl.filter((d) => d.id !== id)),
    [],
  );

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN, (d) =>
      setDialogList((dl) => [...dl, d]),
    );
    return unlistenOpen;
  }, []);

  return (
    <>
      {dialogList.map((d) => {
        switch (d.type) {
          case DialogType.ALERT: {
            return (
              <Alert
                key={d.id}
                options={d as AlertShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.CONFIRM: {
            return (
              <Confirm
                key={d.id}
                options={d as ConfirmShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.CAPTCHA: {
            return (
              <Captcha
                key={d.id}
                options={d as CaptchaShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.INPUT: {
            return (
              <Input
                key={d.id}
                options={d as InputShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.INPUT_LIST: {
            return (
              <InputList
                key={d.id}
                options={d as InputListShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.MULTIPLE_SELECT: {
            return (
              <MultipleSelect
                key={d.id}
                options={d as MultipleSelectShape<unknown>}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.FILE_SELECT: {
            return (
              <FileSelect
                key={d.id}
                options={d as FileSelectShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.TEXTAREA_LIST: {
            return (
              <TextareaList
                key={d.id}
                options={d as TextareaListShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.IMAGE_CUT: {
            return (
              <ImageCut
                key={d.id}
                options={d as ImageCutShape}
                onDestroy={onDestroy}
              />
            );
          }
          case DialogType.PASSWORD: {
            return (
              <Password
                key={d.id}
                options={d as PasswordShape}
                onDestroy={onDestroy}
              />
            );
          }
          default: {
            return null;
          }
        }
      })}
    </>
  );
}

export default DialogApp;
