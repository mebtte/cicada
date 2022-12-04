import { useTransition } from 'react-spring';
import LyricPanel from './lyric_panel';
import useOpen from './use_open';

function Wrapper() {
  const open = useOpen();

  const transitions = useTransition(open, {
    from: { opacity: 0, transform: 'translateY(100%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(100%)' },
  });
  return transitions((style, o) => (o ? <LyricPanel style={style} /> : null));
}

export default Wrapper;
