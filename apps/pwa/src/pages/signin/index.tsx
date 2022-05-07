import { Redirect, useLocation } from 'react-router-dom';

import u from '@/platform/user';
import { ROOT_PATH } from '@/constants/route';
import parseSearch from '@/utils/parse_search';
import Signin from './signin';

function Wrapper() {
  const user = u.useUser();
  const location = useLocation();
  if (user) {
    return (
      <Redirect
        to={decodeURIComponent(
          decodeURIComponent(
            parseSearch<'redirect'>(location.search).redirect || '',
          ) || ROOT_PATH.HOME,
        )}
      />
    );
  }
  return <Signin />;
}

export default Wrapper
