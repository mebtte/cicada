import '../request.dart';
import '../../states/server.dart';

Future<void> uploadMusicPlayRecord({
  required String musicId,
  required double percent,
}) async {
  final token = serverState.currentUser?.token;
  if (token == null) return;

  await httpPost(
    path: '/base/music_play_record',
    data: {'token': token, 'musicId': musicId, 'percent': percent},
  );
}
