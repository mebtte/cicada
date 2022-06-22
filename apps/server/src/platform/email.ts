import nodemailer from 'nodemailer';
import argv from '@/argv';
import { BRAND_NAME } from '#/constants';

const transporter = nodemailer.createTransport({
  host: argv.emailHost,
  port: argv.emailPort,
  auth: {
    user: argv.emailUser,
    pass: argv.emailPass,
  },
});

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
    transporter.sendMail(
      {
        from: `${BRAND_NAME} <${argv.emailUser}>`,
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
