import 'dart:async';
import 'dart:math';

import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:cicada/states/audio.dart';
import 'package:cicada/states/playlist.dart';
import 'package:flutter/foundation.dart' show listEquals;
import 'package:just_audio/just_audio.dart';
import './event_bus.dart';
import './server/base/upload_music_play_record.dart';
import './states/playqueue.dart';
import './utils/audio_cache_manager.dart';

class MyAudioHandler extends BaseAudioHandler with QueueHandler, SeekHandler {
  PlayqueueMusic? lastQueueMusic;
  final player = AudioPlayer();
  // ignore: deprecated_member_use
  final _playlist = ConcatenatingAudioSource(
    children: [],
    useLazyPreparation: true,
  );
  final _playTimer = Stopwatch();
  final _random = Random();
  String? _currentLoadingPid;
  ProcessingState? _lastProcessingState;
  bool _shouldPlayAfterLoad = false;
  bool _syncingFromPlayerIndex = false;
  int _loadedQueueBaseIndex = -1;
  int _loadedQueueLength = 0;
  List<String> _loadedQueuePids = const [];
  bool _mutatingPlayqueueFromHandler = false;

  MyAudioHandler() {
    _initPlayer();
    _initStreams();
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
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.music());
  }

  void _initStreams() {
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

    player.currentIndexStream.listen((relativeIndex) {
      if (relativeIndex == null || _loadedQueueBaseIndex < 0) {
        return;
      }

      final absoluteIndex = _loadedQueueBaseIndex + relativeIndex;
      if (absoluteIndex == playqueueState.playqueueIndex) {
        return;
      }

      final previousQueueMusic = lastQueueMusic;

      _syncingFromPlayerIndex = true;
      playqueueState.setCurrentIndex(absoluteIndex);
      _syncingFromPlayerIndex = false;

      final currentQueueMusic = playqueueState.currentMusic;
      if (previousQueueMusic != null &&
          currentQueueMusic != null &&
          previousQueueMusic.pid != currentQueueMusic.pid) {
        unawaited(_uploadPlayRecord(previousQueueMusic));
        _playTimer.reset();
      }
      lastQueueMusic = currentQueueMusic;
      unawaited(_appendUpcomingTrackIfNeeded());
    });

    player.sequenceStateStream.listen((sequenceState) {
      final currentSource = sequenceState.currentSource;
      if (currentSource != null && currentSource.tag is MediaItem) {
        final currentTaggedMediaItem = currentSource.tag as MediaItem;
        mediaItem.add(
          currentTaggedMediaItem.copyWith(duration: player.duration),
        );
      }
      _broadcastState();
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
        androidCompactActionIndices: hasPrevious
            ? const [0, 1, 2]
            : const [0, 1],
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

  MediaItem _buildMediaItem(PlayqueueMusic queueMusic, {Duration? duration}) {
    return MediaItem(
      id: queueMusic.pid,
      title: queueMusic.music.name,
      artist: queueMusic.music.singers.map((s) => s.name).join(','),
      artUri: queueMusic.music.cover == null
          ? null
          : Uri.parse(queueMusic.music.cover!),
      duration: duration,
    );
  }

  List<AudioSource> _buildSources(List<PlayqueueMusic> queue) {
    return queue.map((queueMusic) {
      return AudioCacheManager.instance.getAudioSource(
        queueMusic.music.id,
        queueMusic.music.asset,
        tag: _buildMediaItem(queueMusic),
      );
    }).toList();
  }

  void _syncAudioServiceQueue(List<PlayqueueMusic> queueSnapshot) {
    queue.add(
      queueSnapshot
          .map((queueMusic) => _buildMediaItem(queueMusic))
          .toList(growable: false),
    );
  }

  Future<void> _handleLoadFailure(String loadingPid) async {
    if (_currentLoadingPid != loadingPid) {
      return;
    }

    _currentLoadingPid = null;
    _shouldPlayAfterLoad = false;

    try {
      await player.stop();
    } catch (_) {
      // Swallow stop errors so the UI can recover from the original failure.
    }

    audioState.updateState(playing: false, loading: false);
    _broadcastState();
  }

  Future<void> _appendUpcomingTrackIfNeeded() async {
    if (_loadedQueueBaseIndex < 0 || _loadedQueueLength == 0) {
      return;
    }

    final currentAbsoluteIndex = playqueueState.playqueueIndex;
    final currentRelativeIndex = currentAbsoluteIndex - _loadedQueueBaseIndex;
    if (currentRelativeIndex != _loadedQueueLength - 1) {
      return;
    }

    final nextAbsoluteIndex = currentAbsoluteIndex + 1;
    PlayqueueMusic? nextQueueMusic;
    if (nextAbsoluteIndex < playqueueState.playqueue.length) {
      nextQueueMusic = playqueueState.playqueue[nextAbsoluteIndex];
    } else {
      final playlist = playlistState.playlist;
      if (playlist.isEmpty) {
        return;
      }

      final playlistMusic = playlist[_random.nextInt(playlist.length)];
      _mutatingPlayqueueFromHandler = true;
      try {
        playqueueState.jump(playlistMusic.music, isUserAdded: false);
      } finally {
        _mutatingPlayqueueFromHandler = false;
      }
      if (nextAbsoluteIndex < playqueueState.playqueue.length) {
        nextQueueMusic = playqueueState.playqueue[nextAbsoluteIndex];
      }
    }

    if (nextQueueMusic == null) {
      return;
    }

    await _playlist.add(
      AudioCacheManager.instance.getAudioSource(
        nextQueueMusic.music.id,
        nextQueueMusic.music.asset,
        tag: _buildMediaItem(nextQueueMusic),
      ),
    );
    _loadedQueuePids = playqueueState.playqueue
        .map((queueMusic) => queueMusic.pid)
        .toList(growable: false);
    _loadedQueueLength = _loadedQueuePids.length;
    _syncAudioServiceQueue(playqueueState.playqueue);
  }

  Future<void> _loadCurrentQueue({
    required PlayqueueMusic queueMusic,
    required Duration initialPosition,
    required bool resetPlayTimer,
    required bool shouldPlayAfterLoad,
  }) async {
    if (resetPlayTimer) {
      _playTimer.reset();
    }
    _shouldPlayAfterLoad = shouldPlayAfterLoad;
    final loadingPid = queueMusic.pid;
    _currentLoadingPid = loadingPid;
    final queueIndex = playqueueState.playqueueIndex;
    if (queueIndex < 0 || queueIndex >= playqueueState.playqueue.length) {
      return;
    }
    final queueSnapshot = List<PlayqueueMusic>.from(playqueueState.playqueue);
    _loadedQueueBaseIndex = 0;
    _loadedQueueLength = queueSnapshot.length;
    _loadedQueuePids = queueSnapshot
        .map((queueMusic) => queueMusic.pid)
        .toList(growable: false);
    _syncAudioServiceQueue(queueSnapshot);

    await player.stop();

    try {
      await _playlist.clear();
      await _playlist.addAll(_buildSources(queueSnapshot));

      final duration = await player
          .setAudioSource(
            _playlist,
            initialIndex: queueIndex,
            initialPosition: initialPosition,
            preload: true,
          )
          .timeout(
            const Duration(seconds: 60),
            onTimeout: () {
              throw TimeoutException('Loading timeout after 60 seconds');
            },
          );

      if (_currentLoadingPid != loadingPid) {
        return;
      }

      mediaItem.add(_buildMediaItem(queueMusic, duration: duration));
      _broadcastState();
      await _appendUpcomingTrackIfNeeded();

      if (_shouldPlayAfterLoad) {
        await player.play();
      }
      if (_currentLoadingPid == loadingPid) {
        _currentLoadingPid = null;
      }
    } on PlayerInterruptedException {
      // A newer song load took over; ignore the interrupted request.
    } on TimeoutException {
      if (_currentLoadingPid == loadingPid) {
        await _handleLoadFailure(loadingPid);
        eventBus.fire(
          PlayErrorEvent(
            musicName: queueMusic.music.name,
            errorMessage:
                'Loading timeout, please check your network connection',
          ),
        );
      }
    } catch (error) {
      if (_currentLoadingPid == loadingPid) {
        await _handleLoadFailure(loadingPid);
        eventBus.fire(
          PlayErrorEvent(
            musicName: queueMusic.music.name,
            errorMessage: error.toString(),
          ),
        );
      }
    }
  }

  Future<void> playQueueMusic(PlayqueueMusic queueMusic) {
    return _loadCurrentQueue(
      queueMusic: queueMusic,
      initialPosition: Duration.zero,
      resetPlayTimer: true,
      shouldPlayAfterLoad: true,
    );
  }

  Future<void> _reloadCurrentQueue() {
    final currentQueueMusic = playqueueState.currentMusic;
    if (currentQueueMusic == null) {
      return Future.value();
    }

    return _loadCurrentQueue(
      queueMusic: currentQueueMusic,
      initialPosition: player.position,
      resetPlayTimer: false,
      shouldPlayAfterLoad: player.playing,
    );
  }

  @override
  Future<void> play() {
    _shouldPlayAfterLoad = true;
    if (player.audioSource != null) {
      return player.play();
    }

    final currentQueueMusic = playqueueState.currentMusic;
    if (currentQueueMusic == null) {
      return Future.value();
    }

    return playQueueMusic(currentQueueMusic);
  }

  @override
  Future<void> pause() {
    _shouldPlayAfterLoad = false;
    return player.pause();
  }

  @override
  Future<void> skipToPrevious() async {
    _shouldPlayAfterLoad = true;
    if (player.audioSource != null && player.hasPrevious) {
      await player.seekToPrevious();
      if (!player.playing) {
        await player.play();
      }
      return;
    }
    playqueueState.previous();
  }

  @override
  Future<void> skipToNext() async {
    _shouldPlayAfterLoad = true;
    await _appendUpcomingTrackIfNeeded();
    if (player.audioSource != null && player.hasNext) {
      await player.seekToNext();
      if (!player.playing) {
        await player.play();
      }
      return;
    }
    playqueueState.next();
  }

  @override
  Future<void> seek(Duration position) => player.seek(position);

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
    } catch (error) {
      // ignore: avoid_print
      print('Failed to upload play record: $error');
    }
  }

  void subscribe() {
    playqueueState.addListener(() {
      if (_syncingFromPlayerIndex || _mutatingPlayqueueFromHandler) {
        return;
      }

      final currentQueueMusic = playqueueState.currentMusic;
      if (currentQueueMusic == null) {
        return;
      }

      final currentQueuePids = playqueueState.playqueue
          .map((queueMusic) => queueMusic.pid)
          .toList(growable: false);
      if (currentQueueMusic.pid == lastQueueMusic?.pid) {
        if (!listEquals(_loadedQueuePids, currentQueuePids)) {
          unawaited(_reloadCurrentQueue());
        }
        return;
      }

      final previousQueueMusic = lastQueueMusic;
      lastQueueMusic = currentQueueMusic;

      if (previousQueueMusic != null) {
        unawaited(_uploadPlayRecord(previousQueueMusic));
      }

      unawaited(playQueueMusic(currentQueueMusic));
    });
  }
}
