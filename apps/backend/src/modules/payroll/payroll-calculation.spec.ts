import {
  componentFullAmount,
  prorateMoney,
  roundMoney,
  sumMoney,
} from './payroll-calculation';

describe('payroll calculation', () => {
  it('keeps a fixed earning as a monetary amount', () => {
    expect(
      componentFullAmount(50000, {
        calculationType: 'FIXED',
        amount: 1250,
      }).toFixed(2),
    ).toBe('1250.00');
  });

  it('calculates a percentage earning from monthly gross', () => {
    expect(
      componentFullAmount(50000, {
        calculationType: 'PERCENTAGE',
        amount: 10,
      }).toFixed(2),
    ).toBe('5000.00');
  });

  it('uses the same percentage base for deductions', () => {
    expect(
      componentFullAmount('72500.00', {
        calculationType: 'PERCENTAGE',
        amount: '2.5',
      }).toFixed(2),
    ).toBe('1812.50');
  });

  it('rounds fractional percentage results half-up to two decimals', () => {
    expect(
      componentFullAmount('33333.33', {
        calculationType: 'PERCENTAGE',
        amount: '7.25',
      }).toFixed(2),
    ).toBe('2416.67');
  });

  it('prorates money using payable and working days', () => {
    expect(prorateMoney(50000, '20.5', 30).toFixed(2)).toBe('34166.67');
  });

  it('returns zero when a period has no working days', () => {
    expect(prorateMoney(50000, 5, 0).toFixed(2)).toBe('0.00');
  });

  it('rounds direct and aggregate monetary values consistently', () => {
    expect(roundMoney('10.005').toFixed(2)).toBe('10.01');
    expect(sumMoney(['10.005', '20.004']).toFixed(2)).toBe('30.01');
  });
});
