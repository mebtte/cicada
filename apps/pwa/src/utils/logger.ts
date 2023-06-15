/* eslint-disable no-console */
function error(e: Error, description: string) {
  console.group(description);
  console.error(e);
  console.groupEnd();
}

export default {
  error,
};
