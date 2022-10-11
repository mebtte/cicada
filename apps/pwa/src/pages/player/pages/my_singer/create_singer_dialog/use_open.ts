import { useCallback } from 'react';
import useQuery from '@/utils/use_query';
import { Query } from '@/constants';
import useNavigate from '#/utils/use_navigate';

export default () => {
  const navigate = useNavigate();

  const query = useQuery<Query.CREATE_SINGER_DIALOG_OPEN>();
  const onClose = useCallback(
    () =>
      navigate({
        query: {
          [Query.CREATE_SINGER_DIALOG_OPEN]: undefined,
        },
      }),
    [navigate],
  );

  return { open: !!query[Query.CREATE_SINGER_DIALOG_OPEN], onClose };
};
