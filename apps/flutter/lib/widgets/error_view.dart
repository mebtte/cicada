import 'package:flutter/material.dart';

/// 通用错误视图组件
/// 用于在数据加载失败时展示错误信息和重试按钮
class ErrorView extends StatelessWidget {
  /// 错误消息（可选）
  final String? errorMessage;

  /// 重试回调函数
  final VoidCallback onRetry;

  /// 自定义错误标题（可选，默认为 "加载失败"）
  final String? title;

  /// 自定义重试按钮文本（可选，默认为 "重试"）
  final String? retryButtonText;

  const ErrorView({
    super.key,
    this.errorMessage,
    required this.onRetry,
    this.title,
    this.retryButtonText,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              title ?? '加载失败',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.grey[800],
                fontWeight: FontWeight.w600,
              ),
            ),
            if (errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                errorMessage!,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 20),
              label: Text(retryButtonText ?? '重试'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 14,
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
