import db from '@/db';

export enum Property {
  ID = 'id',
  AVATAR = 'avatar',
  NAME = 'name',
  ALIASES = 'aliases',
  CREATE_USER_ID = 'createUserId',
  CREATE_TIMESTAMP = 'createTimestamp',
}

export type Singer = {
  [Property.ID]: string;
  [Property.AVATAR]: string;
  [Property.NAME]: string;
  [Property.ALIASES]: string;
  [Property.CREATE_USER_ID]: string;
  [Property.CREATE_TIMESTAMP]: number;
};

export function getSingerListInMusicIds<P extends Property>(
  musicIds: string[],
  properties: P[],
) {
  return db.all<
    {
      musicId: string;
    } & Pick<Singer, P>
  >(
    `
    SELECT
      ${properties.map((p) => `c.${p}`).join(',')},
      msr.musicId
    FROM
      music_singer_relation AS msr
      LEFT JOIN singer AS c ON msr.singerId = c.id 
    WHERE
      msr.musicId IN ( ${musicIds.map(() => '?').join(',')} );
  `,
    musicIds,
  );
}

export function getSingerListByIds<P extends Property>(
  ids: string[],
  properties: P[],
) {
  return db.all<Pick<Singer, P>>(
    `
      select ${properties.join(',')} from singer
        where id in ( ${ids.map(() => '?')} )
    `,
    ids,
  );
}

export function getSingerById<P extends Property>(id: string, properties: P[]) {
  return db.get<Pick<Singer, P>>(
    `
      select ${properties.join(',')} from singer
        where id = ?
    `,
    [id],
  );
}

export function updateSinger<
  P extends Property.ALIASES | Property.AVATAR | Property.NAME,
>({ id, property, value }: { id: string; property: P; value: Singer[P] }) {
  return db.run(
    `
      update singer set ${property} = ? where id = ?
    `,
    [value, id],
  );
}
