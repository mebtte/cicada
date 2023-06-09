import { SyntheticEvent } from 'react';

function preventDefault(event: SyntheticEvent) {
  return event.preventDefault();
}

export default preventDefault;
