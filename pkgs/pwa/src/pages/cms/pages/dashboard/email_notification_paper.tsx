import React from 'react';

import { CMS_PATH } from '@/constants/route';
import useHistory from '@/utils/use_history';
import { Name as IconName } from '@/components/icon';
import Paper from './paper';
import { Query } from '../user/constants';

const style = {
  cursor: 'pointer',
};

const EmailNotificationPaper = ({ total }: { total: number }) => {
  const history = useHistory();
  const onClick = () =>
    history.push({
      pathname: CMS_PATH.USER,
      query: { [Query.EMAIL_NOTIFICATION_HISTORY_DIALOG_OPEN]: '1' },
    });

  return (
    <Paper
      onClick={onClick}
      icon={IconName.EMAIL_LIST_FILL}
      label="邮件通知次数"
      value={total.toString()}
      style={style}
    />
  );
};

export default EmailNotificationPaper;
