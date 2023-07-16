import { Key } from './constants';

const zhCN: {
  [key in Key]: string;
} = {
  cicada: '知了',
  cicada_description: '一个子托管的多用户音乐服务',
  incompatible_tips: '你的浏览器无法兼容知了, 因为缺少以下功能',
  server_origin: '服务器源地址',
  wrong_server_origin: '错误的服务器源地址',
  setting: '设置',
  confirm: '确认',
  cancel: '取消',
  language: '语言',
  continue: '继续',
  email: '邮箱',
  please_enter_valid_email: '请输入合法的邮箱',
  captcha: '验证码',
  get_login_code: '获取登录验证码',
  login_code_has_emailed: '登录验证码已经发送到邮箱',
};

export default zhCN;
