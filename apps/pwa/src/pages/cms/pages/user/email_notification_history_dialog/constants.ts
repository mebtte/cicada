import cmsGetEmailNotificationList from '@/server/cms_get_email_notification_list';

export type EmailNotification = AsyncReturnType<
  typeof cmsGetEmailNotificationList
>['list'][0];

export const PAGE_SIZE = 20;
