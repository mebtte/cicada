import { useEffect, useRef, useState } from 'react';
import { Option } from './constants';

export default <Value>({
  keyword,
  dataGetter,
  onGetDataError,
}: {
  keyword: string;
  dataGetter: (search: string) => Option<Value>[] | Promise<Option<Value>[]>;
  onGetDataError: (error: Error) => void;
}) => {
  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option<Value>[]>([]);

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
