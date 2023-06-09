import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '@/utils/logger';
import { Option } from './constants';

function useDelayedKeyword(keyword: string) {
  const [delayedKeyword, setDelayedKeyword] = useState(keyword);

  useEffect(() => {
    const timer = window.setTimeout(() => setDelayedKeyword(keyword), 500);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  return delayedKeyword;
}

export default <Value>({
  keyword,
  optionsGetter,
}: {
  keyword: string;
  optionsGetter: (search: string) => Option<Value>[] | Promise<Option<Value>[]>;
}) => {
  const requestIdRef = useRef(0);

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option<Value>[]>([]);

  const delayedKeyword = useDelayedKeyword(keyword);
  useEffect(() => {
    setLoading(true);
  }, [keyword]);

  const getOptions = useCallback(async () => {
    const requestId = Math.random();
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    try {
      const os = await Promise.resolve(optionsGetter(delayedKeyword));

      if (requestId === requestIdRef.current) {
        setOptions(os);
      }
    } catch (e) {
      logger.error(e, 'Multiple select options fail to get');

      if (requestId === requestIdRef.current) {
        setError(e);
      }
    }

    if (requestId === requestIdRef.current) {
      setLoading(false);
    }
  }, [delayedKeyword, optionsGetter]);

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return { error, loading, options, reload: getOptions };
};
