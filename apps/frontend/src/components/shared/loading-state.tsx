import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}
