import { CSSProperties } from 'react';
import ErrorCard from '../components/error_card';
import { t } from '@/i18n';

const style: CSSProperties = {
  position: 'absolute',
  inset: 0,
};

function UncaughtError({ error }: { error: Error }) {
  return (
    <ErrorCard
      errorMessage={t('unknown_error', error.message)}
      retry={() => window.location.reload()}
      style={style}
    />
  );
}

export default UncaughtError;
