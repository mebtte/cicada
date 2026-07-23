import { CSSProperties } from 'react';
import { Select, SelectOption, SelectProps } from '@/components';
import { useSetting } from '@/global_states/setting';
import { LANGUAGE_MAP, t } from '@/i18n';
import dialog from '@/utils/dialog';
import { getOrderedLanguages, Language } from '@/constants/language';

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
  const options: SelectOption<Language>[] = getOrderedLanguages(language).map(
    (optionLanguage) => ({
      label: LANGUAGE_MAP[optionLanguage].label,
      value: optionLanguage,
    }),
  );

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
