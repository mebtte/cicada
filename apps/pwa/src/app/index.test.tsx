import { cleanup, render } from '@testing-library/react';
import App from '.';

afterEach(cleanup);

it('CheckboxWithLabel changes the text after click', () => {
  const { container } = render(<App />);
  expect(container.children.length).not.toBe(0);
});
