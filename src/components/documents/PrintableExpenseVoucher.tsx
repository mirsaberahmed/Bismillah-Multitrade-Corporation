import React from 'react';
import { ExpenseRecord, CompanySettings } from '../../types';
import { PrintableExpenseSheet } from './PrintableExpenseSheet';

interface Props {
  expense: ExpenseRecord;
  settings: CompanySettings;
}

export const PrintableExpenseVoucher: React.FC<Props> = ({ expense, settings }) => {
  return <PrintableExpenseSheet expense={expense} settings={settings} />;
};
