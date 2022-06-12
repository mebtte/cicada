import { request, Method } from '.';

function updateSelfMusicbillOrder(orders: string[]) {
  return request<void>({
    method: Method.POST,
    path: '/api/self_musicbill_order',
    body: {
      orders,
    },
    withToken: true,
  });
}

export default updateSelfMusicbillOrder;
