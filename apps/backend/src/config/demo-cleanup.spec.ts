import { cleanupCompanyData, cleanupModelOrder } from './demo-cleanup';

describe('cleanupCompanyData', () => {
  it('can safely order every company-scoped model in the real schema', () => {
    const order = cleanupModelOrder();
    expect(order).toContain('Task');
    expect(order).toContain('Project');
    expect(order.indexOf('Task')).toBeLessThan(order.indexOf('Project'));
    expect(order).not.toContain('User');
    expect(order).not.toContain('Role');
  });

  it('deletes child records first and preserves the administrator and roles', async () => {
    const calls: string[] = [];
    const taskDelete = jest.fn().mockImplementation(async () => {
      calls.push('Task');
      return { count: 3 };
    });
    const projectDelete = jest.fn().mockImplementation(async () => {
      calls.push('Project');
      return { count: 2 };
    });
    const userDelete = jest.fn().mockImplementation(async () => {
      calls.push('User');
      return { count: 1 };
    });
    const roleDelete = jest.fn();

    const counts = await cleanupCompanyData(
      {
        task: { deleteMany: taskDelete },
        project: { deleteMany: projectDelete },
        user: { deleteMany: userDelete },
        role: { deleteMany: roleDelete },
      },
      'company-id',
      'admin-id',
      [
        {
          name: 'Project',
          fields: [{ name: 'id' }, { name: 'companyId' }],
        },
        {
          name: 'Task',
          fields: [
            { name: 'id' },
            { name: 'companyId' },
            {
              kind: 'object',
              type: 'Project',
              relationFromFields: ['projectId'],
            },
          ],
        },
        {
          name: 'User',
          fields: [{ name: 'id' }, { name: 'companyId' }],
        },
        {
          name: 'Role',
          fields: [{ name: 'id' }, { name: 'companyId' }],
        },
      ],
    );

    expect(calls).toEqual(['Task', 'Project', 'User']);
    expect(taskDelete).toHaveBeenCalledWith({
      where: { companyId: 'company-id' },
    });
    expect(projectDelete).toHaveBeenCalledWith({
      where: { companyId: 'company-id' },
    });
    expect(userDelete).toHaveBeenCalledWith({
      where: { companyId: 'company-id', id: { not: 'admin-id' } },
    });
    expect(roleDelete).not.toHaveBeenCalled();
    expect(counts).toEqual({ Task: 3, Project: 2, User: 1 });
  });
});
