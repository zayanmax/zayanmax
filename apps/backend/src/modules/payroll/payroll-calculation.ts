import { Prisma } from '@prisma/client';

export type PayrollDecimalInput = Prisma.Decimal | number | string;

export type PayrollComponentValue = {
  calculationType: 'FIXED' | 'PERCENTAGE';
  amount: PayrollDecimalInput;
};

export function roundMoney(value: PayrollDecimalInput) {
  return new Prisma.Decimal(value).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}

export function componentFullAmount(
  monthlyGross: PayrollDecimalInput,
  component: PayrollComponentValue,
) {
  const configuredValue = new Prisma.Decimal(component.amount);
  if (component.calculationType === 'PERCENTAGE') {
    return roundMoney(
      new Prisma.Decimal(monthlyGross).times(configuredValue).dividedBy(100),
    );
  }
  return roundMoney(configuredValue);
}

export function prorateMoney(
  value: PayrollDecimalInput,
  payableDays: PayrollDecimalInput,
  workingDays: PayrollDecimalInput,
) {
  const denominator = new Prisma.Decimal(workingDays);
  if (denominator.isZero()) return roundMoney(0);
  return roundMoney(
    new Prisma.Decimal(value)
      .times(new Prisma.Decimal(payableDays))
      .dividedBy(denominator),
  );
}

export function sumMoney(values: PayrollDecimalInput[]) {
  return roundMoney(
    values.reduce<Prisma.Decimal>(
      (total, value) => total.plus(value),
      new Prisma.Decimal(0),
    ),
  );
}
