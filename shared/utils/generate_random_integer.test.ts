import generateRandomInteger from './generate_random_integer';

test('should be a integer', () => {
  expect(Number.isInteger(generateRandomInteger())).toBe(true);
});

test('between min and max but not max', () => {
  const min = 0;
  const max = 10;
  const n = generateRandomInteger(min, max);
  expect(n).toBeGreaterThanOrEqual(min);
  expect(n).toBeLessThan(max);
});

test('min should be less than max', () => {
  const call = () => generateRandomInteger(1, 0);
  expect(call).toThrow();
});
