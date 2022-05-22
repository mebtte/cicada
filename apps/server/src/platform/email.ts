import nodemailer from 'nodemailer';
import argv from '@/argv';

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
export function sendMail({
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
        from: `知了 <${argv.emailUser}>`,
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
