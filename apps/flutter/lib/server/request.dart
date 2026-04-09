import '../constants/index.dart';
import '../states/server.dart';
import 'package:dio/dio.dart';
import './server_exception.dart';

final dio = Dio();

class ResponseWrapper {
  final String code;
  final dynamic data;

  ResponseWrapper({required this.code, required this.data});

  factory ResponseWrapper.fromJson(Map<String, dynamic> json) =>
      ResponseWrapper(code: json['code'], data: json['data']);
}

Map<String, String> getTokenHeader(bool withToken) {
  return {
    TOKEN_HEADER_KEY: withToken ? serverState.currentUser?.token ?? "" : "",
  };
}

Future<dynamic> handleResponse(Response<dynamic> response) async {
  if (response.statusCode != 200) {
    throw Exception(
      "The server responsed with code \"${response.statusCode}\"",
    );
  }
  final responseData = ResponseWrapper.fromJson(response.data);
  if (responseData.code != 'success') {
    throw ServerException(
      code: responseData.code,
      message: response.data['message'] ?? responseData.code,
    );
  }
  return responseData.data;
}

Future<dynamic> httpGet<Data>({
  required String path,
  Map<String, String>? query,
  bool withToken = false,
  String? origin,
  Map<String, String>? headers,
}) async {
  final response = await dio.get(
    '${origin ?? serverState.currentServer!.origin}$path',
    queryParameters: query,
    options: Options(
      headers: {...getTokenHeader(withToken), ...(headers ?? {})},
    ),
  );
  return handleResponse(response);
}

Future<dynamic> httpPost<Data>({
  required String path,
  Map<String, String>? query,
  Object? data,
  bool withToken = false,
  String? origin,
}) async {
  final response = await dio.post(
    '${origin ?? serverState.currentServer!.origin}$path',
    queryParameters: query,
    data: data,
    options: Options(
      headers: {
        ...getTokenHeader(withToken),
        "content-type": "application/json",
      },
    ),
  );
  return handleResponse(response);
}

Future<dynamic> httpDelete<Data>({
  required String path,
  Map<String, String>? query,
  Object? data,
  bool withToken = false,
  String? origin,
}) async {
  final response = await dio.delete(
    '${origin ?? serverState.currentServer!.origin}$path',
    queryParameters: query,
    data: data,
    options: Options(
      headers: {
        ...getTokenHeader(withToken),
        "content-type": "application/json",
      },
    ),
  );
  return handleResponse(response);
}
