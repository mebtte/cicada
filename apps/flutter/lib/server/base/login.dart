import '../request.dart';

Future<String> login({
  required String username,
  required String password,
  required String captchaId,
  required String captchaValue,
}) async {
  final token = await httpPost(
    path: "/base/login",
    data: {
      "username": username,
      "password": password,
      "captchaId": captchaId,
      "captchaValue": captchaValue,
    },
  );
  return token;
}
