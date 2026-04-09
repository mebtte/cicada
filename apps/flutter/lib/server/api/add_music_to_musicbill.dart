import '../request.dart';

Future<void> addMusicToMusicbill({
  required String musicbillId,
  required String musicId,
}) async {
  await httpPost(
    path: "/api/musicbill_music",
    data: {"musicbillId": musicbillId, "musicId": musicId},
    withToken: true,
  );
}
