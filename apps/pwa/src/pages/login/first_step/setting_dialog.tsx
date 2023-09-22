import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import Button, { Variant } from '@/components/button';
import Input from '@/components/input';
import Label from '@/components/label';
import Select, { Option } from '@/components/select';
import s from '@/global_states/setting';
import { useState } from 'react';
import useEvent from '@/utils/use_event';
import { URL } from '#/constants/regexp';
import notice from '@/utils/notice';
import { LANGUAGE_MAP, t } from '@/i18n';
import { Language } from '#/constants';
import styled from 'styled-components';

const LANGUAGES = Object.values(Language);
const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const languageOptions: Option<Language>[] = LANGUAGES.map((l) => ({
  key: l,
  label: LANGUAGE_MAP[l].label,
  value: l,
}));

function SettingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const setting = s.useState();
  const [serverOrigin, setServerOrigin] = useState(setting.serverOrigin || '');
  const [language, setLanguage] = useState(setting.language);

  const onSave = useEvent(() => {
    if (serverOrigin.length && !URL.test(serverOrigin)) {
      return notice.error(t('wrong_server_origin'));
    }
    s.set((prev) => ({ ...prev, serverOrigin, language }));
    onClose();

    if (language !== setting.language) {
      window.setTimeout(() => window.location.reload(), 0);
    }
  });

  return (
    <Dialog open={open}>
      <Container>
        <Title>{t('setting')}</Title>
        <StyledContent>
          <Label label={t('language')}>
            <Select<Language>
              value={{
                label: LANGUAGE_MAP[language].label,
                value: language,
              }}
              onChange={(option) => setLanguage(option.value)}
              options={languageOptions}
              menuPortalTarget={document.body}
            />
          </Label>
          <Input
            label={t('server_origin')}
            inputProps={{
              value: serverOrigin,
              onChange: (event) => setServerOrigin(event.target.value),
              placeholder: window.location.origin,
            }}
          />
        </StyledContent>
        <Action>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <Button variant={Variant.PRIMARY} onClick={onSave}>
            {t('confirm')}
          </Button>
        </Action>
      </Container>
    </Dialog>
  );
}

export default SettingDialog;
