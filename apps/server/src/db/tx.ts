import type { Db } from './client.js'

export type DbTx = Parameters<Parameters<Db['transaction']>[0]>[0]
