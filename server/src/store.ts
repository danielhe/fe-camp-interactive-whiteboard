import { Cache } from './utils/in-memory-cache'

export const users = Cache.create('users');
export const rooms = Cache.create('rooms');