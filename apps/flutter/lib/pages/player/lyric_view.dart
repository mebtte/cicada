import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/lyric.dart';

class LyricView extends StatefulWidget {
  final List<LyricLine> lyrics;
  final Duration currentPosition;
  final VoidCallback? onTap;

  const LyricView({
    super.key,
    required this.lyrics,
    required this.currentPosition,
    this.onTap,
  });

  @override
  State<LyricView> createState() => _LyricViewState();
}

class _LyricViewState extends State<LyricView> {
  late FixedExtentScrollController _scrollController;
  int _currentIndex = 0;
  bool _isUserScrolling = false;
  Timer? _userScrollTimer;
  Duration _previousPosition = Duration.zero;

  @override
  void initState() {
    super.initState();
    _scrollController = FixedExtentScrollController();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _userScrollTimer?.cancel();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant LyricView oldWidget) {
    super.didUpdateWidget(oldWidget);
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
    if (widget.lyrics.isEmpty) {
      return Center(
        child: Text(
          'No lyrics',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
        ),
      );
    }

    return GestureDetector(
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
          itemExtent: 40,
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
                child: AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: TextStyle(
                    color: isCurrent
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.4),
                    fontSize: isCurrent ? 18 : 14,
                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                  ),
                  child: Text(
                    line.content,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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
}
