/* eslint-disable @typescript-eslint/no-explicit-any */
import generateRandomString from './generate_random_string';
import sleep from './sleep';
import timeout from './timeout';

interface Task {
  id: string;
  task: () => Promise<any>;
  resolve: (...params: any[]) => void;
  reject: (...params: any[]) => void;
}

class AsyncQueue {
  minimalTaskDuration: number;

  taskTimeout: number;

  taskTimeoutErrorGenerator?: (ms: number) => Error;

  running: boolean;

  taskQueue: Task[];

  constructor({
    minimalTaskDuration = 500,
    taskTimeout = 10 * 1000,
    taskTimeoutErrorGenerator,
  }: {
    minimalTaskDuration?: number;
    taskTimeout?: number;
    taskTimeoutErrorGenerator?: (ms: number) => Error;
  }) {
    this.minimalTaskDuration = minimalTaskDuration;
    this.taskTimeout = taskTimeout;
    this.taskTimeoutErrorGenerator = taskTimeoutErrorGenerator;

    this.running = false;
    this.taskQueue = [];
  }

  run<Result>(task: () => Promise<Result>) {
    const id = generateRandomString();
    return new Promise<Result>((resolve, reject) => {
      this.taskQueue.push({
        id,
        task,
        resolve,
        reject,
      });
      return this.nextTask<Result>();
    });
  }

  clear() {
    this.taskQueue = [];
  }

  private async nextTask<Result>() {
    if (this.running || !this.taskQueue.length) {
      return;
    }

    this.running = true;

    const [{ task, resolve, reject }] = this.taskQueue.splice(0, 1);
    try {
      const [result] = await Promise.race([
        Promise.all([task(), sleep(this.minimalTaskDuration)]),
        timeout(this.taskTimeout, this.taskTimeoutErrorGenerator),
      ]);
      resolve(result as Result);
    } catch (error) {
      reject(error);
    }

    this.running = false;

    globalThis.setTimeout(this.nextTask.bind(this), 0);
  }
}

export default AsyncQueue;
