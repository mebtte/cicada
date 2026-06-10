import SingerBase, {
  type SingerProps as SingerBaseProps,
} from '@/features/music/components/singer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

function Singer({ singer }: Pick<SingerBaseProps, 'singer'>) {
  return (
    <SingerBase
      singer={singer}
      onOpen={(nextSinger) =>
        playerEventemitter.emit(PlayerEventType.OPEN_ARTIST_DRAWER, {
          id: nextSinger.id,
        })
      }
    />
  );
}

export default Singer;
