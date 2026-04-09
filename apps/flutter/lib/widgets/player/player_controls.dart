import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class PlayerControls extends StatelessWidget {
  final VoidCallback? onBack;
  final VoidCallback? onAddToMusicbill;
  final VoidCallback? onInsertToPlayqueue;
  final VoidCallback? onPlaylist;

  const PlayerControls({
    super.key,
    this.onBack,
    this.onAddToMusicbill,
    this.onInsertToPlayqueue,
    this.onPlaylist,
  });

  @override
  Widget build(BuildContext context) {
    final audioHandler = context.read<AudioHandler>();

    return StreamBuilder<PlaybackState>(
      stream: audioHandler.playbackState,
      builder: (context, snapshot) {
        final playbackState = snapshot.data;
        final playing = playbackState?.playing ?? false;
        final processingState = playbackState?.processingState;
        final isLoading =
            processingState == AudioProcessingState.loading ||
            processingState == AudioProcessingState.buffering;

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Collapse (Back)
            _ControlButton(
              icon: const Icon(Icons.keyboard_arrow_down_rounded),
              iconSize: 28,
              tooltip: 'Collapse',
              onPressed: onBack,
            ),

            _ControlButton(
              icon: const Icon(Icons.library_add_rounded),
              iconSize: 22,
              tooltip: 'Add to musicbill',
              onPressed: onAddToMusicbill,
            ),

            // Previous
            _ControlButton(
              icon: const Icon(Icons.skip_previous_rounded),
              iconSize: 36,
              onPressed: () => audioHandler.skipToPrevious(),
            ),

            // Play/Pause
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: isLoading
                  ? const Center(
                      child: SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          color: Colors.black,
                        ),
                      ),
                    )
                  : IconButton(
                      icon: Icon(
                        playing
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                      ),
                      iconSize: 48,
                      color: Colors.black,
                      onPressed: () {
                        if (playing) {
                          audioHandler.pause();
                        } else {
                          audioHandler.play();
                        }
                      },
                    ),
            ),

            // Next
            _ControlButton(
              icon: const Icon(Icons.skip_next_rounded),
              iconSize: 36,
              onPressed: () => audioHandler.skipToNext(),
            ),

            _ControlButton(
              icon: const Icon(Icons.playlist_add_rounded),
              iconSize: 22,
              tooltip: 'Insert to playqueue',
              onPressed: onInsertToPlayqueue,
            ),

            // Playlist
            _ControlButton(
              icon: const Icon(Icons.queue_music_rounded),
              iconSize: 28,
              tooltip: 'Open playlist',
              onPressed: onPlaylist,
            ),
          ],
        );
      },
    );
  }
}

class ProgressBar extends StatelessWidget {
  const ProgressBar({super.key});

  @override
  Widget build(BuildContext context) {
    final audioHandler = context.read<AudioHandler>();

    return StreamBuilder<MediaItem?>(
      stream: audioHandler.mediaItem,
      builder: (context, mediaSnapshot) {
        final duration = mediaSnapshot.data?.duration ?? Duration.zero;

        return StreamBuilder<PlaybackState>(
          stream: audioHandler.playbackState,
          builder: (context, playbackSnapshot) {
            final position =
                playbackSnapshot.data?.updatePosition ?? Duration.zero;

            return _SeekBar(
              duration: duration,
              position: position,
              onChangeEnd: (newPosition) {
                audioHandler.seek(newPosition);
              },
            );
          },
        );
      },
    );
  }
}

class _SeekBar extends StatefulWidget {
  final Duration duration;
  final Duration position;
  final ValueChanged<Duration>? onChangeEnd;

  const _SeekBar({
    required this.duration,
    required this.position,
    this.onChangeEnd,
  });

  @override
  State<_SeekBar> createState() => _SeekBarState();
}

class _SeekBarState extends State<_SeekBar> {
  double? _dragValue;

  String _formatDuration(Duration? duration) {
    if (duration == null) return '--:--';
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final value = min(
      _dragValue ?? widget.position.inMilliseconds.toDouble(),
      widget.duration.inMilliseconds.toDouble(),
    );
    final max = widget.duration.inMilliseconds.toDouble();

    return Column(
      children: [
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            trackHeight: 4,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
            overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
            activeTrackColor: Colors.white,
            inactiveTrackColor: Colors.white.withValues(alpha: 0.2),
            thumbColor: Colors.white,
            overlayColor: Colors.white.withValues(alpha: 0.2),
          ),
          child: Slider(
            min: 0.0,
            max: max > 0 ? max : 1.0,
            value: value,
            onChanged: (value) {
              setState(() {
                _dragValue = value;
              });
            },
            onChangeEnd: (value) {
              if (widget.onChangeEnd != null) {
                widget.onChangeEnd!(Duration(milliseconds: value.round()));
              }
              _dragValue = null;
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatDuration(Duration(milliseconds: value.round())),
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              Text(
                _formatDuration(widget.duration),
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  double min(double a, double b) => a < b ? a : b;
}

class _ControlButton extends StatelessWidget {
  final Widget icon;
  final double iconSize;
  final VoidCallback? onPressed;
  final String? tooltip;

  const _ControlButton({
    required this.icon,
    required this.iconSize,
    required this.onPressed,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: icon,
      iconSize: iconSize,
      color: Colors.white,
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
      tooltip: tooltip,
      onPressed: onPressed,
    );
  }
}
