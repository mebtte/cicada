class ErrorWithCode<Code extends number | string> extends Error {
  code: Code;

  constructor(message: string, code: Code) {
    super(message);
    this.code = code;
  }
}

export default ErrorWithCode;
