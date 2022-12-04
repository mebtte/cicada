export enum Status {
  LOADING,
  SUCCESS,
  ERROR,
  INSTRUMENT,
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
      status: Status.INSTRUMENT;
    }
  | {
      status: Status.EMPTY;
    };
