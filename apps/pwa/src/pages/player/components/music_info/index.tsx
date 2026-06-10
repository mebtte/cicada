import FeatureMusicInfo, {
  type MusicInfoProps as FeatureMusicInfoProps,
} from '@/features/music/components/music_info';
import eventemitter, { EventType } from '../../eventemitter';

type Props = Omit<FeatureMusicInfoProps, 'onOpenMusic' | 'onOpenSinger'>;

function MusicInfo(props: Props) {
  return (
    <FeatureMusicInfo
      {...props}
      onOpenMusic={(musicId) =>
        eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, { id: musicId })
      }
      onOpenSinger={(singer) =>
        eventemitter.emit(EventType.OPEN_ARTIST_DRAWER, { id: singer.id })
      }
    />
  );
}

export default MusicInfo;
