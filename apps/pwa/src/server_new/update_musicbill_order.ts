import { request, Method } from '.';

function updateMusicbillOrder(orders: string[]) {
  return request<void>({
    method: Method.POST,
    path: '/api/musicbill_order',
    body: {
      orders,
    },
    withToken: true,
  });
}

export default updateMusicbillOrder;
