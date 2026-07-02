# Performance, Goals & Appraisals Module

Last updated: 2026-06-13

## Scope

Implemented backend-only Performance, Goals & Appraisals foundation.

Included:

- Performance cycles.
- Employee goals.
- Goal status flow: `DRAFT`, `ACTIVE`, `COMPLETED`, `CANCELLED`.
- Goal progress updates.
- KPI categories.
- Employee KPI records.
- Review templates.
- Review template questions.
- Employee reviews.
- Review status flow: `DRAFT`, `SELF_REVIEW`, `MANAGER_REVIEW`, `HR_REVIEW`, `COMPLETED`, `CANCELLED`.
- Review responses.
- Feedback records.
- 1-on-1 meeting notes metadata only.
- Promotion/recommendation metadata.
- Search, filters, sorting, and pagination.
- Employee performance summary endpoint.
- Manager team performance endpoint.
- Audit logs for goal/review/feedback/status changes and primary create actions.

Excluded for now:

- Frontend screens.
- Payroll appraisal increments.
- Calendar meeting creation.
- Notification sending.
- Automated appraisal workflows.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `PerformanceCycle`
- `EmployeeGoal`
- `GoalProgressUpdate`
- `KpiCategory`
- `EmployeeKpiRecord`
- `ReviewTemplate`
- `ReviewTemplateQuestion`
- `EmployeeReview`
- `ReviewResponse`
- `FeedbackRecord`
- `OneOnOneMeetingNote`
- `PromotionRecommendation`

Added enums:

- `PerformanceCycleStatus`
- `EmployeeGoalStatus`
- `EmployeeReviewStatus`

Migration:

```text
apps/backend/prisma/migrations/20260613141926_performance_appraisals
```

Seed updates:

- `performance.view`
- `performance.manage`

## Permissions

Performance routes use:

- `performance.view`
- `performance.manage`

No role names are hardcoded for access checks.

## Endpoints

Cycle routes:

- `GET /api/v1/performance/cycles`
- `POST /api/v1/performance/cycles`

Goal routes:

- `GET /api/v1/performance/goals`
- `POST /api/v1/performance/goals`
- `POST /api/v1/performance/goals/:id/progress`
- `PATCH /api/v1/performance/goals/:id/status`

KPI routes:

- `POST /api/v1/performance/kpi-categories`
- `POST /api/v1/performance/kpis`

Review routes:

- `GET /api/v1/performance/review-templates`
- `POST /api/v1/performance/review-templates`
- `GET /api/v1/performance/reviews`
- `POST /api/v1/performance/reviews`
- `PATCH /api/v1/performance/reviews/:id/status`
- `POST /api/v1/performance/reviews/:id/responses`

Feedback and metadata routes:

- `POST /api/v1/performance/feedback`
- `POST /api/v1/performance/one-on-ones`
- `POST /api/v1/performance/promotion-recommendations`

Summary routes:

- `GET /api/v1/performance/employees/:employeeId/summary`
- `GET /api/v1/performance/managers/:managerEmployeeId/team-summary`

## Filters

Cycle lists support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

Goal lists support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `cycleId`
- `employeeId`

Review template lists support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

Review lists support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `cycleId`
- `employeeId`
- `managerEmployeeId`

## Audit Logging

Audit actions:

- `performance.cycles.create`
- `performance.goals.create`
- `performance.goals.progress`
- `performance.goals.status`
- `performance.kpis.categories.create`
- `performance.kpis.create`
- `performance.review_templates.create`
- `performance.reviews.create`
- `performance.reviews.status`
- `performance.reviews.response`
- `performance.feedback.create`

## Tests

Unit tests:

```text
apps/backend/src/modules/performance-appraisals/performance-appraisals.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

Covered flows include performance cycle creation and duplicate protection, goal creation/progress/status changes, KPI category and employee KPI records, review templates/questions, employee reviews, review responses, feedback, one-on-one note metadata, promotion recommendation metadata, employee performance summary, and manager team performance summary.
