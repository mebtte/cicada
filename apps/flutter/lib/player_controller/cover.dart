import 'package:cicada/states/audio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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

    return RotationTransition(
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
    );
  }

  /// 构建默认封面
  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
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
