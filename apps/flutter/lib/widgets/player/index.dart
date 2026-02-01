import 'dart:ui';
import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/music.dart';
import '../../models/lyric.dart';
import '../../server/api/get_lyric.dart';
import '../../states/audio.dart';
import './lyric_view.dart';
import './player_controls.dart';
import './player_header.dart';
import '../../states/playqueue.dart';
import '../../player_controller/show_playlist_dialog.dart';

class PlayerWidget extends StatefulWidget {
  final double? topPadding;

  const PlayerWidget({super.key, this.topPadding});

  @override
  State<PlayerWidget> createState() => _PlayerWidgetState();
}

class _PlayerWidgetState extends State<PlayerWidget> {
  Music? _currentMusic;
  List<LyricLine> _lyrics = [];
  bool _isLoadingLyric = false;
  double _dragOffset = 0;
  bool _isDragging = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final music = context.read<PlayqueueState>().currentMusic?.music;
      if (music != null) {
        _updateMusic(music);
      }
    });
  }

  void _updateMusic(Music music) {
    if (_currentMusic?.id == music.id) return;

    setState(() {
      _currentMusic = music;
      _lyrics = [];
      _isLoadingLyric = false;
    });

    // 纯音乐不加载歌词
    if (!music.isInstrumental) {
      _loadLyric(music);
    }
  }

  Future<void> _loadLyric(Music music) async {
    setState(() {
      _isLoadingLyric = true;
    });

    try {
      final lrc = await getLyric(id: music.id);
      if (mounted && _currentMusic?.id == music.id) {
        setState(() {
          _lyrics = LyricParser.parse(lrc);
          _isLoadingLyric = false;
        });
      }
    } catch (e) {
      if (mounted && _currentMusic?.id == music.id) {
        setState(() {
          _lyrics = [];
          _isLoadingLyric = false;
        });
      }
    }
  }

  void _handleDragStart(DragStartDetails details) {
    // Only start drag if starting from screen edge (within 40px of left or right edge)
    final screenWidth = MediaQuery.of(context).size.width;
    final startX = details.globalPosition.dx;
    final isFromLeftEdge = startX < 40;
    final isFromRightEdge = startX > screenWidth - 40;

    if (isFromLeftEdge || isFromRightEdge) {
      setState(() {
        _isDragging = true;
      });
    }
  }

  void _handleDragUpdate(DragUpdateDetails details) {
    if (!_isDragging) return;
    setState(() {
      // Positive value for dragging right (from left edge)
      // Negative value for dragging left (from right edge)
      _dragOffset = _dragOffset + details.delta.dx;
    });
  }

  void _handleDragEnd(DragEndDetails details) {
    if (!_isDragging) {
      return;
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final threshold = screenWidth * 0.2; // 20% of screen width
    final velocity = details.primaryVelocity ?? 0;

    // Dismiss if dragged far enough or with enough velocity
    if (_dragOffset.abs() > threshold || velocity.abs() > 500) {
      Navigator.of(context).pop();
    } else {
      // Reset position with animation
      setState(() {
        _dragOffset = 0;
        _isDragging = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Only listen to currentMusic changes to avoid unnecessary rebuilds form other playqueue changes
    final currentMusic = context.select<PlayqueueState, Music?>(
      (s) => s.currentMusic?.music,
    );

    if (currentMusic != null && _currentMusic?.id != currentMusic.id) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _updateMusic(currentMusic);
      });
    }

    if (currentMusic == null) {
      return const SizedBox.shrink();
    }

    final displayMusic = currentMusic;
    // AudioHandler is a singleton/service, it doesn't notify changes itself (streams do)
    // So we use read() to avoid rebuilding if it were to notify (which it shouldn't, but safe is better)
    final audioHandler = context.read<AudioHandler>();

    return GestureDetector(
      onHorizontalDragStart: _handleDragStart,
      onHorizontalDragUpdate: _handleDragUpdate,
      onHorizontalDragEnd: _handleDragEnd,
      child: AnimatedContainer(
        duration: _isDragging
            ? Duration.zero
            : const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        transform: Matrix4.translationValues(_dragOffset, 0, 0),
        child: Scaffold(
          body: Stack(
            children: [
              // Background Image and Blur
              _PlayerBackground(coverUrl: displayMusic.cover),

              // Content
              Column(
                children: [
                  PlayerHeader(
                    music: displayMusic,
                    topPadding: widget.topPadding,
                  ),

                  // Lyrics Area
                  Expanded(
                    child: StreamBuilder<Duration>(
                      stream: Stream.periodic(
                        const Duration(milliseconds: 100),
                        (_) => (audioHandler as dynamic).player.position,
                      ),
                      builder: (context, positionSnapshot) {
                        final position = positionSnapshot.data ?? Duration.zero;

                        return LyricView(
                          lyrics: _lyrics,
                          currentPosition: position,
                          isLoading: _isLoadingLyric,
                          isInstrumental: displayMusic.isInstrumental,
                          coverUrl: displayMusic.cover,
                          isPlaying: context.watch<AudioState>().playing,
                          onTap: () {
                            // Tap to toggle controls visibility? for now do nothing or standard
                          },
                        );
                      },
                    ),
                  ),

                  // Controls Area
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 48),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const ProgressBar(),
                        const SizedBox(height: 32),
                        PlayerControls(
                          onBack: () => Navigator.of(context).pop(),
                          onPlaylist: () => showPlaylistDialog(context),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlayerBackground extends StatelessWidget {
  final String? coverUrl;

  const _PlayerBackground({this.coverUrl});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // 背景图片
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 500),
          switchInCurve: Curves.easeIn,
          switchOutCurve: Curves.easeOut,
          child: coverUrl != null
              ? Image.network(
                  coverUrl!,
                  key: ValueKey(coverUrl),
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  alignment: Alignment.center,
                  errorBuilder: (_, __, ___) => Container(
                    key: const ValueKey('error'),
                    color: Colors.grey[900],
                  ),
                )
              : Container(
                  key: const ValueKey('default'),
                  color: Colors.grey[900],
                ),
        ),

        // 模糊遮罩层
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
          child: Container(color: Colors.black.withValues(alpha: 0.5)),
        ),
      ],
    );
  }
}
