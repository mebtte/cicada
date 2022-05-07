/* eslint-disable camelcase */
import api from '.';

/**
 * CMS 获取邮件通知列表
 * @author mebtte<hi@mebtte.com>
 */
function cmsGetEmailNotificationList({
  toUserId,
  page = 1,
  pageSize = 20,
}: {
  toUserId?: string;
  page?: number;
  pageSize?: number;
}) {
  return api.get<{
    total: number;
    list: {
      id: number;
      to_user_id: string;
      send_user: { id: string; nickname: string };
      title: string;
      html: string;
      create_time: string;
      send_time?: string;
      send_attempt_times: number;
    }[];
  }>('/api/cms/get_email_notification_list', {
    withToken: true,
    params: {
      to_user_id: toUserId,
      page,
      page_size: pageSize,
    },
  });
}

export default cmsGetEmailNotificationList;
