import './utils/preference.dart';
import 'package:flutter/foundation.dart'
    show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:audio_service/audio_service.dart';
import './window_manager.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';
import './app.dart';
import './states/server.dart';
import './audio_handler.dart';

final getIt = GetIt.instance;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await preference.initialize();

  if (!kIsWeb &&
      [
        TargetPlatform.linux,
        TargetPlatform.macOS,
        TargetPlatform.windows,
      ].contains(defaultTargetPlatform)) {
    initializeWindow();
  }

  var audioHandler = await AudioService.init(builder: () => MyAudioHandler());
  getIt.registerSingleton(audioHandler);

  await serverState.initialize();
  serverState.saveOnChange();

  runApp(
    MultiProvider(
      providers: [ChangeNotifierProvider.value(value: serverState)],
      child: App(),
    ),
  );
}
