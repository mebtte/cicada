import {
  useLocation,
  useNavigate as useOriginalNavigate,
} from 'react-router-dom';
import parseSearch from '@/utils/parse_search';
import useEvent from './use_event';

type QueryValue = number | string | null | undefined;

function useNavigate() {
  const location = useLocation();
  const originalNavigate = useOriginalNavigate();
  const navigate = useEvent(
    ({
      path = location.pathname,
      query = {},
      replace = false,
      state,
    }: {
      path?: string;
      query?: Record<string, QueryValue>;
      replace?: boolean;
      state?: unknown;
    }) => {
      const combineQuery = {
        ...parseSearch(location.search),
        ...query,
      };
      const search = Object.keys(combineQuery)
        .filter((key) => {
          const value = combineQuery[key];
          return value !== undefined && value !== null && value !== '';
        })
        .map((key) => `${key}=${combineQuery[key]}`)
        .join('&');
      const target = `${path}${search ? `?${search}` : ''}`;

      if (target === `${location.pathname}${location.search}`) {
        return;
      }
      return originalNavigate(target, { replace, state });
    },
  );
  return navigate;
}

export default useNavigate;
