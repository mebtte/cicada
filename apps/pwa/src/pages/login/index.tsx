import notice from '@/platform/notice';
import { useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function Login() {
  useEffect(() => {
    notice.error(
      '很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长',
    );
  }, []);

  return (
    <div>
      <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success">
          很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Login;
