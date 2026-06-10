import FeatureMusicBase, {
  type MusicBaseProps as FeatureMusicBaseProps,
} from '@/features/music/components/music_base';
import e, { EventType } from '../../eventemitter';

type Props = Omit<
  FeatureMusicBaseProps,
  'onOpenMusic' | 'onOpenSinger'
>;

function MusicBase(props: Props) {
  return (
    <FeatureMusicBase
      {...props}
      onOpenMusic={(music) =>
        e.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id })
      }
      onOpenSinger={(singer) =>
        e.emit(EventType.OPEN_ARTIST_DRAWER, { id: singer.id })
      }
    />
  );
}

export default MusicBase;
