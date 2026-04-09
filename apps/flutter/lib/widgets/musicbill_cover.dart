import 'package:flutter/material.dart';
import './cached_image.dart';

class MusicbillCover extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final bool isPublic;
  final bool isShared;
  final BorderRadius borderRadius;
  final Widget? placeholder;

  const MusicbillCover({
    super.key,
    required this.imageUrl,
    required this.size,
    required this.isPublic,
    required this.isShared,
    required this.borderRadius,
    this.placeholder,
  });

  @override
  Widget build(BuildContext context) {
    final badges = <Widget>[];

    if (isPublic) {
      badges.add(
        const _StatusBadge(
          icon: Icons.public_rounded,
          backgroundColor: Color(0xFF63D1FA),
          tooltip: 'Public musicbill',
        ),
      );
    }

    if (isShared) {
      badges.add(
        const _StatusBadge(
          icon: Icons.people_alt_outlined,
          backgroundColor: Color(0xFFEABEC8),
          tooltip: 'Shared musicbill',
        ),
      );
    }

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            child: CachedImage(
              imageUrl: imageUrl,
              width: size,
              height: size,
              size: (size * 2).round(),
              borderRadius: borderRadius,
              placeholder: placeholder,
              errorWidget: placeholder,
            ),
          ),
          if (badges.isNotEmpty)
            Positioned(
              top: -4,
              right: -4,
              child: Wrap(spacing: 4, children: badges),
            ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final IconData icon;
  final Color backgroundColor;
  final String tooltip;

  const _StatusBadge({
    required this.icon,
    required this.backgroundColor,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Container(
        width: 18,
        height: 18,
        decoration: BoxDecoration(
          color: backgroundColor,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 1.5),
        ),
        child: Icon(icon, size: 10, color: Colors.white),
      ),
    );
  }
}
