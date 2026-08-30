"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { ErrorState } from "@/components/shared/error-state";
import { PermissionGuard } from "@/components/shared/permission-guard";
import {
  demoModuleConfigs,
  type DemoModuleKey,
  type DemoRecord,
} from "@/features/demo-completion/module-config";

type DemoModulePageProps = {
  module: DemoModuleKey;
};

const DEMO_STORAGE_PREFIX = "zayanmax.demo.";

type DemoRowsUpdater = DemoRecord[] | ((current: DemoRecord[]) => DemoRecord[]);

function createDemoRowsStore(storageKey: string, initialRows: DemoRecord[]) {
  let rows = initialRows;
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return rows;
    },
    getServerSnapshot() {
      return initialRows;
    },
    initialize() {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as unknown;
          if (Array.isArray(parsed)) {
            rows = parsed as DemoRecord[];
            notify();
          }
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    },
    update(updater: DemoRowsUpdater) {
      rows = typeof updater === "function" ? updater(rows) : updater;
      window.localStorage.setItem(storageKey, JSON.stringify(rows));
      notify();
    },
  };
}

function humanizeStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClasses(status: string) {
  const normalized = status.toUpperCase();

  if (
    [
      "ACTIVE",
      "APPROVED",
      "COMPLETED",
      "PAID",
      "PRESENT",
      "RESOLVED",
      "CLOSED",
      "HIRED",
      "SUCCESS",
    ].includes(normalized)
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    [
      "PENDING",
      "PROCESSING",
      "IN_PROGRESS",
      "LATE",
      "INTERVIEW",
      "MANAGER_REVIEW",
      "HR_REVIEW",
      "SELF_REVIEW",
      "WAITING_FOR_EMPLOYEE",
      "OFFERED",
      "SCREENING",
      "INVITED",
    ].includes(normalized)
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (
    [
      "REJECTED",
      "FAILED",
      "DENIED",
      "ABSENT",
      "CANCELLED",
      "SUSPENDED",
    ].includes(normalized)
  ) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now()}`;
}

export function DemoModulePage({ module }: DemoModulePageProps) {
  const config = demoModuleConfigs[module];
  const storageKey = `${DEMO_STORAGE_PREFIX}${module}`;
  const rowsStore = useMemo(
    () => createDemoRowsStore(storageKey, config.initialRows),
    [config.initialRows, storageKey],
  );
  const rows = useSyncExternalStore(
    rowsStore.subscribe,
    rowsStore.getSnapshot,
    rowsStore.getServerSnapshot,
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({
    status: config.statusOptions[0],
  });

  useEffect(() => {
    rowsStore.initialize();
  }, [rowsStore]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "ALL" || row.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesQuery;
    });
  }, [query, rows, statusFilter]);

  function statValue(status?: string, fixedValue?: string) {
    if (fixedValue) {
      return fixedValue;
    }

    if (status) {
      return rows.filter((row) => row.status === status).length.toString();
    }

    return rows.length.toString();
  }

  function resetDraft() {
    const nextDraft: Record<string, string> = {
      status: config.statusOptions[0],
    };

    for (const field of config.fields) {
      nextDraft[field.key] = "";
    }

    setDraft(nextDraft);
    setFormError("");
  }

  function openCreate() {
    resetDraft();
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
    setFormError("");
  }

  function submitRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const primaryField = config.fields[0];

    if (!primaryField || !draft[primaryField.key]?.trim()) {
      setFormError(
        primaryField
          ? `${primaryField.label} is required.`
          : "Complete the form.",
      );
      return;
    }

    const nextRecord: DemoRecord = {
      id: createId(module.slice(0, 3).toUpperCase()),
      status: draft.status || config.statusOptions[0],
    };

    for (const field of config.fields) {
      nextRecord[field.key] = draft[field.key]?.trim() || "—";
    }

    rowsStore.update((current) => [nextRecord, ...current]);
    setShowCreate(false);
    setNotice(`${config.singular} added to the presenter dataset.`);
  }

  function moveToNextStatus(id: string) {
    rowsStore.update((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const currentIndex = config.statusOptions.indexOf(row.status);
        if (
          currentIndex < 0 ||
          currentIndex === config.statusOptions.length - 1
        ) {
          return row;
        }

        return {
          ...row,
          status: config.statusOptions[currentIndex + 1],
        };
      }),
    );
    setNotice("Workflow status advanced.");
  }

  function removeRecord(id: string) {
    rowsStore.update((current) => current.filter((row) => row.id !== id));
    setNotice("Record removed from the presenter dataset.");
  }

  function resetData() {
    rowsStore.update(config.initialRows);
    setQuery("");
    setStatusFilter("ALL");
    setNotice("Presenter dataset restored.");
  }

  function exportCsv() {
    const headers = [
      "ID",
      ...config.fields.map((field) => field.label),
      "Status",
    ];

    const data = filteredRows.map((row) => [
      row.id,
      ...config.fields.map((field) => row[field.key] ?? ""),
      humanizeStatus(row.status),
    ]);

    const csv = [headers, ...data]
      .map((line) => line.map((cell) => csvCell(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `zayanmax-${module}-demo.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice("CSV exported.");
  }

  return (
    <PermissionGuard
      permission={config.permission}
      fallback={
        <ErrorState
          title="Permission required"
          message={`You do not have access to ${config.title.toLowerCase()}.`}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-l-4 border-l-primary px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Demo-ready workspace
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                    <Database className="size-3.5" aria-hidden="true" />
                    Presenter dataset
                  </span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {config.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {config.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetData}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition hover:bg-muted"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Reset data
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition hover:bg-muted"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Export CSV
                </button>
                {!config.disableCreate ? (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {config.createLabel ?? `New ${config.singular}`}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {config.stats.map((stat, index) => (
            <article
              key={stat.label}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {statValue(stat.status, stat.value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.helper}
                  </p>
                </div>
                <span
                  className={[
                    "flex size-9 items-center justify-center rounded-lg border",
                    index === 0
                      ? "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                      : index === 1
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : index === 2
                          ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
                  ].join(" ")}
                >
                  {index === 0 ? (
                    <Database className="size-4" aria-hidden="true" />
                  ) : index === 1 ? (
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  ) : index === 2 ? (
                    <Clock3 className="size-4" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-4" aria-hidden="true" />
                  )}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold">Operational records</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {filteredRows.length} of {rows.length} records displayed
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 sm:w-72">
                  <span className="sr-only">Search {config.title}</span>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    value={query}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setQuery(event.target.value)
                    }
                    placeholder={`Search ${config.title.toLowerCase()}...`}
                    className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="relative sm:w-52">
                  <span className="sr-only">Filter by status</span>
                  <SlidersHorizontal
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      setStatusFilter(event.target.value)
                    }
                    className="h-10 w-full appearance-none rounded-md border bg-background pl-9 pr-8 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ALL">All statuses</option>
                    {config.statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {humanizeStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    {config.fields.map((field) => (
                      <th key={field.key} className="px-4 py-3 font-medium">
                        {field.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRows.map((row) => {
                    const statusIndex = config.statusOptions.indexOf(
                      row.status,
                    );
                    const canAdvance =
                      statusIndex >= 0 &&
                      statusIndex < config.statusOptions.length - 1;

                    return (
                      <tr key={row.id} className="transition hover:bg-muted/25">
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {row.id}
                        </td>
                        {config.fields.map((field, fieldIndex) => (
                          <td
                            key={field.key}
                            className={[
                              "px-4 py-3",
                              fieldIndex === 0
                                ? "max-w-72 font-medium"
                                : "whitespace-nowrap text-muted-foreground",
                            ].join(" ")}
                          >
                            {row[field.key] ?? "—"}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                              statusClasses(row.status),
                            ].join(" ")}
                          >
                            {humanizeStatus(row.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={!canAdvance}
                              onClick={() => moveToNextStatus(row.id)}
                              className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                              title={
                                canAdvance
                                  ? `Move to ${humanizeStatus(
                                      config.statusOptions[statusIndex + 1],
                                    )}`
                                  : "Workflow complete"
                              }
                            >
                              Next
                              <ArrowRight
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRecord(row.id)}
                              className="inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${row.id}`}
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!filteredRows.length ? (
              <div className="flex min-h-52 flex-col items-center justify-center px-6 py-12 text-center">
                <Search
                  className="size-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="mt-3 font-medium">No matching records</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change the search or status filter, or restore the presenter
                  dataset.
                </p>
              </div>
            ) : null}
          </div>

          <aside className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Workflow</h2>
                <p className="text-xs text-muted-foreground">
                  How this module operates
                </p>
              </div>
            </div>

            <ol className="mt-5 space-y-5">
              {config.workflow.map((step, index) => (
                <li key={step.title} className="relative pl-10">
                  {index < config.workflow.length - 1 ? (
                    <span
                      className="absolute left-[15px] top-8 h-[calc(100%+4px)] w-px bg-border"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full border bg-background text-xs font-semibold">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-medium">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">Demo behavior</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Add, search, filter, advance, delete, reset, and CSV export work
                in the browser. Records persist on this device for the
                presentation.
              </p>
            </div>
          </aside>
        </section>

        {showCreate ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${module}-dialog-title`}
              className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border bg-background shadow-2xl sm:max-w-2xl sm:rounded-2xl"
            >
              <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background/95 px-5 py-4 backdrop-blur">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Presenter dataset
                  </p>
                  <h2
                    id={`${module}-dialog-title`}
                    className="mt-1 text-lg font-semibold"
                  >
                    Add {config.singular}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeCreate}
                  className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Close form"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </header>

              <form onSubmit={submitRecord} className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {config.fields.map((field, index) => (
                    <label
                      key={field.key}
                      className={index === 0 ? "sm:col-span-2" : ""}
                    >
                      <span className="mb-1.5 block text-sm font-medium">
                        {field.label}
                      </span>
                      <input
                        autoFocus={index === 0}
                        type={field.inputType ?? "text"}
                        value={draft[field.key] ?? ""}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setDraft((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  ))}

                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium">
                      Status
                    </span>
                    <select
                      value={draft.status ?? config.statusOptions[0]}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                        setDraft((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {config.statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {humanizeStatus(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {formError ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add to demo
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {notice ? (
          <div
            className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-xl"
            role="status"
          >
            <CheckCircle2
              className="size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span>{notice}</span>
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
