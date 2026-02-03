import 'package:flutter/material.dart';
import '../../models/music.dart';
import '../../event_bus.dart';
import '../../player_controller/show_playlist_dialog.dart';

/// 自定义音乐选项菜单（Overlay 实现，覆盖 PlayerController）
class MusicOptionMenu extends StatefulWidget {
  final Music music;
  final VoidCallback onPlay;
  final VoidCallback onClose;
  final BuildContext? parentContext; // 用于显示播放队列弹窗

  const MusicOptionMenu({
    super.key,
    required this.music,
    required this.onPlay,
    required this.onClose,
    this.parentContext,
  });

  @override
  State<MusicOptionMenu> createState() => _MusicOptionMenuState();
}

class _MusicOptionMenuState extends State<MusicOptionMenu>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _fadeAnimation = Tween<double>(begin: 0, end: 0.5).animate(_controller);

    _controller.forward();
  }

  Future<void> _close() async {
    await _controller.reverse();
    widget.onClose();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // 背景遮罩
        GestureDetector(
          onTap: _close,
          child: AnimatedBuilder(
            animation: _fadeAnimation,
            builder: (context, child) {
              return Container(
                color: Colors.black.withValues(alpha: _fadeAnimation.value),
              );
            },
          ),
        ),
        // 底部菜单
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: SlideTransition(
            position: _slideAnimation,
            child: Material(
              color: Colors.white,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: SafeArea(
                top: false, // 不需要顶部安全区域
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Row(
                        children: [
                          _buildCover(context),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.music.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                _buildArtists(context),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.play_arrow_rounded),
                      title: const Text('Play'),
                      onTap: () {
                        _close().then((_) => widget.onPlay());
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.playlist_add_rounded),
                      title: const Text('Insert to playqueue'),
                      onTap: () {
                        _close();
                        eventBus.fire(
                          AddMusicListToPlaylistEvent(
                            musicList: [widget.music],
                          ),
                        );
                        // 显示播放列表弹窗，定位到播放列表 tab
                        Future.delayed(const Duration(milliseconds: 100), () {
                          if (widget.parentContext != null &&
                              widget.parentContext!.mounted) {
                            showPlaylistDialog(
                              widget.parentContext!,
                              initialTabIndex: 1,
                            );
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // 复用 MusicListItem 中的构建逻辑
  Widget _buildCover(BuildContext context) {
    if (widget.music.cover != null && widget.music.cover!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          widget.music.cover!,
          width: 44,
          height: 44,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _buildDefaultCover(context);
          },
        ),
      );
    }
    return _buildDefaultCover(context);
  }

  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        Icons.music_note_rounded,
        color: Theme.of(context).primaryColor.withValues(alpha: 0.8),
        size: 22,
      ),
    );
  }

  Widget _buildArtists(BuildContext context) {
    if (widget.music.singers.isEmpty) {
      return const Text(
        'Unknown Artist',
        style: TextStyle(fontSize: 10, color: Colors.black54),
      );
    }
    final artistNames = widget.music.singers
        .map((singer) => singer.name)
        .join(', ');
    return Text(
      artistNames,
      style: const TextStyle(fontSize: 10, color: Colors.black54),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}
