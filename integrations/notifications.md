# Notification System

## Channels

- In-app
- Email
- WhatsApp
- SMS
- Push notification

## Notification Events

```text
employee.created
leave.requested
leave.approved
leave.rejected
approval.pending
approval.approved
approval.rejected
task.assigned
task.due_soon
invoice.created
invoice.overdue
payment.received
helpdesk.ticket_created
helpdesk.ticket_assigned
document.expiring
birthday.today
work_anniversary.today
```

## Notification Table

Fields:
- id
- companyId
- userId
- title
- message
- type
- channel
- entityType
- entityId
- readAt
- createdAt

## Queue Usage

Use queues for:
- Email sending
- WhatsApp sending
- SMS sending
- Push notification sending
- Scheduled reminders
- Document expiry alerts
- Invoice overdue reminders

## Notification Preferences

Users should be able to control some notifications, but critical notifications should not be disabled.

## Template Example

```text
Title: Leave request approved
Message: Your casual leave request from {{fromDate}} to {{toDate}} has been approved.
```
