import nodemailer from 'nodemailer';
import config from '@/config';
import { BRAND_NAME } from '#/constants';

let transporter: nodemailer.Transporter;
const getTransporter = () => {
  if (!transporter) {
    const c = config.get();
    transporter = nodemailer.createTransport({
      host: c.emailHost,
      port: c.emailPort,
      auth: {
        user: c.emailUser,
        pass: c.emailPass,
      },
    });
  }
  return transporter;
};

/**
 * 发送邮件
 * @author mebtte<hi@mebtte.com>
 */
export function sendEmail({
  to,
  title,
  html,
}: {
  to: string;
  title: string;
  html: string;
}) {
  return new Promise((resolve, reject) => {
    getTransporter().sendMail(
      {
        from: `${BRAND_NAME} <${config.get().emailUser}>`,
        to,
        subject: title,
        html,
      },
      (error, info) => {
        if (error) {
          return reject(error);
        }
        return resolve(info);
      },
    );
  });
}
