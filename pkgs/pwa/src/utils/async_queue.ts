import getRandomString from './get_random_string';
import timeout from './timeout';
import sleep from './sleep';

interface Task {
  id: string;
  task: () => Promise<any>;
  resolve: (...params: any[]) => void;
  reject: (...params: any[]) => void;
}

class AsyncQueue {
  taskMinDuration: number;

  taskTimeout: number;

  taskInterval: number;

  abortErrorGenerator?: () => Error;

  timeoutErrorGenerator?: (ms: number) => Error;

  running: boolean;

  taskQueue: Task[];

  constructor({
    taskMinDuration = 0,
    taskTimeout = 0,
    taskInterval = 0,
    abortErrorGenerator,
    timeoutErrorGenerator,
  }: {
    taskMinDuration?: number;
    taskTimeout?: number;
    taskInterval?: number;
    abortErrorGenerator?: () => Error;
    timeoutErrorGenerator?: (ms: number) => Error;
  }) {
    this.taskMinDuration = taskMinDuration;
    this.taskTimeout = taskTimeout;
    this.taskInterval = taskInterval;
    this.abortErrorGenerator = abortErrorGenerator;
    this.timeoutErrorGenerator = timeoutErrorGenerator;

    this.running = false;
    this.taskQueue = [];
  }

  run<Result>(task: () => Promise<Result>) {
    const id = getRandomString();

    let abort: () => void;
    let finished = false;
    const promise = new Promise<Result>((resolve, reject) => {
      abort = () => {
        if (finished) {
          throw new Error(`The task is finished and can not be aborted.`);
        }
        this.taskQueue = this.taskQueue.filter((t) => t.id !== id);
        return reject(
          this.abortErrorGenerator
            ? this.abortErrorGenerator()
            : new Error('Task aborted.'),
        );
      };

      this.taskQueue.push({
        id,
        task,
        resolve,
        reject,
      });

      return this.nextTask<Result>();
    }).finally(() => {
      finished = true;
    });
    return { promise, finished: () => finished, abort };
  }

  async nextTask<Result>() {
    if (this.running || !this.taskQueue.length) {
      return;
    }

    this.running = true;

    const [{ task, resolve, reject }] = this.taskQueue.splice(0, 1);
    try {
      const [a] = await Promise.race([
        Promise.all([task(), sleep(this.taskMinDuration)]),
        timeout(this.taskTimeout, {
          errorGenerator: this.timeoutErrorGenerator,
        }),
      ]);
      resolve(a as Result);
    } catch (error) {
      reject(error);
    }
    this.running = false;

    setTimeout(this.nextTask.bind(this), this.taskInterval);
  }
}

export default AsyncQueue;
