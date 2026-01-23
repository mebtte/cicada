import 'package:flutter/material.dart';

enum TooltipAlignment { center, left, right }

/// 安全的 Tooltip 组件
/// 使用 Overlay 确保显示在最顶层，避免被 PlayerController 遮挡
/// 并支持鼠标悬停和长按触发
class SafeTooltip extends StatefulWidget {
  final String message;
  final Widget child;
  final TooltipAlignment alignment;

  const SafeTooltip({
    super.key,
    required this.message,
    required this.child,
    this.alignment = TooltipAlignment.center,
  });

  @override
  State<SafeTooltip> createState() => _SafeTooltipState();
}

class _SafeTooltipState extends State<SafeTooltip> {
  OverlayEntry? _overlayEntry;
  bool _isVisible = false;

  void _showTooltip() {
    if (_isVisible) return;
    _isVisible = true;

    final overlay = Overlay.of(context, rootOverlay: true);
    final renderBox = context.findRenderObject() as RenderBox;
    final position = renderBox.localToGlobal(Offset.zero);
    final size = renderBox.size;
    final screenSize = MediaQuery.of(context).size;

    // 计算水平位置
    double? left;
    double? right;

    switch (widget.alignment) {
      case TooltipAlignment.left:
        left = position.dx;
        if (left < 16) left = 16;
        break;
      case TooltipAlignment.right:
        // 右对齐：计算距离屏幕右侧的距离
        right = screenSize.width - (position.dx + size.width);
        if (right < 16) right = 16;
        break;
      case TooltipAlignment.center:
        // 居中对齐仍然需要估算宽度
        // Tooltip 的估计宽度（根据文本长度动态计算）
        const tooltipPadding = 12.0 * 2;
        const charWidth = 7.0;
        final tooltipWidth =
            (widget.message.length * charWidth + tooltipPadding).clamp(
              60.0,
              200.0,
            );

        left = position.dx + size.width / 2 - tooltipWidth / 2;

        // 边界检测
        if (left < 16) left = 16;
        if (left + tooltipWidth > screenSize.width - 16) {
          left = screenSize.width - tooltipWidth - 16;
        }
        break;
    }

    _overlayEntry = OverlayEntry(
      builder: (context) => Stack(
        children: [
          Positioned(
            left: left,
            right: right,
            bottom: screenSize.height - position.dy + 10,
            child: IgnorePointer(
              child: Material(
                color: Colors.transparent,
                elevation: 1000,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: widget.alignment == TooltipAlignment.right
                      ? MainAxisAlignment.end
                      : MainAxisAlignment.start,
                  children: [
                    Container(
                      constraints: BoxConstraints(minWidth: 60, maxWidth: 200),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        widget.message,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );

    overlay.insert(_overlayEntry!);

    // 1.5秒后自动隐藏
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted && _isVisible) {
        _hideTooltip();
      }
    });
  }

  void _hideTooltip() {
    if (!_isVisible) return;
    _isVisible = false;
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  void dispose() {
    _hideTooltip();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => _showTooltip(),
      onExit: (_) => _hideTooltip(),
      child: GestureDetector(onLongPress: _showTooltip, child: widget.child),
    );
  }
}
