import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/music.dart';
import '../../server/server_exception.dart';
import '../../states/musicbill.dart';
import '../../widgets/cached_image.dart';
import '../../widgets/error_view.dart';
import '../../widgets/musicbill_cover.dart';
import '../home/create_musicbill_dialog.dart';

void showAddToMusicbillSheet(BuildContext context, {required Music music}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useRootNavigator: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return FractionallySizedBox(
        heightFactor: 0.82,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: _AddToMusicbillSheetContent(music: music),
        ),
      );
    },
  );
}

class _AddToMusicbillSheetContent extends StatefulWidget {
  final Music music;

  const _AddToMusicbillSheetContent({required this.music});

  @override
  State<_AddToMusicbillSheetContent> createState() =>
      _AddToMusicbillSheetContentState();
}

class _AddToMusicbillSheetContentState
    extends State<_AddToMusicbillSheetContent> {
  final Set<String> _processingMusicbillIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final musicbillState = context.read<MusicbillState>();
      if (musicbillState.musicbillList.isEmpty && !musicbillState.loading) {
        musicbillState.reloadMusicbillList(silence: false);
      }
    });
  }

  Future<void> _handleCreateMusicbill() async {
    final createdMusicbillId = await showDialog<String>(
      context: context,
      useRootNavigator: true,
      builder: (context) => const CreateMusicbillDialog(),
    );
    if (!mounted || createdMusicbillId == null) {
      return;
    }
    await context.read<MusicbillState>().reloadMusicbill(
      id: createdMusicbillId,
      silence: true,
    );
  }

  Future<void> _handleMusicbillTap(Musicbill musicbill) async {
    final musicbillState = context.read<MusicbillState>();
    final musicbillId = musicbill.id;

    if (_processingMusicbillIds.contains(musicbillId)) {
      return;
    }

    switch (musicbill.status) {
      case MusicbillStatus.LOADING:
        _showMessage('Please wait for the musicbill to finish loading');
        return;
      case MusicbillStatus.INITIAL:
      case MusicbillStatus.FAILED:
        await musicbillState.reloadMusicbill(id: musicbillId, silence: false);
        return;
      case MusicbillStatus.SUCCESSFUL:
        final alreadyAdded = musicbillState.containsMusic(
          musicbillId: musicbillId,
          musicId: widget.music.id,
        );

        setState(() => _processingMusicbillIds.add(musicbillId));
        try {
          if (alreadyAdded) {
            await musicbillState.removeMusicFromMusicbill(
              musicbillId: musicbillId,
              music: widget.music,
            );
          } else {
            await musicbillState.addMusicToMusicbill(
              musicbillId: musicbillId,
              music: widget.music,
            );
          }
        } catch (error) {
          if (mounted) {
            _showMessage(
              error is ServerException
                  ? error.message
                  : alreadyAdded
                  ? 'Failed to remove music from musicbill'
                  : 'Failed to add music to musicbill',
            );
          }
        } finally {
          if (mounted) {
            setState(() => _processingMusicbillIds.remove(musicbillId));
          }
        }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final musicbillState = context.watch<MusicbillState>();
    final musicbillList = musicbillState.musicbillList;

    return SafeArea(
      top: false,
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 8, bottom: 4),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
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
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: Colors.black87,
                              fontWeight: FontWeight.w700,
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _artistText,
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Add to musicbill',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.black87,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton.filledTonal(
                  onPressed: _handleCreateMusicbill,
                  tooltip: 'Create musicbill',
                  icon: const Icon(Icons.add_box_outlined, size: 18),
                ),
              ],
            ),
          ),
          Expanded(
            child: Builder(
              builder: (context) {
                if (musicbillState.loading && musicbillList.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (musicbillState.exception != null && musicbillList.isEmpty) {
                  return ErrorView(
                    title: 'Failed to load musicbills',
                    errorMessage: musicbillState.exception.toString(),
                    onRetry: () =>
                        musicbillState.reloadMusicbillList(silence: false),
                  );
                }

                if (musicbillList.isEmpty) {
                  return Center(
                    child: Text(
                      'No musicbills yet',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  itemCount: musicbillList.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final musicbill = musicbillList[index];
                    return _MusicbillSelectionTile(
                      musicbill: musicbill,
                      musicId: widget.music.id,
                      processing: _processingMusicbillIds.contains(
                        musicbill.id,
                      ),
                      onTap: () => _handleMusicbillTap(musicbill),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String get _artistText {
    if (widget.music.singers.isEmpty) {
      return 'Unknown Artist';
    }
    return widget.music.singers.map((singer) => singer.name).join(', ');
  }

  Widget _buildCover(BuildContext context) {
    if (widget.music.cover != null && widget.music.cover!.isNotEmpty) {
      return CachedImage(
        imageUrl: widget.music.cover,
        width: 52,
        height: 52,
        size: 104,
        borderRadius: BorderRadius.circular(12),
        placeholder: _buildDefaultCover(context),
        errorWidget: _buildDefaultCover(context),
      );
    }
    return _buildDefaultCover(context);
  }

  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        Icons.music_note_rounded,
        color: Theme.of(context).primaryColor,
        size: 24,
      ),
    );
  }
}

class _MusicbillSelectionTile extends StatelessWidget {
  final Musicbill musicbill;
  final String musicId;
  final bool processing;
  final VoidCallback onTap;

  const _MusicbillSelectionTile({
    required this.musicbill,
    required this.musicId,
    required this.processing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final containsMusic = musicbill.musicList.any(
      (music) => music.id == musicId,
    );
    final statusSubtitle = switch (musicbill.status) {
      MusicbillStatus.SUCCESSFUL => '${musicbill.musicList.length} tracks',
      MusicbillStatus.LOADING => 'Loading musicbill...',
      MusicbillStatus.FAILED => 'Tap to retry loading',
      MusicbillStatus.INITIAL => null,
    };
    final subtitleParts = [if (statusSubtitle != null) statusSubtitle];
    final subtitle = subtitleParts.join(' · ');

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              _buildLeadingIcon(context, containsMusic),
              const SizedBox(width: 12),
              _buildCover(context),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      musicbill.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.black87,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLeadingIcon(BuildContext context, bool containsMusic) {
    if (processing || musicbill.status == MusicbillStatus.LOADING) {
      return SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2.2,
          color: Theme.of(context).primaryColor,
        ),
      );
    }

    if (musicbill.status == MusicbillStatus.SUCCESSFUL) {
      return Icon(
        containsMusic
            ? Icons.check_box_rounded
            : Icons.check_box_outline_blank_rounded,
        color: containsMusic ? Theme.of(context).primaryColor : Colors.black54,
        size: 24,
      );
    }

    return Icon(Icons.help_outline_rounded, color: Colors.black45, size: 24);
  }

  Widget _buildCover(BuildContext context) {
    return MusicbillCover(
      imageUrl: musicbill.cover,
      size: 44,
      isPublic: musicbill.isPublic,
      isShared: musicbill.isShared,
      borderRadius: BorderRadius.circular(10),
      placeholder: _buildDefaultCover(context),
    );
  }

  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        Icons.library_music_rounded,
        color: Theme.of(context).primaryColor,
        size: 20,
      ),
    );
  }
}
