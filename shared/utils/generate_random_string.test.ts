import generateRandomString from './generate_random_string';

test('generate random string', () => {
  expect(generateRandomString(10).length).toBe(10);
});
