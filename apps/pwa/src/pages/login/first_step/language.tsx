import { LANGUAGES, Language } from '#/constants';
import Label from '@/components/label';
import { Select, Option } from '@/components/select';
import { useSetting } from '@/global_states/setting';
import { LANGUAGE_MAP, t } from '@/i18n';

const languageOptions: Option<Language>[] = LANGUAGES.map((l) => ({
  label: LANGUAGE_MAP[l].label,
  value: l,
  actualValue: l,
}));

function Wrapper({ disabled }: { disabled: boolean }) {
  const { language } = useSetting();
  return (
    <Label label={t('language')}>
      <Select<Language>
        value={{
          label: LANGUAGE_MAP[language].label,
          value: language,
          actualValue: language,
        }}
        onChange={(option) => {
          useSetting.setState({
            language: option.actualValue,
          });
          return window.setTimeout(() => window.location.reload(), 0);
        }}
        options={languageOptions}
        disabled={disabled}
      />
    </Label>
  );
}

export default Wrapper;
