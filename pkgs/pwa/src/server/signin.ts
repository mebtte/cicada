/* eslint-disable camelcase */
import api from '.';

/**
 * 登录
 * @author mebtte<hi@mebtte.com>
 */
async function signin({
  email,
  verifyCode,
}: {
  email: string;
  verifyCode: string;
}) {
  const { token, token_expired_at: tokenExpiredAt } = await api.post<{
    token: string;
    token_expired_at: string;
  }>('/api/signin', {
    data: { email, verify_code: verifyCode },
  });
  return {
    token,
    tokenExpiredAt,
  };
}

export default signin;
