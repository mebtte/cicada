import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';

class MyAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {
  final player = AudioPlayer();

  MyAudioHandler() {
    player.playerStateStream.listen(_broadcastState);
  }

  @override
  Future<void> play() => player.play();

  @override
  Future<void> pause() => player.pause();

  @override
  Future<void> stop() => player.stop();

  @override
  Future<void> seek(Duration position) => player.seek(position);

  @override
  Future<void> skipToQueueItem(int i) => player.seek(Duration.zero, index: i);

  Future<void> playTest() async {
    final url =
        'https://music.mebtte.com/asset/music/3ee665c538c5793d44e7d11b435dc8fd.mp3';
    var duration = await player.setAudioSource(AudioSource.uri(Uri.parse(url)));
    player.play();

    var item = MediaItem(
      id: url,
      title: "test",
      artist: "hello",
      artUri: Uri.parse(
        "https://music.mebtte.com/asset/music_cover/8de82c491047b3bddbd88f8b21408e72.jpg",
      ),
      duration: duration,
    );
    mediaItem.add(item);
  }

  void _broadcastState(PlayerState state) {
    playbackState.add(
      PlaybackState(
        controls: [
          MediaControl.skipToPrevious,
          state.playing ? MediaControl.pause : MediaControl.play,
          MediaControl.stop,
          MediaControl.skipToNext,
        ],
        androidCompactActionIndices: const [0, 1, 3],
        processingState: {
          ProcessingState.idle: AudioProcessingState.idle,
          ProcessingState.loading: AudioProcessingState.loading,
          ProcessingState.buffering: AudioProcessingState.buffering,
          ProcessingState.ready: AudioProcessingState.ready,
          ProcessingState.completed: AudioProcessingState.completed,
        }[state.processingState]!,
        playing: state.playing,
        updatePosition: player.position,
        bufferedPosition: player.bufferedPosition,
        speed: player.speed,
        updateTime: DateTime.now(),
      ),
    );
  }
}
