export enum Status {
  LOADING,
  SUCCESS,
  ERROR,
  INSTRUMENTAL,
  EMPTY,
}

export type LyricData =
  | {
      status: Status.LOADING;
    }
  | {
      status: Status.SUCCESS;
      lrcs: string[];
    }
  | {
      status: Status.ERROR;
      error: Error;
    }
  | {
      status: Status.INSTRUMENTAL;
    }
  | {
      status: Status.EMPTY;
    };
