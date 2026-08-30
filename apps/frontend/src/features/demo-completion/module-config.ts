export type DemoModuleKey =
  | "leave"
  | "payroll"
  | "performance"
  | "recruitment"
  | "helpdesk"
  | "approvals"
  | "reports"
  | "company"
  | "users"
  | "roles"
  | "permissions"
  | "audit-logs";

export type DemoField = {
  key: string;
  label: string;
  placeholder?: string;
  inputType?: "text" | "email" | "date" | "number";
};

export type DemoRecord = {
  id: string;
  status: string;
} & Record<string, string>;

export type DemoStat = {
  label: string;
  helper: string;
  status?: string;
  value?: string;
};

export type DemoModuleConfig = {
  key: DemoModuleKey;
  title: string;
  description: string;
  singular: string;
  permission: string;
  statusOptions: string[];
  fields: DemoField[];
  initialRows: DemoRecord[];
  stats: DemoStat[];
  workflow: Array<{
    title: string;
    description: string;
  }>;
  createLabel?: string;
  disableCreate?: boolean;
};

function record(id: string, status: string, values: Record<string, string>): DemoRecord {
  return { id, status, ...values };
}

export const demoModuleConfigs: Record<DemoModuleKey, DemoModuleConfig> = {
  leave: {
    key: "leave",
    title: "Leave Management",
    description:
      "Manage leave balances, employee requests, multi-step review, holidays, approvals, rejections, and cancellations.",
    singular: "leave request",
    permission: "leaves.view",
    statusOptions: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
    fields: [
      { key: "employee", label: "Employee", placeholder: "Employee name" },
      { key: "type", label: "Leave type", placeholder: "Casual leave" },
      { key: "from", label: "From", inputType: "date" },
      { key: "to", label: "To", inputType: "date" },
      { key: "days", label: "Days", placeholder: "2" },
      { key: "reason", label: "Reason", placeholder: "Reason for leave" },
    ],
    initialRows: [
      record("lev-001", "PENDING", {
        employee: "Meera Reddy",
        type: "Casual Leave",
        from: "2026-08-31",
        to: "2026-09-01",
        days: "2",
        reason: "Family function",
      }),
      record("lev-002", "APPROVED", {
        employee: "Rahul Verma",
        type: "Sick Leave",
        from: "2026-08-27",
        to: "2026-08-27",
        days: "1",
        reason: "Medical rest",
      }),
      record("lev-003", "APPROVED", {
        employee: "Sana Khan",
        type: "Work From Home",
        from: "2026-08-29",
        to: "2026-08-29",
        days: "1",
        reason: "Client handoff",
      }),
      record("lev-004", "REJECTED", {
        employee: "Vikram Rao",
        type: "Earned Leave",
        from: "2026-09-03",
        to: "2026-09-07",
        days: "5",
        reason: "Travel",
      }),
    ],
    stats: [
      { label: "Requests", helper: "Current view" },
      { label: "Pending", helper: "Awaiting action", status: "PENDING" },
      { label: "Approved", helper: "Current period", status: "APPROVED" },
      { label: "Team availability", helper: "Next 7 days", value: "88%" },
    ],
    workflow: [
      { title: "Request", description: "Employees submit dates, leave type, and reason against their available balance." },
      { title: "Approve", description: "Managers or HR approve, reject, cancel, or request a correction." },
      { title: "Synchronize", description: "Approved leave is reflected in attendance, calendar, payroll, and reports." },
    ],
  },
  payroll: {
    key: "payroll",
    title: "Payroll",
    description:
      "Prepare payroll periods, salary assignments, deductions, advances, employee line items, approvals, and payslip metadata.",
    singular: "payroll item",
    permission: "payroll.view",
    statusOptions: ["DRAFT", "PROCESSING", "APPROVED", "PAID"],
    fields: [
      { key: "employee", label: "Employee", placeholder: "Employee name" },
      { key: "period", label: "Pay period", placeholder: "August 2026" },
      { key: "gross", label: "Gross pay", placeholder: "₹75,000" },
      { key: "deductions", label: "Deductions", placeholder: "₹4,500" },
      { key: "net", label: "Net pay", placeholder: "₹70,500" },
    ],
    initialRows: [
      record("pay-001", "APPROVED", {
        employee: "Aarav Sharma",
        period: "August 2026",
        gross: "₹92,000",
        deductions: "₹7,400",
        net: "₹84,600",
      }),
      record("pay-002", "PAID", {
        employee: "Meera Reddy",
        period: "August 2026",
        gross: "₹78,000",
        deductions: "₹5,250",
        net: "₹72,750",
      }),
      record("pay-003", "PROCESSING", {
        employee: "Rahul Verma",
        period: "August 2026",
        gross: "₹70,000",
        deductions: "₹4,800",
        net: "₹65,200",
      }),
      record("pay-004", "DRAFT", {
        employee: "Sana Khan",
        period: "August 2026",
        gross: "₹68,000",
        deductions: "₹3,950",
        net: "₹64,050",
      }),
    ],
    stats: [
      { label: "Employees", helper: "In this run" },
      { label: "Approved", helper: "Ready to pay", status: "APPROVED" },
      { label: "Paid", helper: "Completed", status: "PAID" },
      { label: "Net payroll", helper: "August 2026", value: "₹18.4L" },
    ],
    workflow: [
      { title: "Calculate", description: "Combine assigned salary components, attendance, leave, advances, and deductions." },
      { title: "Review", description: "Finance and HR validate exceptions before approving the payroll run." },
      { title: "Pay", description: "Mark payments and publish payslip metadata; generated PDFs remain a later integration." },
    ],
  },
  performance: {
    key: "performance",
    title: "Performance",
    description:
      "Run appraisal cycles, define goals and KPIs, collect reviews and feedback, and record recommendations.",
    singular: "performance review",
    permission: "performance.view",
    statusOptions: ["DRAFT", "SELF_REVIEW", "MANAGER_REVIEW", "HR_REVIEW", "COMPLETED"],
    fields: [
      { key: "employee", label: "Employee", placeholder: "Employee name" },
      { key: "cycle", label: "Review cycle", placeholder: "H2 2026" },
      { key: "goals", label: "Goals", placeholder: "4 / 5 completed" },
      { key: "rating", label: "Rating", placeholder: "4.4 / 5" },
      { key: "manager", label: "Manager", placeholder: "Manager name" },
    ],
    initialRows: [
      record("per-001", "COMPLETED", {
        employee: "Aarav Sharma",
        cycle: "H1 2026",
        goals: "5 / 5",
        rating: "4.7 / 5",
        manager: "Priya Menon",
      }),
      record("per-002", "MANAGER_REVIEW", {
        employee: "Meera Reddy",
        cycle: "H2 2026",
        goals: "4 / 5",
        rating: "4.3 / 5",
        manager: "Arjun Patel",
      }),
      record("per-003", "SELF_REVIEW", {
        employee: "Rahul Verma",
        cycle: "H2 2026",
        goals: "3 / 4",
        rating: "Pending",
        manager: "Priya Menon",
      }),
      record("per-004", "HR_REVIEW", {
        employee: "Sana Khan",
        cycle: "H2 2026",
        goals: "5 / 5",
        rating: "4.6 / 5",
        manager: "Arjun Patel",
      }),
    ],
    stats: [
      { label: "Reviews", helper: "Active cycle" },
      { label: "Manager review", helper: "Needs action", status: "MANAGER_REVIEW" },
      { label: "Completed", helper: "Finalized", status: "COMPLETED" },
      { label: "Average rating", helper: "Completed reviews", value: "4.5 / 5" },
    ],
    workflow: [
      { title: "Set expectations", description: "Create a cycle, assign goals, and define KPI categories and targets." },
      { title: "Review", description: "Collect self, manager, HR, and structured template responses." },
      { title: "Act", description: "Complete the appraisal and record feedback, one-on-ones, or promotion recommendations." },
    ],
  },
  recruitment: {
    key: "recruitment",
    title: "Recruitment",
    description:
      "Manage job openings, candidates, pipeline stages, interviews, offers, and employee onboarding checklists.",
    singular: "candidate",
    permission: "recruitment.view",
    statusOptions: ["APPLIED", "SCREENING", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"],
    fields: [
      { key: "candidate", label: "Candidate", placeholder: "Candidate name" },
      { key: "role", label: "Role", placeholder: "Role title" },
      { key: "stage", label: "Pipeline stage", placeholder: "Technical round" },
      { key: "interview", label: "Next interview", placeholder: "31 Aug · 11:30 AM" },
      { key: "owner", label: "Recruiter", placeholder: "Recruiter name" },
    ],
    initialRows: [
      record("rec-001", "INTERVIEW", {
        candidate: "Nisha Kapoor",
        role: "Product Designer",
        stage: "Portfolio review",
        interview: "31 Aug · 11:30 AM",
        owner: "Kavya Iyer",
      }),
      record("rec-002", "OFFERED", {
        candidate: "Rohit Jain",
        role: "Backend Engineer",
        stage: "Offer released",
        interview: "—",
        owner: "Kavya Iyer",
      }),
      record("rec-003", "SCREENING", {
        candidate: "Ananya Das",
        role: "Finance Executive",
        stage: "HR screening",
        interview: "01 Sep · 03:00 PM",
        owner: "Suresh Kumar",
      }),
      record("rec-004", "HIRED", {
        candidate: "Dev Malhotra",
        role: "Sales Associate",
        stage: "Onboarding",
        interview: "Joining 07 Sep",
        owner: "Suresh Kumar",
      }),
    ],
    stats: [
      { label: "Candidates", helper: "Open pipeline" },
      { label: "Interviews", helper: "Scheduled", status: "INTERVIEW" },
      { label: "Offers", helper: "Awaiting response", status: "OFFERED" },
      { label: "Open positions", helper: "Across departments", value: "8" },
    ],
    workflow: [
      { title: "Source", description: "Create job openings and capture candidate profiles and applications." },
      { title: "Evaluate", description: "Move candidates through stages, interview rounds, and structured feedback." },
      { title: "Hire", description: "Release an offer and convert accepted candidates into onboarding checklists." },
    ],
  },
  helpdesk: {
    key: "helpdesk",
    title: "Helpdesk",
    description:
      "Centralize employee support requests, ownership, priorities, comments, internal notes, and resolution tracking.",
    singular: "ticket",
    permission: "helpdesk.view",
    statusOptions: ["OPEN", "IN_PROGRESS", "WAITING_FOR_EMPLOYEE", "RESOLVED", "CLOSED"],
    fields: [
      { key: "ticket", label: "Ticket", placeholder: "Issue summary" },
      { key: "requester", label: "Requester", placeholder: "Employee name" },
      { key: "category", label: "Category", placeholder: "IT Support" },
      { key: "priority", label: "Priority", placeholder: "High" },
      { key: "assignee", label: "Assignee", placeholder: "Support owner" },
    ],
    initialRows: [
      record("HD-1042", "OPEN", {
        ticket: "Laptop VPN disconnects repeatedly",
        requester: "Meera Reddy",
        category: "IT Support",
        priority: "High",
        assignee: "Ravi Teja",
      }),
      record("HD-1041", "IN_PROGRESS", {
        ticket: "Payslip tax deduction clarification",
        requester: "Rahul Verma",
        category: "Payroll",
        priority: "Medium",
        assignee: "Neha Singh",
      }),
      record("HD-1039", "WAITING_FOR_EMPLOYEE", {
        ticket: "Access to shared sales folder",
        requester: "Vikram Rao",
        category: "Access Request",
        priority: "Low",
        assignee: "Ravi Teja",
      }),
      record("HD-1037", "RESOLVED", {
        ticket: "Conference room display not working",
        requester: "Sana Khan",
        category: "Facilities",
        priority: "Urgent",
        assignee: "Arun Kumar",
      }),
      record("HD-1032", "CLOSED", {
        ticket: "Leave balance mismatch",
        requester: "Aarav Sharma",
        category: "HR",
        priority: "Medium",
        assignee: "Neha Singh",
      }),
    ],
    stats: [
      { label: "Tickets", helper: "Current queue" },
      { label: "Open", helper: "Unassigned or new", status: "OPEN" },
      { label: "In progress", helper: "Owned by team", status: "IN_PROGRESS" },
      { label: "SLA health", helper: "Within response target", value: "96%" },
    ],
    workflow: [
      { title: "Log", description: "Employees or admins create categorized tickets with priority and linked entities." },
      { title: "Resolve", description: "Support assigns ownership, adds comments or internal notes, and moves status." },
      { title: "Close", description: "Resolved issues are confirmed, closed, and retained for audit and reporting." },
    ],
  },
  approvals: {
    key: "approvals",
    title: "Approvals",
    description:
      "Review cross-module requests through ordered steps with approve, reject, delegate, comment, and history actions.",
    singular: "approval request",
    permission: "approvals.view",
    statusOptions: ["DRAFT", "PENDING", "APPROVED", "REJECTED", "CANCELLED"],
    fields: [
      { key: "request", label: "Request", placeholder: "Request title" },
      { key: "module", label: "Module", placeholder: "Expense" },
      { key: "requester", label: "Requester", placeholder: "Employee name" },
      { key: "details", label: "Amount / details", placeholder: "₹28,400" },
      { key: "step", label: "Current step", placeholder: "Finance review" },
    ],
    initialRows: [
      record("APR-2081", "PENDING", {
        request: "Client travel reimbursement",
        module: "Expense",
        requester: "Meera Reddy",
        details: "₹28,400",
        step: "Finance review",
      }),
      record("APR-2079", "PENDING", {
        request: "MacBook purchase request",
        module: "Purchase",
        requester: "Aarav Sharma",
        details: "₹1,48,000",
        step: "Department head",
      }),
      record("APR-2076", "APPROVED", {
        request: "Two-day casual leave",
        module: "Leave",
        requester: "Sana Khan",
        details: "29–30 Aug",
        step: "Completed",
      }),
      record("APR-2073", "REJECTED", {
        request: "Vendor advance payment",
        module: "Finance",
        requester: "Rahul Verma",
        details: "₹75,000",
        step: "Finance manager",
      }),
    ],
    stats: [
      { label: "Requests", helper: "Current queue" },
      { label: "Pending", helper: "Needs decision", status: "PENDING" },
      { label: "Approved", helper: "Current period", status: "APPROVED" },
      { label: "Average turnaround", helper: "Across workflows", value: "4h 18m" },
    ],
    workflow: [
      { title: "Submit", description: "A domain request enters a selected workflow definition and ordered approval steps." },
      { title: "Decide", description: "Authorized approvers approve, reject, delegate, or comment with an audit record." },
      { title: "Complete", description: "The final decision updates the request history and can drive its source module." },
    ],
  },
  reports: {
    key: "reports",
    title: "Reports & Exports",
    description:
      "Explore operational report definitions and demonstrate export request tracking across business modules.",
    singular: "report export",
    permission: "reports.view",
    statusOptions: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
    fields: [
      { key: "report", label: "Report", placeholder: "Report name" },
      { key: "category", label: "Category", placeholder: "Finance" },
      { key: "period", label: "Period", placeholder: "August 2026" },
      { key: "format", label: "Format", placeholder: "XLSX" },
      { key: "requestedBy", label: "Requested by", placeholder: "User name" },
    ],
    initialRows: [
      record("REP-3011", "COMPLETED", {
        report: "Monthly attendance summary",
        category: "HR",
        period: "August 2026",
        format: "XLSX",
        requestedBy: "Admin",
      }),
      record("REP-3010", "PROCESSING", {
        report: "Receivables aging",
        category: "Billing",
        period: "As of 29 Aug",
        format: "PDF",
        requestedBy: "Rahul Verma",
      }),
      record("REP-3008", "COMPLETED", {
        report: "Project utilization",
        category: "Projects",
        period: "Q3 2026",
        format: "CSV",
        requestedBy: "Aarav Sharma",
      }),
      record("REP-3005", "PENDING", {
        report: "Inventory valuation",
        category: "Inventory",
        period: "August 2026",
        format: "XLSX",
        requestedBy: "Vikram Rao",
      }),
    ],
    stats: [
      { label: "Exports", helper: "Current history" },
      { label: "Processing", helper: "In queue", status: "PROCESSING" },
      { label: "Completed", helper: "Available records", status: "COMPLETED" },
      { label: "Report families", helper: "Across the platform", value: "18" },
    ],
    workflow: [
      { title: "Choose", description: "Select a report family, filters, date range, and output format." },
      { title: "Request", description: "The backend records an export request and its processing status." },
      { title: "Generate later", description: "Real file rendering and secure downloads will be connected through a queue worker." },
    ],
  },
  company: {
    key: "company",
    title: "Company Settings",
    description:
      "Maintain the company identity, regional defaults, contact information, and operating configuration.",
    singular: "company profile",
    permission: "settings.manage",
    statusOptions: ["ACTIVE", "INACTIVE"],
    fields: [
      { key: "name", label: "Company", placeholder: "Company name" },
      { key: "legalName", label: "Legal name", placeholder: "Legal entity name" },
      { key: "email", label: "Email", placeholder: "admin@example.com", inputType: "email" },
      { key: "phone", label: "Phone", placeholder: "+91 90000 00000" },
      { key: "region", label: "Region", placeholder: "Asia/Kolkata · INR" },
    ],
    initialRows: [
      record("company-001", "ACTIVE", {
        name: "Zayan Max",
        legalName: "Zayan Max",
        email: "admin@zayan.test",
        phone: "+91 99999 99999",
        region: "Asia/Kolkata · INR",
      }),
    ],
    stats: [
      { label: "Companies", helper: "Current tenant" },
      { label: "Active", helper: "Operational", status: "ACTIVE" },
      { label: "Branches", helper: "Configured locations", value: "3" },
      { label: "Currency", helper: "Default", value: "INR" },
    ],
    workflow: [
      { title: "Identity", description: "Configure legal name, branding, email, phone, and registered address." },
      { title: "Regional defaults", description: "Set timezone, currency, locale, and operating preferences." },
      { title: "Organize", description: "Connect branches, departments, designations, users, and roles." },
    ],
    createLabel: "Add company profile",
  },
  users: {
    key: "users",
    title: "Users",
    description:
      "Manage application accounts, employee linkage, role assignment, verification state, and session access.",
    singular: "user",
    permission: "settings.view",
    statusOptions: ["ACTIVE", "INVITED", "SUSPENDED"],
    fields: [
      { key: "user", label: "User", placeholder: "Full name" },
      { key: "email", label: "Email", placeholder: "name@company.com", inputType: "email" },
      { key: "role", label: "Role", placeholder: "Manager" },
      { key: "department", label: "Department", placeholder: "Operations" },
      { key: "lastLogin", label: "Last login", placeholder: "Today · 10:42 AM" },
    ],
    initialRows: [
      record("usr-001", "ACTIVE", {
        user: "Zayan Max Admin",
        email: "admin@zayan.test",
        role: "Super Admin",
        department: "Administration",
        lastLogin: "Today · 04:18 PM",
      }),
      record("usr-002", "ACTIVE", {
        user: "Priya Menon",
        email: "priya@zayan.test",
        role: "HR Manager",
        department: "Human Resources",
        lastLogin: "Today · 02:12 PM",
      }),
      record("usr-003", "ACTIVE", {
        user: "Rahul Verma",
        email: "rahul@zayan.test",
        role: "Finance Manager",
        department: "Finance",
        lastLogin: "Yesterday · 06:01 PM",
      }),
      record("usr-004", "INVITED", {
        user: "Kavya Iyer",
        email: "kavya@zayan.test",
        role: "Recruiter",
        department: "Human Resources",
        lastLogin: "Invitation pending",
      }),
    ],
    stats: [
      { label: "Users", helper: "Current tenant" },
      { label: "Active", helper: "Can sign in", status: "ACTIVE" },
      { label: "Invited", helper: "Awaiting activation", status: "INVITED" },
      { label: "Active sessions", helper: "Across devices", value: "6" },
    ],
    workflow: [
      { title: "Invite", description: "Create an account and optionally link it to an employee record." },
      { title: "Authorize", description: "Assign one or more roles whose permission keys control every module." },
      { title: "Secure", description: "Review sessions, revoke access, suspend accounts, or force password changes." },
    ],
  },
  roles: {
    key: "roles",
    title: "Roles",
    description:
      "Group fine-grained permission keys into reusable access profiles for administrators and employees.",
    singular: "role",
    permission: "roles.view",
    statusOptions: ["ACTIVE", "INACTIVE"],
    fields: [
      { key: "role", label: "Role", placeholder: "Role name" },
      { key: "users", label: "Users", placeholder: "4" },
      { key: "permissions", label: "Permissions", placeholder: "24 permissions" },
      { key: "scope", label: "Scope", placeholder: "Company-wide" },
      { key: "updated", label: "Updated", placeholder: "29 Aug 2026" },
    ],
    initialRows: [
      record("rol-001", "ACTIVE", {
        role: "Super Admin",
        users: "1",
        permissions: "69 permissions",
        scope: "Company-wide",
        updated: "29 Aug 2026",
      }),
      record("rol-002", "ACTIVE", {
        role: "HR Manager",
        users: "2",
        permissions: "27 permissions",
        scope: "People & HR",
        updated: "26 Aug 2026",
      }),
      record("rol-003", "ACTIVE", {
        role: "Finance Manager",
        users: "2",
        permissions: "19 permissions",
        scope: "Billing & Finance",
        updated: "24 Aug 2026",
      }),
      record("rol-004", "ACTIVE", {
        role: "Employee",
        users: "38",
        permissions: "12 permissions",
        scope: "Self service",
        updated: "21 Aug 2026",
      }),
    ],
    stats: [
      { label: "Roles", helper: "Configured profiles" },
      { label: "Active", helper: "Assignable", status: "ACTIVE" },
      { label: "Permission keys", helper: "Seeded platform-wide", value: "69" },
      { label: "System roles", helper: "Protected profiles", value: "1" },
    ],
    workflow: [
      { title: "Define", description: "Give the role a clear name, purpose, and company scope." },
      { title: "Grant", description: "Select the minimum permission keys required for its responsibilities." },
      { title: "Assign", description: "Attach the role to users and audit later changes to access." },
    ],
  },
  permissions: {
    key: "permissions",
    title: "Permissions",
    description:
      "Review the fine-grained access keys used by controller guards and role assignments throughout ZayanMax.",
    singular: "permission",
    permission: "permissions.view",
    statusOptions: ["ACTIVE"],
    fields: [
      { key: "permission", label: "Permission key", placeholder: "module.action" },
      { key: "module", label: "Module", placeholder: "Module" },
      { key: "action", label: "Action", placeholder: "view" },
      { key: "roles", label: "Assigned roles", placeholder: "3 roles" },
      { key: "risk", label: "Access level", placeholder: "Standard" },
    ],
    initialRows: [
      record("prm-001", "ACTIVE", {
        permission: "employees.view",
        module: "Employees",
        action: "View",
        roles: "4 roles",
        risk: "Standard",
      }),
      record("prm-002", "ACTIVE", {
        permission: "payroll.manage",
        module: "Payroll",
        action: "Manage",
        roles: "2 roles",
        risk: "Sensitive",
      }),
      record("prm-003", "ACTIVE", {
        permission: "approvals.approve",
        module: "Approvals",
        action: "Approve",
        roles: "3 roles",
        risk: "Elevated",
      }),
      record("prm-004", "ACTIVE", {
        permission: "audit_logs.view",
        module: "Audit Logs",
        action: "View",
        roles: "1 role",
        risk: "Sensitive",
      }),
      record("prm-005", "ACTIVE", {
        permission: "settings.manage",
        module: "Settings",
        action: "Manage",
        roles: "1 role",
        risk: "Elevated",
      }),
    ],
    stats: [
      { label: "Permission keys", helper: "Current catalog" },
      { label: "Active", helper: "Available to roles", status: "ACTIVE" },
      { label: "Modules", helper: "Protected domains", value: "31" },
      { label: "Super Admin", helper: "Permissions granted", value: "69 / 69" },
    ],
    workflow: [
      { title: "Declare", description: "Each backend operation declares one or more required permission keys." },
      { title: "Group", description: "Roles collect permission keys around real responsibilities." },
      { title: "Enforce", description: "JWT context and permission guards block unauthorized controller actions." },
    ],
  },
  "audit-logs": {
    key: "audit-logs",
    title: "Audit Logs",
    description:
      "Review important mutations, actors, modules, tenant context, entities, timestamps, and outcomes.",
    singular: "audit event",
    permission: "audit_logs.view",
    statusOptions: ["SUCCESS", "DENIED", "FAILED"],
    fields: [
      { key: "action", label: "Action", placeholder: "UPDATE" },
      { key: "module", label: "Module", placeholder: "Employees" },
      { key: "actor", label: "Actor", placeholder: "User name" },
      { key: "entity", label: "Entity", placeholder: "EMP-0042" },
      { key: "timestamp", label: "Timestamp", placeholder: "29 Aug · 04:20 PM" },
    ],
    initialRows: [
      record("aud-001", "SUCCESS", {
        action: "APPROVE",
        module: "Approvals",
        actor: "Zayan Max Admin",
        entity: "APR-2076",
        timestamp: "29 Aug · 04:20 PM",
      }),
      record("aud-002", "SUCCESS", {
        action: "UPDATE",
        module: "Employees",
        actor: "Priya Menon",
        entity: "EMP-0018",
        timestamp: "29 Aug · 03:48 PM",
      }),
      record("aud-003", "DENIED", {
        action: "EXPORT",
        module: "Reports",
        actor: "Vikram Rao",
        entity: "Receivables aging",
        timestamp: "29 Aug · 02:26 PM",
      }),
      record("aud-004", "SUCCESS", {
        action: "CREATE",
        module: "Billing",
        actor: "Rahul Verma",
        entity: "INV-2026-0118",
        timestamp: "29 Aug · 12:17 PM",
      }),
      record("aud-005", "FAILED", {
        action: "LOGIN",
        module: "Authentication",
        actor: "unknown@external.test",
        entity: "Session",
        timestamp: "29 Aug · 10:03 AM",
      }),
    ],
    stats: [
      { label: "Events", helper: "Current sample" },
      { label: "Successful", helper: "Completed actions", status: "SUCCESS" },
      { label: "Denied", helper: "Permission blocks", status: "DENIED" },
      { label: "Retention", helper: "Configured target", value: "365 days" },
    ],
    workflow: [
      { title: "Capture", description: "Important mutations record actor, company, action, entity, and context." },
      { title: "Investigate", description: "Authorized administrators filter events by module, actor, result, or time." },
      { title: "Retain", description: "Production retention and archival policy should be finalized before launch." },
    ],
    createLabel: "Add audit note",
  },
};
