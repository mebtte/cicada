export interface RequestBody {
  username: string;
  password: string;
  totpToken?: string;
}

export type Response = string;
