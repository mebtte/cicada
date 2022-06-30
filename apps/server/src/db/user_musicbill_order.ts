import db from '.';

export enum Property {
  USER_ID = 'userId',
  ORDERS_JSON = 'ordersJSON',
}

export type Music = {
  [Property.USER_ID]: string;
  [Property.ORDERS_JSON]: string;
};

export function deleteUserMusicbillOrder(userId: string) {
  return db.run(
    `
      delete from user_musicbill_order
        where userId = ?
    `,
    [userId],
  );
}

export async function getUserMusicbillOrders(
  userId: string,
): Promise<string[]> {
  const userMusicbillOrder = await db.get<{
    ordersJSON: string;
  }>(
    `
      select ordersJSON from user_musicbill_order
        where userId = ?
    `,
    [userId],
  );
  if (!userMusicbillOrder) {
    return [];
  }

  try {
    const orders: string[] = JSON.parse(userMusicbillOrder.ordersJSON);
    if (orders instanceof Array) {
      return orders;
    }
    throw new Error();
  } catch {
    await deleteUserMusicbillOrder(userId);
    return [];
  }
}

export function updateUserMusicbillOrders(userId: string, orders: string[]) {
  return db.run(
    `
      insert or replace into user_musicbill_order(userId, ordersJSON)
        values(?, ?);
    `,
    [userId, JSON.stringify(orders)],
  );
}
