const keyboardHandlerWrapper =
  <T extends (...params: any[]) => void>(handler: T) =>
  (...params: Parameters<T>) => {
    const { activeElement } = document;
    if (
      !activeElement ||
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA'
    ) {
      return;
    }
    return void handler(...params);
  };

export default keyboardHandlerWrapper;
