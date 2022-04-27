const keyboardHandlerWrapper =
  <T extends (...params: any[]) => void>(handler: T) =>
  (...params: Parameters<T>) => {
    const { tagName } = document.activeElement;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
      return;
    }
    return void handler(...params);
  };

export default keyboardHandlerWrapper;
