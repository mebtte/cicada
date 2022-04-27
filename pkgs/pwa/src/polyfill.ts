if (!window.requestIdleCallback) {
  window.requestIdleCallback = (
    callback: (deadline: {
      didTimeout: boolean;
      timeRemaining: () => number;
    }) => void,
  ) =>
    window.setTimeout(
      () =>
        callback({
          didTimeout: true,
          timeRemaining: () => 0,
        }),
      0,
    );
}
