import {
  ChangeEventHandler,
  CSSProperties,
  KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react';
import Popup from '../popup';
import e, { EventType } from './eventemitter';
import Input from '../input';

const bodyProps: {
  style: CSSProperties;
} = {
  style: {
    padding: 20,
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
  const inputRef = useRef<{
    root: HTMLLabelElement;
    input: HTMLInputElement;
  }>(null);

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

  useEffect(() => {
    if (open) {
      inputRef.current?.input.focus();
    }
  }, [open]);

  return (
    <Popup open={open} onClose={onClose} bodyProps={bodyProps}>
      <Input
        ref={inputRef}
        label="跳转到指定页面"
        inputProps={{
          value: page,
          onChange: onPageChange,
          onKeyDown,
        }}
      />
    </Popup>
  );
}

export default CustomPage;
