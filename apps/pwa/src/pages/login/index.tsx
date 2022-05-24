import notice from '@/platform/notice';
import { useEffect } from 'react';

function Login() {
  useEffect(() => {
    notice.default(
      '很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长',
    );
  }, []);

  return <div>login</div>;
}

export default Login;
