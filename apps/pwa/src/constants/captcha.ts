/**
 * 图形验证码有效期
 * 前端有效期要比后端有效期短 10 秒
 * 减少接口处理时验证码已经过期的概率
 * @author mebtte<i@mebtte.com>
 */
export const CAPTCHA_TTL = 1000 * 60 * 2;
export const CAPTCHA_TTL_FRONTEND = CAPTCHA_TTL - 100 * 10;
