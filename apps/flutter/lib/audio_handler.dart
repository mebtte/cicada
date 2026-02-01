import 'package:audio_service/audio_service.dart';
import 'package:cicada/states/audio.dart';
import 'package:just_audio/just_audio.dart';
import './event_bus.dart';
import './states/playqueue.dart';
import './server/base/upload_music_play_record.dart';

class MyAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {
  PlayqueueMusic? lastQueueMusic;
  final player = AudioPlayer();
  final _playTimer = Stopwatch();

  MyAudioHandler() {
    _initStreams();
  }

  void _initStreams() {
    // Listen to all relevant streams and update state
    // We combine the streams or just listen separately and invoke update

    // Just Audio's position stream is what we need for progress bar
    player.positionStream.listen((position) {
      _broadcastState();
    });

    player.bufferedPositionStream.listen((bufferedPosition) {
      _broadcastState();
    });

    player.playerStateStream.listen((PlayerState state) {
      if (state.playing) {
        _playTimer.start();
      } else {
        _playTimer.stop();
      }
      audioState.updatePlaying(state.playing);
      _broadcastState();

      if (state.processingState == ProcessingState.completed) {
        playqueueState.next();
      }
    });
  }

  void _broadcastState() {
    final state = player.playerState;
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
        queueIndex: playqueueState.playqueueIndex,
      ),
    );
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
    _playTimer.reset();
    try {
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
    } catch (e) {
      eventBus.fire(
        PlayErrorEvent(
          musicName: queueMusic.music.name,
          errorMessage: e.toString(),
        ),
      );
    }
  }

  Future<void> _uploadPlayRecord(PlayqueueMusic queueMusic) async {
    final duration = player.duration;
    final playedMilliseconds = _playTimer.elapsedMilliseconds;

    if (duration == null || duration.inMilliseconds == 0) return;

    final percent = (playedMilliseconds / duration.inMilliseconds).clamp(
      0.0,
      1.0,
    );

    try {
      await uploadMusicPlayRecord(
        musicId: queueMusic.music.id,
        percent: percent,
      );
    } catch (e) {
      print('Failed to upload play record: $e');
    }
  }

  void subscribe() {
    playqueueState.addListener(() {
      final currentQueueMusic = playqueueState.currentMusic;
      if (currentQueueMusic != null &&
          currentQueueMusic.pid != lastQueueMusic?.pid) {
        if (lastQueueMusic != null) {
          _uploadPlayRecord(lastQueueMusic!);
        }
        lastQueueMusic = currentQueueMusic;
        playQueueMusic(currentQueueMusic);
      }
    });
  }
}
