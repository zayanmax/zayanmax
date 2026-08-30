import { resolveDemoSeedTarget } from './demo-seed-target';

describe('resolveDemoSeedTarget', () => {
  it('uses the administrator company instead of a hard-coded development tenant', async () => {
    const findUser = jest.fn().mockResolvedValue({
      id: 'admin-id',
      companyId: 'production-company-id',
      email: 'admin@zayan.test',
    });
    const findCompany = jest.fn().mockResolvedValue({
      id: 'production-company-id',
      name: 'ZayanMax Production',
    });

    const target = await resolveDemoSeedTarget(
      {
        user: { findUnique: findUser },
        company: { findUnique: findCompany },
      },
      'admin@zayan.test',
    );

    expect(findCompany).toHaveBeenCalledWith({
      where: { id: 'production-company-id' },
    });
    expect(target).toEqual({
      admin: {
        id: 'admin-id',
        companyId: 'production-company-id',
        email: 'admin@zayan.test',
      },
      company: {
        id: 'production-company-id',
        name: 'ZayanMax Production',
      },
    });
  });

  it('fails when the administrator does not exist', async () => {
    await expect(
      resolveDemoSeedTarget(
        {
          user: { findUnique: jest.fn().mockResolvedValue(null) },
          company: { findUnique: jest.fn() },
        },
        'missing@zayan.test',
      ),
    ).rejects.toThrow('Demo administrator missing@zayan.test was not found');
  });
});
