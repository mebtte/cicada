/* eslint-disable no-console */

function error(e: Error, description = e.message) {
  console.group(description);
  console.error(e);
  console.groupEnd();
}

export default {
  error,
};
