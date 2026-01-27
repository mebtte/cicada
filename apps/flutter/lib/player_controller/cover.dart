import 'package:cicada/states/audio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:audio_service/audio_service.dart';

class RotatingCover extends StatefulWidget {
  final String? coverUrl;

  const RotatingCover({super.key, this.coverUrl});

  @override
  State<RotatingCover> createState() => _RotatingCoverState();
}

class _RotatingCoverState extends State<RotatingCover>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    );
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _controller.forward(from: 0);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final playing = context.select<AudioState, bool>((value) => value.playing);

    if (playing) {
      if (!_controller.isAnimating) {
        _controller.forward(from: _controller.value);
      }
    } else {
      if (_controller.isAnimating) {
        _controller.stop();
      }
    }

    final audioHandler = context.read<AudioHandler>();

    return StreamBuilder<MediaItem?>(
      stream: audioHandler.mediaItem,
      builder: (context, snapshot) {
        final mediaItem = snapshot.data;
        final duration = mediaItem?.duration ?? Duration.zero;

        return StreamBuilder<PlaybackState>(
          stream: audioHandler.playbackState,
          builder: (context, snapshot) {
            final playbackState = snapshot.data;
            final processingState =
                playbackState?.processingState ?? AudioProcessingState.idle;

            return StreamBuilder<Duration>(
              stream: Stream.periodic(const Duration(milliseconds: 200), (_) {
                if (playbackState == null) return Duration.zero;
                final now = DateTime.now();
                final updateTime = playbackState.updateTime;
                final position =
                    playbackState.updatePosition +
                    (now.difference(updateTime)) * playbackState.speed;
                return position;
              }),
              builder: (context, snapshot) {
                final position = snapshot.data ?? Duration.zero;
                double value = 0.0;
                if (duration.inMilliseconds > 0) {
                  value = (position.inMilliseconds / duration.inMilliseconds)
                      .clamp(0.0, 1.0);
                }

                return Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 42,
                      height: 42,
                      child: CircularProgressIndicator(
                        value: value,
                        strokeWidth: 2,
                        backgroundColor: Theme.of(
                          context,
                        ).primaryColor.withValues(alpha: 0.3),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Theme.of(context).primaryColor,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: RotationTransition(
                        turns: _controller,
                        child: widget.coverUrl != null
                            ? ClipOval(
                                child: AspectRatio(
                                  aspectRatio: 1,
                                  child: Image.network(
                                    widget.coverUrl!,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return _buildDefaultCover(context);
                                    },
                                  ),
                                ),
                              )
                            : _buildDefaultCover(context),
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  /// 构建默认封面
  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(
        Icons.music_note,
        color: Theme.of(context).primaryColor,
        size: 20,
      ),
    );
  }
}
