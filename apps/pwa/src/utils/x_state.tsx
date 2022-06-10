import { useState, useEffect, ComponentType } from 'react';
import Eventemitter from '#/utils/eventemitter';

enum EventType {
  UPDATED = 'updated',
}

class XState<State> extends Eventemitter<
  EventType,
  {
    [EventType.UPDATED]: State;
  }
> {
  private state: State;

  constructor(initialState: State) {
    super();
    this.state = initialState;
  }

  get() {
    return this.state;
  }

  set(state: State) {
    this.state = state;
    super.emit(EventType.UPDATED, state);
  }

  onChange(listener: (state: State) => void) {
    super.on(EventType.UPDATED, listener);
    return () => super.off(EventType.UPDATED, listener);
  }

  useState() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [state, setState] = useState(this.state);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const unsubscribe = this.onChange((s) => setState(s));
      return unsubscribe;
    }, []);

    return state;
  }

  withState<
    PropName extends string,
    Props extends { [key in PropName]: State },
  >(propName: PropName, Component: ComponentType<Props>) {
    const self = this;
    return function ComponentWithXState(props: Omit<Props, PropName>) {
      const state = self.useState();
      return (
        // @ts-expect-error
        <Component
          {...{
            ...props,
            [propName]: state,
          }}
        />
      );
    };
  }
}

export default XState;
