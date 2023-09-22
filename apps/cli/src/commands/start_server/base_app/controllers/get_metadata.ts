import os from 'os';
import definition from '@/definition';
import { Response } from '#/server/base/get_metadata';
import { getServerId } from '@/platform/server_id';
import { Context } from '../constants';

const hostname = os.hostname();

export default async (ctx: Context) =>
  ctx.success<Response>({
    id: getServerId(),
    hostname,
    version: definition.VERSION,
  });
