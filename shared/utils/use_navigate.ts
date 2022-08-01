import {
  useLocation,
  useNavigate as useOriginalNavigate,
} from 'react-router-dom';
import parseSearch from '../../apps/pwa/src/utils/parse_search';
import useEvent from './use_event';

function useNavigate() {
  const location = useLocation();
  const originalNavigate = useOriginalNavigate();
  const navigate = useEvent(
    ({
      path = location.pathname,
      query = {},
      replace = false,
    }: {
      path?: string;
      query?: {
        [key: string]: number | string | undefined;
      };
      replace?: boolean;
    }) => {
      const combineQuery = {
        ...parseSearch(location.search),
        ...query,
      };
      return originalNavigate(
        `${path}?${Object.keys(combineQuery)
          .map((key) => `${key}=${combineQuery[key]}`)
          .join('&')}`,
        { replace },
      );
    },
  );
  return navigate;
}

export default useNavigate;