import { DebugSetting } from '@/constants/debug_setting';
import definition from '@/definition';
import storage, { Key } from '@/storage';
import parseSearch from '@/utils/parse_search';
import XState from '@/utils/x_state';

const query = parseSearch<'debug'>(window.location.search);
const enable = Boolean(definition.DEVELOPMENT || query.debug);
let initialDebugSetting: DebugSetting = {
  audioLogEnabled: false,
};
if (enable) {
  const debugSettingFromStorage = await storage.getItem(Key.DEBUG_SETTING);
  if (debugSettingFromStorage) {
    initialDebugSetting = debugSettingFromStorage;
  }
}

const debugSetting = new XState(initialDebugSetting);
debugSetting.onChange((ds) => storage.setItem(Key.DEBUG_SETTING, ds));

export { enable };
export default debugSetting;
