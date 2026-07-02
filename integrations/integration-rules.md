# Integration Rules

## General Rules

1. Keep third-party integrations isolated under `src/integrations`.
2. Business modules should not call third-party SDKs directly.
3. Use provider interfaces so providers can be replaced later.
4. Queue all non-critical external calls using BullMQ.
5. Log all integration failures.
6. Never store provider secrets in code.

## Integration Folder Pattern

```text
integrations/
├── email/
│   ├── email.module.ts
│   ├── email.service.ts
│   ├── providers/
│   │   ├── smtp.provider.ts
│   │   └── sendgrid.provider.ts
│   └── interfaces/email-provider.interface.ts
├── whatsapp/
├── sms/
├── storage/
├── biometric/
└── calendar/
```

## Provider Interface Example

```ts
export interface EmailProvider {
  sendMail(input: SendMailInput): Promise<void>;
}
```

## Storage Rules

- Store files in S3-compatible storage.
- Store only metadata in PostgreSQL.
- Use signed URLs for private files.
- Never expose raw storage keys publicly.

## WhatsApp Rules

Use WhatsApp only for important alerts:
- Approval pending
- Payment reminder
- Attendance exception
- Leave decision
- Helpdesk escalation

Do not use WhatsApp for every small notification.

## Biometric Rules

Biometric integration should feed attendance records through a sync job.

Flow:

```text
Biometric Device/API
→ Sync Job
→ Raw Attendance Logs
→ Attendance Processor
→ Attendance Records
```

Keep raw biometric logs unchanged for audit.

## Calendar Integration

Support Google Calendar later for:
- Meeting sync
- Event creation
- Interview scheduling
- Leave calendar sync

## Failure Handling

All integrations should return normalized errors:

```json
{
  "provider": "whatsapp",
  "code": "PROVIDER_TIMEOUT",
  "message": "WhatsApp provider did not respond"
}
```
