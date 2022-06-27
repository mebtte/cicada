import { useEffect } from 'react';
import { IS_WINDOWS, IS_MAC_OS } from '@/constants';
import keyboardHandlerWrapper from '@/utils/keyboard_handler_wrapper';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useNavigate from '#/utils/use_navigate';
import { Musicbill } from '../../constants';

export default (musicbillList: Musicbill[]) => {
  const navigate = useNavigate();

  useEffect(() => {
    const listener = keyboardHandlerWrapper((event: KeyboardEvent) => {
      const number = +event.key;
      if (
        !number ||
        number < 1 ||
        number > 9 ||
        number > musicbillList.length ||
        (!(IS_MAC_OS && event.metaKey) && !(IS_WINDOWS && event.ctrlKey))
      ) {
        return;
      }
      event.preventDefault();
      navigate({
        path:
          ROOT_PATH.PLAYER +
          PLAYER_PATH.MUSICBILL.replace(':id', musicbillList[number - 1].id),
      });
    });
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [musicbillList, navigate]);
};
