import { memo } from 'react';
import Switch from '@/components/switch';
import { useUser } from '@/global_states/server';
import { useSetting } from '@/global_states/setting';
import { t } from '@/i18n';
import Item from './item';
import { itemStyle } from './constants';

function AdminQuickEdit() {
  const user = useUser();
  const checked = useSetting((s) => s.adminQuickEdit);

  // 非管理员不展示该项
  if (!user?.admin) {
    return null;
  }

  return (
    <Item label={t('admin_quick_edit')} style={itemStyle}>
      <Switch
        checked={checked}
        aria-label={t('admin_quick_edit')}
        onCheckedChange={(nextChecked) =>
          useSetting.setState({ adminQuickEdit: nextChecked })
        }
      />
    </Item>
  );
}

export default memo(AdminQuickEdit);
