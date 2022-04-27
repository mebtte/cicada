import React from 'react';
import { useTransition } from 'react-spring';

import Drawer from '@/components/drawer';
import useData from './use_data';
import ErrorDisplay from './error_display';
import Skeleton from './skeleton';
import User from './user';
import {
  MUSICBILL_COVER_SIZE,
  MUSICBILL_SPACE,
  MUSICBILL_COUNT_OF_ONE_LINE,
} from './constants';

const bodyProps = {
  style: {
    width:
      MUSICBILL_COVER_SIZE * MUSICBILL_COUNT_OF_ONE_LINE +
      MUSICBILL_SPACE * (MUSICBILL_COUNT_OF_ONE_LINE + 1),
  },
};

const UserDrawer = ({
  open,
  onClose,
  id,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
}) => {
  const { data, reload } = useData({ id });
  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
      {transitions((style, { error, loading, user }) => {
        if (error) {
          return <ErrorDisplay error={error} reload={reload} style={style} />;
        }
        if (loading) {
          return <Skeleton style={style} />;
        }
        return <User user={user} style={style} onCloseDrawer={onClose} />;
      })}
    </Drawer>
  );
};

export default UserDrawer;
