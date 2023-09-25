export interface RequestBody {
  username: string;
  password: string;
  captchaId: string;
  captchaValue: string;
}

export type Response = string;
