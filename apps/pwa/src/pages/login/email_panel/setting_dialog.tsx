import Dialog, { Container, Title, Content, Action } from '@/components/dialog';
import Button, { Variant } from '@/components/button';
import Input from '@/components/input';
import Select from '@/components/select';
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
          <Select<Language>
            label={t('language')}
            value={{
              key: language,
              label: LANGUAGE_MAP[language].label,
              value: language,
            }}
            onChange={(v) => setLanguage(v.value)}
            data={LANGUAGES.map((l) => ({
              key: l,
              label: LANGUAGE_MAP[l].label,
              value: l,
            }))}
          />
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
