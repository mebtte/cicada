import { CommonQuery } from '@/constants';
import { getClientLanguage } from '@/constants/language';
import { useSetting } from '@/global_states/setting';

export default function getCommonParams() {
  return {
    [CommonQuery.CLIENT_LANGUAGE]: getClientLanguage(
      useSetting.getState().language,
    ),
  };
}
