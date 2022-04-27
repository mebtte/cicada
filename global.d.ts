type ValueOf<T> = T[keyof T];

type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = T extends (
  ...args: any[]
) => infer P
  ? Awaited<P>
  : any;
