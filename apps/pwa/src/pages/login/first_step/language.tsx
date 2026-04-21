import { LANGUAGES, Language } from '#/constants';
import { Select, SelectOption } from '@/components_next';
import { useSetting } from '@/global_states/setting';
import { LANGUAGE_MAP, t } from '@/i18n';

const languageOptions: SelectOption<Language>[] = LANGUAGES.map((l) => ({
  label: LANGUAGE_MAP[l].label,
  value: l,
}));

function Wrapper({ disabled }: { disabled: boolean }) {
  const { language } = useSetting();
  return (
    <Select<Language>
      label={t('language')}
      value={language}
      onChange={(value) => {
        useSetting.setState({ language: value });
        return window.setTimeout(() => window.location.reload(), 0);
      }}
      options={languageOptions}
      disabled={disabled}
    />
  );
}

export default Wrapper;
