import LanguageSelect from '@/features/language/language_select';
import { t } from '@/i18n';

function Wrapper({ disabled }: { disabled: boolean }) {
  return (
    <LanguageSelect
      label={t('language')}
      disabled={disabled}
      confirmBeforeReload={false}
    />
  );
}

export default Wrapper;
