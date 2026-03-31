import '../request.dart';

Future<void> removeMusicFromMusicbill({
  required String musicbillId,
  required String musicId,
}) async {
  await httpDelete(
    path: "/api/musicbill_music",
    query: {"musicbillId": musicbillId, "musicId": musicId},
    withToken: true,
  );
}
