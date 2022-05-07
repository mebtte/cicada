import api from '.';

/**
 * CMS 发送邮件通知
 * @author mebtte<hi@mebtte.com>
 */
function cmsSendEmailNotification({
  toUserId,
  title,
  html,
}: {
  toUserId: string;
  title: string;
  html: string;
}) {
  return api.post('/api/cms/send_email_notification', {
    withToken: true,
    data: {
      to_user_id: toUserId,
      title,
      html,
    },
  });
}

export default cmsSendEmailNotification;
