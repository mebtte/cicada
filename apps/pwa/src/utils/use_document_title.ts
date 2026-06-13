import { useEffect } from 'react';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';

// 统一格式: `{pageName} - {Cicada}`; 不传 pageName 则只显示 `Cicada`.
// pageName 需是已本地化的字符串(例如 t('login')), 内部仅做 capitalize 与拼接.
function useDocumentTitle(pageName?: string) {
  const appName = capitalize(t('cicada'));
  const title = pageName ? `${capitalize(pageName)} - ${appName}` : appName;

  useEffect(() => {
    const originalTitle = document.title;
    return () => {
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    document.title = title;
  }, [title]);
}

export default useDocumentTitle;
