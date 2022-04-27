import api from '.';

/**
 * CMS 创建邮件通知
 * @author mebtte<hi@mbette.com>
 */
function cmsCreateEmailNotification({
  all,
  toUserIdList,
  title,
  html,
}: {
  all: boolean;
  toUserIdList: string[];
  title: string;
  html: string;
}) {
  return api.post('/api/cms/create_email_notification', {
    withToken: true,
    data: { to_user_ids: all ? 'all' : toUserIdList.join(','), title, html },
  });
}

export default cmsCreateEmailNotification;
