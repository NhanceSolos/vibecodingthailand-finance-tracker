export const TransactionSource = {
  WEB: 'WEB',
  LINE: 'LINE',
  RECURRING: 'RECURRING',
} as const;

export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource];
