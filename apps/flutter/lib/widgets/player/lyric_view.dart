import 'dart:async';
import 'dart:math' as math;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../models/lyric.dart';
import '../../utils/get_resized_image_url.dart';

class LyricView extends StatefulWidget {
  final List<LyricLine> lyrics;
  final Duration currentPosition;
  final VoidCallback? onTap;
  final bool isLoading;
  final bool isInstrumental;
  final String? coverUrl;
  final bool isPlaying;

  const LyricView({
    super.key,
    required this.lyrics,
    required this.currentPosition,
    this.onTap,
    this.isLoading = false,
    this.isInstrumental = false,
    this.coverUrl,
    this.isPlaying = false,
  });

  @override
  State<LyricView> createState() => _LyricViewState();
}

class _LyricViewState extends State<LyricView>
    with SingleTickerProviderStateMixin {
  late FixedExtentScrollController _scrollController;
  late AnimationController _rotationController;
  int _currentIndex = 0;
  bool _isUserScrolling = false;
  Timer? _userScrollTimer;
  Duration _previousPosition = Duration.zero;

  @override
  void initState() {
    super.initState();
    _scrollController = FixedExtentScrollController();
    _rotationController = AnimationController(
      duration: const Duration(seconds: 20), // 20秒转一圈
      vsync: this,
    );
    // 如果是纯音乐且正在播放，开始旋转
    if (widget.isInstrumental && widget.isPlaying) {
      _rotationController.repeat();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _rotationController.dispose();
    _userScrollTimer?.cancel();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant LyricView oldWidget) {
    super.didUpdateWidget(oldWidget);

    // 控制旋转动画
    if (widget.isInstrumental && widget.isPlaying) {
      if (!_rotationController.isAnimating) {
        _rotationController.repeat();
      }
    } else {
      if (_rotationController.isAnimating) {
        _rotationController.stop();
      }
    }

    // Always update when position changes to ensure responsiveness during seeks
    if (oldWidget.currentPosition.inMilliseconds !=
        widget.currentPosition.inMilliseconds) {
      _updateCurrentIndex();
    }
  }

  void _updateCurrentIndex() {
    if (widget.lyrics.isEmpty) return;

    // Detect if this is a seek (large position jump) or normal playback
    // Do this BEFORE checking index to ensure seeks are always detected
    final positionDiff =
        (widget.currentPosition.inMilliseconds -
                _previousPosition.inMilliseconds)
            .abs();
    final isSeek = positionDiff > 500; // More than 500ms jump = seek

    // Logic to find current line
    // Find the last line whose startTime <= currentPosition
    int newIndex = -1;
    final currentMs = widget.currentPosition.inMilliseconds;

    for (int i = 0; i < widget.lyrics.length; i++) {
      if (widget.lyrics[i].startTime.inMilliseconds > currentMs) {
        break;
      }
      newIndex = i;
    }

    // If before first line, newIndex remains -1, we can map to 0 but maybe show nothing?
    // Let's map to 0 for display
    if (newIndex < 0) newIndex = 0;

    if (newIndex != _currentIndex) {
      if (mounted) {
        setState(() {
          _currentIndex = newIndex;
        });

        _scrollToCurrentIndex(instant: isSeek);
      }
    }

    // Always update previous position
    _previousPosition = widget.currentPosition;
  }

  void _scrollToCurrentIndex({bool instant = false}) {
    if (_isUserScrolling) return;
    if (!_scrollController.hasClients) return;

    if (instant) {
      // Jump immediately without animation for seeks
      _scrollController.jumpToItem(_currentIndex);
    } else {
      // Smooth animation for normal playback
      _scrollController.animateToItem(
        _currentIndex,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // 使用 AnimatedSwitcher 实现状态切换的过渡动画
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      child: _buildContent(),
    );
  }

  Widget _buildContent() {
    // 加载中状态
    if (widget.isLoading) {
      return Center(
        key: const ValueKey('loading'),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(
                  Colors.white.withValues(alpha: 0.6),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '歌词加载中...',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    // 纯音乐状态 - 显示旋转的大封面
    if (widget.isInstrumental) {
      return Center(
        key: const ValueKey('instrumental'),
        child: AnimatedBuilder(
          animation: _rotationController,
          builder: (context, child) {
            return Transform.rotate(
              angle: _rotationController.value * 2 * math.pi,
              child: child,
            );
          },
          child: Container(
            width: 220,
            height: 220,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.4),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: ClipOval(
              child: widget.coverUrl != null
                  ? CachedNetworkImage(
                      imageUrl: getResizedImageUrl(
                        widget.coverUrl!,
                        440,
                      ), // 220px * 2
                      fit: BoxFit.cover,
                      width: 220,
                      height: 220,
                      placeholder: (_, __) => _buildDefaultCover(),
                      errorWidget: (_, __, ___) => _buildDefaultCover(),
                    )
                  : _buildDefaultCover(),
            ),
          ),
        ),
      );
    }

    // 无歌词状态
    if (widget.lyrics.isEmpty) {
      return Center(
        key: const ValueKey('empty'),
        child: Text(
          '暂无歌词',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
        ),
      );
    }

    // 正常歌词显示
    return GestureDetector(
      key: const ValueKey('lyrics'),
      onTap: widget.onTap,
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollStartNotification) {
            _isUserScrolling = true;
            _userScrollTimer?.cancel();
          } else if (notification is ScrollEndNotification) {
            _userScrollTimer = Timer(const Duration(seconds: 2), () {
              if (mounted) {
                setState(() {
                  _isUserScrolling = false;
                });
                _scrollToCurrentIndex(); // Resume following
              }
            });
          }
          return false;
        },
        child: ListWheelScrollView.useDelegate(
          controller: _scrollController,
          itemExtent: 56, // 增加高度以容纳两行歌词
          diameterRatio: 1.5,
          physics: const FixedExtentScrollPhysics(),
          perspective: 0.002,
          onSelectedItemChanged: (index) {
            // We could use this to seek? Maybe later.
          },
          childDelegate: ListWheelChildBuilderDelegate(
            builder: (context, index) {
              final isCurrent = index == _currentIndex;
              final line = widget.lyrics[index];
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 200),
                    style: TextStyle(
                      color: isCurrent
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.4),
                      fontSize: isCurrent ? 18 : 14,
                      fontWeight: isCurrent
                          ? FontWeight.bold
                          : FontWeight.normal,
                      height: 1.4, // 增加行高
                    ),
                    child: Text(
                      line.content,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              );
            },
            childCount: widget.lyrics.length,
          ),
        ),
      ),
    );
  }

  Widget _buildDefaultCover() {
    return Container(
      width: 220,
      height: 220,
      color: Colors.grey[800],
      child: Icon(
        Icons.music_note,
        size: 80,
        color: Colors.white.withValues(alpha: 0.5),
      ),
    );
  }
}
