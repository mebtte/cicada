import { useEffect, useRef, useState } from 'react';
import { Item } from './constants';

export default <ID extends number | string>({
  keyword,
  dataGetter,
  onGetDataError,
}: {
  keyword: string;
  dataGetter: (search: string) => Item<ID>[] | Promise<Item<ID>[]>;
  onGetDataError: (error: Error) => void;
}) => {
  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Item<ID>[]>([]);

  useEffect(() => {
    const requestId = Math.random();
    requestIdRef.current = requestId;

    setLoading(true);
    const timer = window.setTimeout(
      () =>
        Promise.resolve(dataGetter(keyword))
          .then((data) => {
            if (requestId === requestIdRef.current) {
              setOptions(data);
            }
          })
          .catch((error) => {
            if (requestId === requestIdRef.current) {
              onGetDataError(error);
            }
          })
          .finally(() => {
            if (requestId === requestIdRef.current) {
              setLoading(false);
            }
          }),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [dataGetter, keyword, onGetDataError]);

  return { options, loading };
};
