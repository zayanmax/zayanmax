# Recruitment & Onboarding Module

## Scope

Backend-only recruitment and onboarding support has been implemented in `apps/backend/src/modules/recruitment-onboarding`.

Implemented:

- Job openings with status flow: draft, open, paused, closed, cancelled.
- Candidate profiles with source tracking.
- Duplicate candidate protection by company-scoped email or phone.
- Candidate pipeline stages.
- Candidate applications with status flow: applied, screening, interview, offered, hired, rejected, withdrawn.
- Interview round metadata.
- Interview feedback.
- Offer letter metadata only, including offer status flow.
- Onboarding checklists and checklist items.
- Candidate-to-employee conversion foundation through an explicit conversion endpoint.
- Search, filters, sorting, and pagination.
- Permission-key RBAC with `recruitment.view` and `recruitment.manage`.
- Audit logs for job, candidate, application, interview, offer, onboarding, and status-change actions.

Not implemented:

- Frontend screens.
- PDF offer letter generation.
- Email or notification sending.
- Calendar interview event integration.
- Automatic employee creation without calling the conversion endpoint.

## Data Model

Migration:

```text
apps/backend/prisma/migrations/20260613144836_recruitment_onboarding
```

Primary models:

- `JobOpening`
- `CandidateProfile`
- `CandidatePipelineStage`
- `CandidateApplication`
- `InterviewRound`
- `InterviewFeedback`
- `OfferLetter`
- `OnboardingChecklist`
- `OnboardingChecklistItem`

Primary enums:

- `JobOpeningStatus`
- `CandidateApplicationStatus`
- `OfferLetterStatus`

## Permissions

- `recruitment.view`: read recruitment records and lists.
- `recruitment.manage`: create records, change statuses, add feedback, create offers/checklists, and convert candidates.

## API Routes

All routes use `/api/v1`.

Job openings:

- `GET /recruitment/jobs`
- `POST /recruitment/jobs`
- `PATCH /recruitment/jobs/:id/status`

Candidates:

- `GET /recruitment/candidates`
- `POST /recruitment/candidates`

Pipeline stages:

- `GET /recruitment/pipeline-stages`
- `POST /recruitment/pipeline-stages`

Applications:

- `GET /recruitment/applications`
- `POST /recruitment/applications`
- `PATCH /recruitment/applications/:id/status`
- `POST /recruitment/applications/:id/convert-to-employee`

Interviews:

- `POST /recruitment/interviews`
- `POST /recruitment/interviews/:id/feedback`

Offers:

- `POST /recruitment/offers`
- `PATCH /recruitment/offers/:id/status`

Onboarding:

- `POST /recruitment/onboarding-checklists`
- `POST /recruitment/onboarding-checklists/:id/items`
- `PATCH /recruitment/onboarding-items/:id/complete`

## Validation

Latest focused checks during implementation:

- `npm test -- recruitment-onboarding.service.spec.ts --runInBand`: 1 suite, 3 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 14 tests passed.

Full required verification is tracked in `docs/status/current-status.md`.
