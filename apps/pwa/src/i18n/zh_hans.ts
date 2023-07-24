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
  change_language_question: '更换语言将会重新加载应用, 是否继续?',
  relative_volume: '相对音量',
  music_play_record_short: '播放记录',
  my_music: '我的音乐',
  exploration: '发现',
  musicbill: '乐单',
  user_management: '用户管理',
  logout: '退出登录',
  logout_question: '确定退出登录吗?',
  search: '搜索',
  shared_musicbill_invitation: '共享乐单邀请',
  public_musicbill_collection: '收藏的公开乐单',
  previous_step: '上一步',
  login_code: '登录验证码',
  please_enter_login_code: '请输入登录验证码',
  welcome_back: '欢迎回来',
};

export default zhCN;
