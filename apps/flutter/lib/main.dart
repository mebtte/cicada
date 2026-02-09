import 'package:cicada/states/playqueue.dart';
import 'package:flutter/foundation.dart'
    show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import './states/playlist.dart';
import './utils/preference.dart';
import './window_manager.dart';
import './app.dart';
import './states/server.dart';
import './audio_handler.dart';
import './states/musicbill.dart';
import './states/audio.dart';
import './states/route.dart';

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

  // 请求通知权限 (Android 13+)
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    await Permission.notification.request();
  }

  final audioHandler = await AudioService.init(
    builder: () => MyAudioHandler(),
    config: AudioServiceConfig(
      androidNotificationChannelId: 'com.mebtte.cicada.audio',
      androidNotificationChannelName: 'Cicada Audio',
      androidStopForegroundOnPause: false,
      androidNotificationIcon: 'mipmap/ic_launcher',
      androidShowNotificationBadge: true,
      preloadArtwork: true,
      androidNotificationClickStartsActivity: true,
    ),
  );
  audioHandler.subscribe();
  GetIt.instance.registerSingleton(audioHandler);

  await serverState.initialize();

  playlistState.subscribe();
  playqueueState.subscribe();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: serverState),
        Provider<AudioHandler>.value(value: audioHandler),
        ChangeNotifierProvider.value(value: musicbillState),
        ChangeNotifierProvider.value(value: playlistState),
        ChangeNotifierProvider.value(value: playqueueState),
        ChangeNotifierProvider.value(value: audioState),
        ChangeNotifierProvider.value(value: routeState),
      ],
      child: App(),
    ),
  );
}
