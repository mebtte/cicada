import nodemailer from 'nodemailer';
import { getConfig } from '@/config';
import { BRAND_NAME } from '#/constants';

let transporter: nodemailer.Transporter;
const getTransporter = () => {
  if (!transporter) {
    const config = getConfig();
    transporter = nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPort,
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
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
    const config = getConfig();
    getTransporter().sendMail(
      {
        from: `${BRAND_NAME} <${config.emailUser}>`,
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
