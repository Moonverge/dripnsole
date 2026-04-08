export type ListingCondition = 'BNWT' | 'BNWOT' | 'VNDS' | '9/10' | '8/10' | '7/10' | 'Thrifted'

const toDb: Record<ListingCondition, string> = {
  BNWT: 'BNWT',
  BNWOT: 'BNWOT',
  VNDS: 'VNDS',
  '9/10': '9_10',
  '8/10': '8_10',
  '7/10': '7_10',
  Thrifted: 'Thrifted',
}

const fromDb: Record<string, ListingCondition> = {
  BNWT: 'BNWT',
  BNWOT: 'BNWOT',
  VNDS: 'VNDS',
  '9_10': '9/10',
  '8_10': '8/10',
  '7_10': '7/10',
  Thrifted: 'Thrifted',
}

export function conditionToDb(c: ListingCondition): string {
  return toDb[c]
}

export function conditionFromDb(c: string): ListingCondition {
  const v = fromDb[c]
  if (!v) return 'Thrifted'
  return v
}
