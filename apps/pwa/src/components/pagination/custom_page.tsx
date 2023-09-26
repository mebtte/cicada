import {
  ChangeEventHandler,
  CSSProperties,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react';
import Popup from '@/components/popup';
import { UtilZIndex } from '@/constants/style';
import { t } from '@/i18n';
import Input from '../input';
import Label from '../label';
import e, { EventType } from './eventemitter';
import { IS_TOUCHABLE } from '../../constants/browser';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: UtilZIndex.PAGINATION },
};
const bodyProps: {
  style: CSSProperties;
} = {
  style: {
    width: 250,
    padding: '20px 20px max(env(safe-area-inset-bottom, 20px), 20px) 20px',
  },
};

function CustomPage({
  id,
  totalPage,
  onChange,
}: {
  id: string;
  totalPage: number;
  onChange: (page: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  const [page, setPage] = useState('');
  const onPageChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = event.target.value.replace(/\D/g, '');
    if (value) {
      const n = Number(value);
      if (n < 1) {
        return setPage('1');
      }
      if (n > totalPage) {
        return setPage(totalPage.toString());
      }
    }
    return setPage(value);
  };
  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      if (page) {
        onChange(Number(page));
      }
      onClose();
    }
  };

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_CUSTOM_PAGE, (emitedId) =>
      id === emitedId ? setOpen(true) : undefined,
    );
    return unlistenOpen;
  }, [id]);

  return (
    <Popup
      open={open}
      onClose={onClose}
      maskProps={maskProps}
      bodyProps={bodyProps}
    >
      <Label label={t('jump_to')}>
        <Input
          value={page}
          onChange={onPageChange}
          onKeyDown={onKeyDown}
          autoFocus={!IS_TOUCHABLE}
        />
      </Label>
    </Popup>
  );
}

export default CustomPage;
