import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:cicada/states/audio.dart';
import 'package:just_audio/just_audio.dart';
import './event_bus.dart';
import './states/playqueue.dart';
import './server/base/upload_music_play_record.dart';

class MyAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {
  PlayqueueMusic? lastQueueMusic;
  final player = AudioPlayer();
  final _playTimer = Stopwatch();
  String? _currentLoadingPid; // 跟踪当前正在加载的歌曲，用于处理竞态条件
  ProcessingState? _lastProcessingState;

  MyAudioHandler() {
    _initPlayer();
    _initStreams();
    // 设置初始 playbackState，确保 Android 前台服务正确初始化
    playbackState.add(
      PlaybackState(
        controls: [MediaControl.play, MediaControl.skipToNext],
        systemActions: const {
          MediaAction.play,
          MediaAction.pause,
          MediaAction.playPause,
          MediaAction.seek,
          MediaAction.skipToPrevious,
          MediaAction.skipToNext,
        },
        processingState: AudioProcessingState.idle,
        playing: false,
      ),
    );
  }

  Future<void> _initPlayer() async {
    // 配置音频会话为音乐类型
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.music());
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
      audioState.updateState(
        playing: state.playing,
        loading:
            state.processingState == ProcessingState.loading ||
            state.processingState == ProcessingState.buffering,
      );
      _broadcastState();

      if (state.processingState == ProcessingState.completed &&
          _lastProcessingState != ProcessingState.completed) {
        playqueueState.next();
      }
      _lastProcessingState = state.processingState;
    });
  }

  void _broadcastState() {
    final state = player.playerState;
    final hasPrevious = playqueueState.playqueueIndex > 0;

    playbackState.add(
      PlaybackState(
        controls: [
          if (hasPrevious) MediaControl.skipToPrevious,
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
        // 在紧凑视图（系统媒体控制面板）中显示的按钮索引
        androidCompactActionIndices: hasPrevious
            ? const [0, 1, 2] // previous, play/pause, next
            : const [0, 1], // play/pause, next
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
        updateTime: DateTime.now(),
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

    // 记录当前正在加载的歌曲 ID，用于检测竞态条件
    final loadingPid = queueMusic.pid;
    _currentLoadingPid = loadingPid;

    // 先停止当前播放，避免干扰
    await player.stop();

    try {
      // 设置 60 秒超时
      var duration = await player
          .setAudioSource(AudioSource.uri(Uri.parse(queueMusic.music.asset)))
          .timeout(
            const Duration(seconds: 60),
            onTimeout: () {
              throw TimeoutException('Loading timeout after 60 seconds');
            },
          );

      // 检查是否仍是当前要播放的歌曲（用户可能在加载过程中切换了歌曲）
      if (_currentLoadingPid != loadingPid) {
        // 用户已切换到其他歌曲，忽略此次加载结果
        return;
      }

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
      _broadcastState(); // 确保通知更新
    } on TimeoutException {
      // 加载超时
      if (_currentLoadingPid == loadingPid) {
        eventBus.fire(
          PlayErrorEvent(
            musicName: queueMusic.music.name,
            errorMessage:
                'Loading timeout, please check your network connection',
          ),
        );
      }
    } catch (e) {
      // 只有当错误发生时仍是当前歌曲才显示错误
      if (_currentLoadingPid == loadingPid) {
        eventBus.fire(
          PlayErrorEvent(
            musicName: queueMusic.music.name,
            errorMessage: e.toString(),
          ),
        );
      }
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
