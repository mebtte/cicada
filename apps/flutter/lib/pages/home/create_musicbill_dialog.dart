import 'package:flutter/material.dart';
import '../../server/api/create_musicbill.dart';
import '../../states/musicbill.dart';

/// 创建音乐清单对话框
///
/// 提供输入框让用户输入音乐清单名称，并提供确认和取消按钮
class CreateMusicbillDialog extends StatefulWidget {
  const CreateMusicbillDialog({super.key});

  @override
  State<CreateMusicbillDialog> createState() => _CreateMusicbillDialogState();
}

class _CreateMusicbillDialogState extends State<CreateMusicbillDialog> {
  late TextEditingController _nameController;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  /// 处理创建操作
  Future<void> _handleCreate() async {
    final name = _nameController.text.trim();

    // 验证输入
    if (name.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter a musicbill name';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 调用 API 创建 musicbill
      await createMusicbill(name: name);

      // 重新加载列表
      musicbillState.reloadMusicbillList(silence: true);

      // 关闭对话框
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Create Musicbill'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _nameController,
            autofocus: true,
            decoration: InputDecoration(
              labelText: 'Musicbill Name',
              hintText: 'Enter name',
              border: const OutlineInputBorder(),
              errorText: _errorMessage,
            ),
            enabled: !_isLoading,
            onSubmitted: (_) => _handleCreate(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _isLoading ? null : _handleCreate,
          child: _isLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Create'),
        ),
      ],
    );
  }
}
