import 'dart:async';
import 'package:flutter/material.dart';
import '../event_bus.dart';
import '../states/playqueue.dart';

/// 显示播放失败对话框
/// 返回 true 表示用户取消了自动播放下一首，false 表示自动播放下一首
void showPlayErrorDialog(BuildContext context, PlayErrorEvent event) {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => _PlayErrorDialog(event: event),
  );
}

class _PlayErrorDialog extends StatefulWidget {
  final PlayErrorEvent event;

  const _PlayErrorDialog({required this.event});

  @override
  State<_PlayErrorDialog> createState() => _PlayErrorDialogState();
}

class _PlayErrorDialogState extends State<_PlayErrorDialog> {
  static const int _countdownSeconds = 10;
  late int _remainingSeconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = _countdownSeconds;
    _startCountdown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      setState(() {
        _remainingSeconds--;
      });

      if (_remainingSeconds <= 0) {
        timer.cancel();
        _playNext();
      }
    });
  }

  void _playNext() {
    Navigator.of(context).pop();
    playqueueState.next();
  }

  void _cancel() {
    _timer?.cancel();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: Colors.grey[900],
      title: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red[400], size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '播放失败',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '无法播放「${widget.event.musicName}」',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.event.errorMessage,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 13,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.skip_next, color: Colors.blue[400], size: 20),
                const SizedBox(width: 8),
                Text(
                  '$_remainingSeconds 秒后自动播放下一首',
                  style: TextStyle(
                    color: Colors.blue[400],
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _cancel,
          style: TextButton.styleFrom(
            foregroundColor: Colors.white.withValues(alpha: 0.7),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
          child: const Text('取消自动播放', style: TextStyle(fontSize: 15)),
        ),
        ElevatedButton(
          onPressed: _playNext,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text('立即播放下一首', style: TextStyle(fontSize: 15)),
        ),
      ],
    );
  }
}
