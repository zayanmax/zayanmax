"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/dashboard" />}>
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments[0] !== "dashboard"
          ? segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join("/")}`;
              const label = segment
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ");
              const isLast = index === segments.length - 1;

              return (
                <Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={href} />}>
                      {label}
                    </BreadcrumbLink>
                  )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })
          : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
