import { ROOT_PATH } from '@/constants/route';
import useNavigate from '@/utils/use_navigate';
import { useEffect } from 'react';

function RedirectLater() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(
      () => navigate({ path: ROOT_PATH.PLAYER }),
      5000,
    );
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return null;
}

export default RedirectLater;
