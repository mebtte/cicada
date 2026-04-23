import { CSSProperties } from 'react';
import { Select, SelectOption, SelectProps } from '@/components_next';
import { useSetting } from '@/global_states/setting';
import { LANGUAGE_MAP, t } from '@/i18n';
import dialog from '@/utils/dialog';
import { LANGUAGES, Language } from '#/constants';

const options: SelectOption<Language>[] = LANGUAGES.map((language) => ({
  label: LANGUAGE_MAP[language].label,
  value: language,
}));

function reloadAfterLanguageChange(language: Language) {
  useSetting.setState({ language });
  window.setTimeout(() => window.location.reload(), 0);
}

interface Props {
  className?: string;
  confirmBeforeReload?: boolean;
  disabled?: boolean;
  label?: string;
  size?: SelectProps<Language>['size'];
  style?: CSSProperties;
}

function LanguageSelect({
  className,
  confirmBeforeReload = false,
  disabled = false,
  label,
  size,
  style,
}: Props) {
  const { language } = useSetting();

  return (
    <Select<Language>
      className={className}
      disabled={disabled}
      label={label}
      options={options}
      size={size}
      style={style}
      value={language}
      onChange={(value) => {
        if (value === language) return;

        if (confirmBeforeReload) {
          dialog.confirm({
            content: t('change_language_question'),
            onConfirm: () => reloadAfterLanguageChange(value),
          });
          return;
        }

        reloadAfterLanguageChange(value);
      }}
    />
  );
}

export default LanguageSelect;
