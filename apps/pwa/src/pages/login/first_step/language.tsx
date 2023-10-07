import { LANGUAGES, Language } from '#/constants';
import Label from '@/components/label';
import Select, { Option } from '@/components/select';
import setting from '@/global_states/setting';
import { LANGUAGE_MAP, t } from '@/i18n';

const languageOptions: Option<Language>[] = LANGUAGES.map((l) => ({
  key: l,
  label: LANGUAGE_MAP[l].label,
  value: l,
}));

function Wrapper({ disabled }: { disabled: boolean }) {
  const { language } = setting.useState();
  return (
    <Label label={t('language')}>
      <Select<Language>
        value={{
          label: LANGUAGE_MAP[language].label,
          value: language,
        }}
        onChange={(option) => {
          setting.set((s) => ({
            ...s,
            language: option.value,
          }));
          return window.setTimeout(() => window.location.reload(), 0);
        }}
        options={languageOptions}
        disabled={disabled}
      />
    </Label>
  );
}

export default Wrapper;
