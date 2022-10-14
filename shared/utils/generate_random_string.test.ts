import generateRandomString, { SIGNS } from './generate_random_string';

test('specify length', () => {
  // default length
  expect(generateRandomString().length).toBe(10);

  const length = 20;
  expect(generateRandomString(length).length).toBe(length);
});

test('no sign', () => {
  for (const sign of SIGNS) {
    expect(generateRandomString(10, false)).not.toContain(sign);
  }
});
