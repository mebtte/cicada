export type CaptchaData =
  | {
      error: null;
      loading: true;
      data: null;
    }
  | {
      error: Error;
      loading: false;
      data: null;
    }
  | {
      error: null;
      loading: false;
      data: { id: string; svg: string };
    };
