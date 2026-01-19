import '../request.dart';

Future<String> loginWith2FA({
  required String username,
  required String password,
  required String twoFAToken,
}) async {
  final token = await httpPost(
    path: "/base/login_with_2fa",
    data: {
      "username": username,
      "password": password,
      "twoFAToken": twoFAToken,
    },
  );
  return token;
}
