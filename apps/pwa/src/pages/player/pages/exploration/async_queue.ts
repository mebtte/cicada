import AsyncQueue from '#/utils/async_queue';

export default new AsyncQueue({
  minimalTaskDuration: 100,
});
