import 'package:shared_preferences/shared_preferences.dart';

class StorageKey {
  static const String SERVER = "server";
  static const String WINDOW_WIDTH = 'window-width';
  static const String WINDOW_HEIGHT = 'window-height';
}

class _Preference {
  late SharedPreferences instance;

  Future<void> initialize() async {
    instance = await SharedPreferences.getInstance();
  }
}

final preference = _Preference();
