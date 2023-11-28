import { cleanup, render } from '@testing-library/react';
import Label from '.';

afterEach(cleanup);

test('component label', () => {
  const { container } = render(<Label label="标签" />);
  expect(container.children.length).toBe(1);
});
