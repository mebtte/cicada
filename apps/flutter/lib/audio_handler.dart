import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';
import './states/playqueue.dart';

class MyAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {
  PlayqueueMusic? lastQueueMusic;
  final player = AudioPlayer();

  MyAudioHandler() {
    player.playerStateStream.listen(_broadcastState);
  }

  @override
  Future<void> play() => player.play();

  @override
  Future<void> pause() => player.pause();

  @override
  Future<void> skipToPrevious() async => playqueueState.previous();

  @override
  Future<void> skipToNext() async => playqueueState.next();

  @override
  Future<void> seek(Duration position) => player.seek(position);

  Future<void> playQueueMusic(PlayqueueMusic queueMusic) async {
    var duration = await player.setAudioSource(
      AudioSource.uri(Uri.parse(queueMusic.music.asset)),
    );
    player.play();

    var item = MediaItem(
      id: queueMusic.pid,
      title: queueMusic.music.name,
      artist: queueMusic.music.singers.map((s) => s.name).join(','),
      artUri: queueMusic.music.cover == null
          ? null
          : Uri.parse(queueMusic.music.cover!),
      duration: duration,
    );
    mediaItem.add(item);
  }

  void listen() {
    playqueueState.addListener(() {
      final currentQueueMusic = playqueueState.currentMusic;
      if (currentQueueMusic != null &&
          currentQueueMusic.pid != lastQueueMusic?.pid) {
        lastQueueMusic = currentQueueMusic;
        playQueueMusic(currentQueueMusic);
      }
    });
  }

  void _broadcastState(PlayerState state) {
    playbackState.add(
      PlaybackState(
        controls: [
          if (playqueueState.playqueueIndex > 0) MediaControl.skipToPrevious,
          state.playing ? MediaControl.pause : MediaControl.play,
          MediaControl.skipToNext,
        ],
        systemActions: {
          MediaAction.play,
          MediaAction.pause,
          MediaAction.playPause,
          MediaAction.seek,
          MediaAction.seekForward,
          MediaAction.seekBackward,
          MediaAction.skipToPrevious,
          MediaAction.skipToNext,
        },
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
      ),
    );

    if (state.processingState == ProcessingState.completed) {
      playqueueState.next();
    }
  }
}
