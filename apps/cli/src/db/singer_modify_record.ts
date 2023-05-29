import { AllowUpdateKey } from '#/constants/singer';
import { getDB } from '.';

export function saveSingerModifyRecord({
  singerId,
  key,
  modifyUserId,
}: {
  singerId: string;
  key: AllowUpdateKey;
  modifyUserId: string;
}) {
  return getDB().run(
    `
      insert into singer_modify_record(singerId, key, modifyUserId, modifyTimestamp)
        values( ?, ?, ?, ? )
    `,
    [singerId, key, modifyUserId, Date.now()],
  );
}
