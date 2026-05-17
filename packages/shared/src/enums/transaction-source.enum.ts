export const TransactionSource = {
  WEB: 'WEB',
  LINE: 'LINE',
} as const;

export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource];
