import './utils/preference.dart';
import 'package:flutter/material.dart';
import 'package:window_manager/window_manager.dart';

class MyWindowListener extends WindowListener {
  @override
  Future<void> onWindowClose() async {
    windowManager.hide();
  }

  @override
  Future<void> onWindowResized() async {
    final size = await windowManager.getSize();
    await preference.instance.setDouble(StorageKey.WINDOW_WIDTH, size.width);
    await preference.instance.setDouble(StorageKey.WINDOW_HEIGHT, size.height);
  }
}

Future<void> initializeWindow() async {
  await windowManager.ensureInitialized();
  windowManager.waitUntilReadyToShow(
    WindowOptions(
      size: Size(
        preference.instance.getDouble(StorageKey.WINDOW_WIDTH) ?? 800,
        preference.instance.getDouble(StorageKey.WINDOW_HEIGHT) ?? 600,
      ),
      minimumSize: Size(350, 600),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.hidden,
      title: "Cicada",
      windowButtonVisibility: false,
    ),
    () async {
      await windowManager.show();
      await windowManager.focus();
    },
  );
  windowManager.addListener(MyWindowListener());
}
