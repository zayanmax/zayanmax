import { Prisma } from '@prisma/client';

type ModelField = {
  name?: string;
  kind?: string;
  type?: string;
  relationFromFields?: readonly string[];
};

type ModelDescriptor = {
  name: string;
  fields: readonly ModelField[];
};

type DeleteManyDelegate = {
  deleteMany(args: {
    where: {
      companyId: string;
      id?: { not: string };
    };
  }): Promise<{ count: number }>;
};

function delegateName(modelName: string) {
  return `${modelName[0].toLowerCase()}${modelName.slice(1)}`;
}

function companyModels(models: readonly ModelDescriptor[]) {
  return models.filter(
    (model) =>
      model.fields.some((field) => field.name === 'id') &&
      model.fields.some((field) => field.name === 'companyId'),
  );
}

function orderModelsForDeletion(
  modelNames: readonly string[],
  models: readonly ModelDescriptor[],
) {
  const selected = new Set(modelNames);
  const parentsByChild = new Map<string, Set<string>>();
  const incomingCount = new Map<string, number>();

  for (const name of selected) {
    parentsByChild.set(name, new Set());
    incomingCount.set(name, 0);
  }

  for (const model of models) {
    if (!selected.has(model.name)) continue;
    for (const field of model.fields) {
      const parent = field.type;
      if (
        field.kind !== 'object' ||
        !parent ||
        parent === model.name ||
        !selected.has(parent) ||
        !field.relationFromFields?.length
      ) {
        continue;
      }
      if (!parentsByChild.get(model.name)?.has(parent)) {
        parentsByChild.get(model.name)?.add(parent);
        incomingCount.set(parent, (incomingCount.get(parent) ?? 0) + 1);
      }
    }
  }

  const ready = [...selected]
    .filter((name) => incomingCount.get(name) === 0)
    .sort();
  const ordered: string[] = [];
  while (ready.length > 0) {
    const name = ready.shift()!;
    ordered.push(name);
    for (const parent of parentsByChild.get(name) ?? []) {
      const remaining = (incomingCount.get(parent) ?? 0) - 1;
      incomingCount.set(parent, remaining);
      if (remaining === 0) {
        ready.push(parent);
        ready.sort();
      }
    }
  }

  const unresolved = [...selected].filter((name) => !ordered.includes(name));
  if (unresolved.length > 0) {
    throw new Error(
      `Cannot safely order company cleanup for: ${unresolved.sort().join(', ')}.`,
    );
  }
  return ordered;
}

export function cleanupModelOrder(
  models: readonly ModelDescriptor[] = Prisma.dmmf.datamodel.models,
) {
  const descriptors = companyModels(models);
  const operationalModels = descriptors
    .map((model) => model.name)
    .filter((name) => name !== 'User' && name !== 'Role');
  return orderModelsForDeletion(operationalModels, descriptors);
}

export async function cleanupCompanyData(
  prisma: unknown,
  companyId: string,
  adminUserId: string,
  models: readonly ModelDescriptor[] = Prisma.dmmf.datamodel.models,
) {
  const client = prisma as Record<string, DeleteManyDelegate>;
  const counts: Record<string, number> = {};

  for (const model of cleanupModelOrder(models)) {
    const delegate = client[delegateName(model)];
    if (!delegate?.deleteMany) {
      throw new Error(`Prisma delegate for ${model} is unavailable.`);
    }
    const result = await delegate.deleteMany({ where: { companyId } });
    counts[model] = result.count;
  }

  const users = await client.user.deleteMany({
    where: { companyId, id: { not: adminUserId } },
  });
  counts.User = users.count;
  return counts;
}
