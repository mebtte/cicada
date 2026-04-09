import 'dart:async';
import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../event_bus.dart';

/// Display playback error dialog
/// Returns true indicating the user cancelled autoplaying the next song, false indicates autoplay proceeded
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
    final audioHandler = context.read<AudioHandler>();
    Navigator.of(context).pop();
    audioHandler.skipToNext();
  }

  void _cancel() {
    _timer?.cancel();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      title: Row(
        children: [
          Icon(Icons.error_outline_rounded, color: Colors.red[400], size: 28),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Playback Error',
              style: TextStyle(
                color: Colors.black87,
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
          RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 16, color: Colors.black87),
              children: [
                const TextSpan(text: 'Unable to play '),
                TextSpan(
                  text: ' "${widget.event.musicName}"',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 16,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.event.errorMessage,
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 13,
                      fontFamily: 'monospace',
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          LinearProgressIndicator(
            value: 1 - (_remainingSeconds / _countdownSeconds),
            backgroundColor: Colors.grey[200],
            color: Theme.of(context).primaryColor,
            borderRadius: BorderRadius.circular(2),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                Icons.skip_next_rounded,
                color: Theme.of(context).primaryColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Auto skipping in $_remainingSeconds s',
                style: TextStyle(
                  color: Theme.of(context).primaryColor,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _cancel,
          style: TextButton.styleFrom(
            foregroundColor: Colors.grey[600],
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _playNext,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text('Skip Now'),
        ),
      ],
    );
  }
}
