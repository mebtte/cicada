export function getNextRadioQueueIndex({
  currentIndex,
  queueLength,
}: {
  currentIndex: number;
  queueLength: number;
}) {
  if (currentIndex < 0 || currentIndex + 1 >= queueLength) {
    return currentIndex;
  }
  return currentIndex + 1;
}
