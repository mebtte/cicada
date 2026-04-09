import '../request.dart';

class Captcha {
  final String id;
  final String svg;

  Captcha({required this.id, required this.svg});

  factory Captcha.fromJson(Map<String, dynamic> json) =>
      Captcha(id: json['id'], svg: json['svg']);
}

Future<Captcha> getCaptcha() async {
  final responseData = await httpGet(path: "/base/captcha");
  return Captcha.fromJson(responseData);
}
