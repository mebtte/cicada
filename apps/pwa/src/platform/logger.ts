/* eslint-disable no-console */
import ErrorWithCode from '@/utils/error_with_code';

function error(
  e: Error | ErrorWithCode<number>,
  { description = e.message } = {},
) {
  console.group(description);
  console.error(e);
  console.groupEnd();
}

export default {
  error,
};
