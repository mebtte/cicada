import 'package:flutter/material.dart';
import '../../models/music.dart';

class PlayerHeader extends StatelessWidget {
  final Music music;
  final double? topPadding;

  const PlayerHeader({super.key, required this.music, this.topPadding});

  @override
  Widget build(BuildContext context) {
    final safePadding = topPadding ?? MediaQuery.of(context).padding.top;

    return Padding(
      padding: EdgeInsets.only(top: safePadding),
      child: Container(
        height: kToolbarHeight,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    music.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    music.singers.map((s) => s.name).join(' / '),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 12,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
