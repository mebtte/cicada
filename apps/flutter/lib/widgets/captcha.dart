import '../server/base/get_captcha.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class CaptchaWidget extends StatefulWidget {
  final Future<void> Function({required Captcha captcha, required String input})
  onContinue;

  const CaptchaWidget({super.key, required this.onContinue});

  @override
  State<CaptchaWidget> createState() => _CaptchaWidgetState();
}

class _CaptchaWidgetState extends State<CaptchaWidget> {
  Exception? exception;
  Captcha? captcha;
  bool loading = false;

  late TextEditingController inputController;

  @override
  void initState() {
    super.initState();
    inputController = TextEditingController();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    getCaptchaWrapper();
  }

  Future<void> getCaptchaWrapper() async {
    setState(() {
      exception = null;
      captcha = null;
    });
    try {
      final captcha = await getCaptcha();
      setState(() {
        this.captcha = captcha;
      });
    } catch (e) {
      setState(() {
        exception = e as Exception;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return exception == null
        ? captcha == null
              ? CircularProgressIndicator()
              : Column(
                  children: [
                    SvgPicture.string(captcha!.svg),
                    TextField(
                      readOnly: loading,
                      controller: inputController,
                      decoration: InputDecoration(
                        label: Text("Captcha"),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    loading
                        ? CircularProgressIndicator()
                        : ElevatedButton(
                            onPressed: () async {
                              final input = inputController.text;
                              if (input.isEmpty) {
                                ScaffoldMessenger.of(
                                  Navigator.of(
                                    context,
                                    rootNavigator: true,
                                  ).context,
                                ).showSnackBar(
                                  SnackBar(
                                    content: Text("Please enter captcha"),
                                  ),
                                );
                                return;
                              }

                              setState(() {
                                loading = true;
                              });
                              try {
                                await widget.onContinue(
                                  captcha: captcha!,
                                  input: input,
                                );
                              } catch (e) {
                                Navigator.pop(context);
                              }
                              setState(() {
                                loading = false;
                              });
                            },
                            child: Text("Continue"),
                          ),
                  ],
                )
        : Center(child: Text(exception.toString()));
  }
}
