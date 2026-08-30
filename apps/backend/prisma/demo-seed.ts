import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const companyId = '00000000-0000-0000-0000-000000000001';
const referenceDate = new Date();
referenceDate.setHours(0, 0, 0, 0);

function stableId(scope: string, key: string) {
  const hex = createHash('sha256')
    .update(`zayanmax-demo:${scope}:${key}`)
    .digest('hex')
    .slice(0, 32)
    .split('');
  hex[12] = '5';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function day(offset: number, hour = 10, minute = 0) {
  const value = new Date(referenceDate);
  value.setDate(value.getDate() + offset);
  value.setHours(hour, minute, 0, 0);
  return value;
}

async function main() {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@zayan.test' },
  });
  if (!company || !admin) {
    throw new Error('Run npm run prisma:seed before npm run prisma:seed:demo.');
  }

  // Keep the presentation workspace clean when E2E suites have shared the local database.
  await prisma.project.deleteMany({
    where: { companyId, name: { contains: 'E2E', mode: 'insensitive' } },
  });
  const e2eEmployees = await prisma.employee.findMany({
    where: { companyId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      email: true,
    },
  });
  const e2eIdentitySignatures = [
    ['Attendance', 'Employee', /^ATT-\d+$/],
    ['Calendar', 'Employee', /^CAL-\d+$/],
    ['Communication', 'Employee', /^COM-\d+$/],
    ['Document', 'Employee', /^DOC-\d+$/],
    ['Finance', 'Employee', /^FIN-\d+$/],
    ['Helpdesk', 'Employee', /^HD-\d+$/],
    ['Payroll', 'Employee', /^PAY-\d+$/],
    ['Performance', 'Employee', /^PER-EMP-\d+$/],
    ['Performance', 'Manager', /^PER-MGR-\d+$/],
    ['Purchase', 'Employee', /^PIA-\d+$/],
    ['Recruit', 'Candidate', /^REC-\d+$/],
    ['Sales', 'Owner', /^SALE-EMP-\d+$/],
  ] as const;
  const e2eEmployeeIds = e2eEmployees
    .filter(
      (employee) =>
        employee.firstName.toLowerCase() === 'e2e' ||
        employee.email.toLowerCase().includes('e2e-') ||
        e2eIdentitySignatures.some(
          ([firstName, lastName, employeeCode]) =>
            employee.firstName === firstName &&
            employee.lastName === lastName &&
            employeeCode.test(employee.employeeCode),
        ),
    )
    .map((employee) => employee.id);
  if (e2eEmployeeIds.length > 0) {
    await prisma.attendanceCorrectionRequest.deleteMany({
      where: { companyId, employeeId: { in: e2eEmployeeIds } },
    });
    await prisma.attendanceRecord.deleteMany({
      where: { companyId, employeeId: { in: e2eEmployeeIds } },
    });
    await prisma.employee.updateMany({
      where: { id: { in: e2eEmployeeIds }, companyId },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });
  }

  const e2eShifts = await prisma.shift.findMany({
    where: {
      companyId,
      OR: [
        { name: { startsWith: 'General ' } },
        { name: 'QA Attendance Shift 20260830' },
      ],
    },
    select: { id: true, name: true },
  });
  const e2eShiftIds = e2eShifts
    .filter(
      (shift) =>
        /^General \d+$/.test(shift.name) ||
        shift.name === 'QA Attendance Shift 20260830',
    )
    .map((shift) => shift.id);
  if (e2eShiftIds.length > 0) {
    await prisma.shift.deleteMany({
      where: { id: { in: e2eShiftIds }, companyId },
    });
  }

  const e2eHolidays = await prisma.holiday.findMany({
    where: {
      companyId,
      name: { startsWith: 'Holiday ' },
      description: 'E2E holiday',
    },
    select: { id: true, name: true },
  });
  const e2eHolidayIds = e2eHolidays
    .filter((holiday) => /^Holiday \d+$/.test(holiday.name))
    .map((holiday) => holiday.id);
  if (e2eHolidayIds.length > 0) {
    await prisma.holiday.deleteMany({
      where: { id: { in: e2eHolidayIds }, companyId },
    });
  }

  const branchData = [
    ['Bengaluru HQ', 'Indiranagar, Bengaluru, Karnataka', '+91 80 4123 8800'],
    [
      'Hyderabad Delivery Centre',
      'HITEC City, Hyderabad, Telangana',
      '+91 40 4123 8800',
    ],
    ['Chennai Studio', 'Guindy, Chennai, Tamil Nadu', '+91 44 4123 8800'],
  ] as const;
  for (const [name, address, phone] of branchData) {
    await prisma.branch.upsert({
      where: { id: stableId('branch', name) },
      update: { name, address, phone, status: 'ACTIVE', deletedAt: null },
      create: { id: stableId('branch', name), companyId, name, address, phone },
    });
  }

  const departmentData = [
    ['Executive Office', 'Strategy, governance, and company operations'],
    ['Engineering', 'Product engineering and platform delivery'],
    ['Design', 'Experience design and research'],
    ['Sales', 'Business development and account growth'],
    ['Finance', 'Billing, accounting, and procurement'],
    ['People Operations', 'Talent, culture, and employee services'],
  ] as const;
  for (const [name, description] of departmentData) {
    await prisma.department.upsert({
      where: { companyId_name: { companyId, name } },
      update: { description, status: 'ACTIVE', deletedAt: null },
      create: {
        id: stableId('department', name),
        companyId,
        name,
        description,
      },
    });
  }

  const designationData = [
    'Managing Director',
    'Engineering Manager',
    'Senior Software Engineer',
    'Software Engineer',
    'Product Designer',
    'Account Executive',
    'Finance Analyst',
    'People Operations Partner',
  ];
  for (const name of designationData) {
    await prisma.designation.upsert({
      where: { companyId_name: { companyId, name } },
      update: { status: 'ACTIVE', deletedAt: null },
      create: { id: stableId('designation', name), companyId, name },
    });
  }

  const branches = await prisma.branch.findMany({ where: { companyId } });
  const departments = await prisma.department.findMany({
    where: { companyId },
  });
  const designations = await prisma.designation.findMany({
    where: { companyId },
  });
  const branchId = (name: string) =>
    branches.find((item) => item.name === name)!.id;
  const departmentId = (name: string) =>
    departments.find((item) => item.name === name)!.id;
  const designationId = (name: string) =>
    designations.find((item) => item.name === name)!.id;

  const employeeData = [
    [
      'ZM001',
      'Aarav',
      'Mehta',
      'Executive Office',
      'Managing Director',
      'Bengaluru HQ',
    ],
    [
      'ZM002',
      'Priya',
      'Nair',
      'Engineering',
      'Engineering Manager',
      'Bengaluru HQ',
    ],
    [
      'ZM003',
      'Rohan',
      'Kulkarni',
      'Engineering',
      'Senior Software Engineer',
      'Bengaluru HQ',
    ],
    [
      'ZM004',
      'Ananya',
      'Rao',
      'Engineering',
      'Senior Software Engineer',
      'Hyderabad Delivery Centre',
    ],
    [
      'ZM005',
      'Vikram',
      'Singh',
      'Engineering',
      'Software Engineer',
      'Hyderabad Delivery Centre',
    ],
    [
      'ZM006',
      'Neha',
      'Iyer',
      'Engineering',
      'Software Engineer',
      'Chennai Studio',
    ],
    [
      'ZM007',
      'Arjun',
      'Patel',
      'Engineering',
      'Software Engineer',
      'Bengaluru HQ',
    ],
    [
      'ZM008',
      'Kavya',
      'Sharma',
      'Engineering',
      'Software Engineer',
      'Hyderabad Delivery Centre',
    ],
    ['ZM009', 'Ishaan', 'Verma', 'Design', 'Product Designer', 'Bengaluru HQ'],
    [
      'ZM010',
      'Meera',
      'Krishnan',
      'Design',
      'Product Designer',
      'Chennai Studio',
    ],
    ['ZM011', 'Aditya', 'Joshi', 'Sales', 'Account Executive', 'Bengaluru HQ'],
    [
      'ZM012',
      'Sneha',
      'Reddy',
      'Sales',
      'Account Executive',
      'Hyderabad Delivery Centre',
    ],
    ['ZM013', 'Rahul', 'Desai', 'Sales', 'Account Executive', 'Bengaluru HQ'],
    ['ZM014', 'Pooja', 'Menon', 'Finance', 'Finance Analyst', 'Bengaluru HQ'],
    [
      'ZM015',
      'Karan',
      'Malhotra',
      'Finance',
      'Finance Analyst',
      'Bengaluru HQ',
    ],
    [
      'ZM016',
      'Divya',
      'Bose',
      'People Operations',
      'People Operations Partner',
      'Bengaluru HQ',
    ],
    [
      'ZM017',
      'Nikhil',
      'Gupta',
      'People Operations',
      'People Operations Partner',
      'Hyderabad Delivery Centre',
    ],
    [
      'ZM018',
      'Aisha',
      'Khan',
      'Engineering',
      'Software Engineer',
      'Chennai Studio',
    ],
    [
      'ZM019',
      'Sanjay',
      'Pillai',
      'Engineering',
      'Senior Software Engineer',
      'Chennai Studio',
    ],
    [
      'ZM020',
      'Tara',
      'Kapoor',
      'Design',
      'Product Designer',
      'Hyderabad Delivery Centre',
    ],
  ] as const;
  for (const [
    code,
    firstName,
    lastName,
    department,
    designation,
    branch,
  ] of employeeData) {
    const managerCode =
      code === 'ZM001'
        ? undefined
        : department === 'Engineering'
          ? 'ZM002'
          : 'ZM001';
    await prisma.employee.upsert({
      where: { companyId_employeeCode: { companyId, employeeCode: code } },
      update: {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@zayanmax.test`,
        phone: `+91 98${code.slice(-3).padStart(8, '0')}`,
        branchId: branchId(branch),
        departmentId: departmentId(department),
        designationId: designationId(designation),
        reportingManagerId: managerCode
          ? stableId('employee', managerCode)
          : null,
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        id: stableId('employee', code),
        companyId,
        branchId: branchId(branch),
        employeeCode: code,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@zayanmax.test`,
        phone: `+91 98${code.slice(-3).padStart(8, '0')}`,
        departmentId: departmentId(department),
        designationId: designationId(designation),
        reportingManagerId: managerCode
          ? stableId('employee', managerCode)
          : undefined,
        joiningDate: day(-900 + Number(code.slice(-2)) * 21),
        employmentType:
          Number(code.slice(-2)) % 7 === 0 ? 'CONTRACT' : 'FULL_TIME',
      },
    });
  }

  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      employeeCode: { startsWith: 'ZM' },
      deletedAt: null,
    },
    orderBy: { employeeCode: 'asc' },
  });

  const shiftData = [
    ['General Shift', 'general', '09:30', '18:30', 10],
    ['Early Shift', 'early', '07:00', '16:00', 10],
    ['Evening Shift', 'evening', '13:00', '22:00', 15],
  ] as const;
  for (const [name, key, startTime, endTime, graceMinutes] of shiftData) {
    await prisma.shift.upsert({
      where: { companyId_name: { companyId, name } },
      update: { startTime, endTime, graceMinutes, status: 'ACTIVE', deletedAt: null },
      create: {
        id: stableId('shift', key),
        companyId,
        name,
        startTime,
        endTime,
        graceMinutes,
        createdById: admin.id,
      },
    });
  }

  const attendanceOffsets = [-6, -5, -4, -3, -2, -1, 0];
  for (let employeeIndex = 0; employeeIndex < employees.length; employeeIndex += 1) {
    const employee = employees[employeeIndex];
    for (const offset of attendanceOffsets) {
      const variant = (employeeIndex + offset + 14) % 12;
      const status =
        variant === 0
          ? 'ABSENT'
          : variant === 1
            ? 'WORK_FROM_HOME'
            : variant === 2
              ? 'HALF_DAY'
              : variant === 3
                ? 'LATE'
                : 'PRESENT';
      const isAbsent = status === 'ABSENT';
      const isHalfDay = status === 'HALF_DAY';
      const isLate = status === 'LATE';
      const shiftKey = employeeIndex % 9 === 0 ? 'early' : employeeIndex % 7 === 0 ? 'evening' : 'general';
      const checkInHour = shiftKey === 'early' ? 7 : shiftKey === 'evening' ? 13 : isLate ? 10 : 9;
      const checkOutHour = isHalfDay ? checkInHour + 4 : shiftKey === 'early' ? 16 : shiftKey === 'evening' ? 22 : 18;
      const recordKey = offset === 0 ? employee.employeeCode : `${employee.employeeCode}:${offset}`;
      const attendanceId = stableId('attendance', recordKey);

      await prisma.attendanceRecord.upsert({
        where: { id: attendanceId },
        update: {
          employeeId: employee.id,
          shiftId: stableId('shift', shiftKey),
          date: day(offset, 12),
          checkInAt: isAbsent ? null : day(offset, checkInHour, isLate ? 2 : 0),
          checkOutAt: isAbsent || offset === 0 ? null : day(offset, checkOutHour, 5),
          status,
          source: status === 'WORK_FROM_HOME' ? 'SELF' : 'BIOMETRIC',
          lateMinutes: isLate ? 22 : 0,
          location: status === 'WORK_FROM_HOME' ? 'Remote' : 'Office',
          notes: isAbsent ? 'Approved absence recorded by People Operations' : null,
          deletedAt: null,
        },
        create: {
          id: attendanceId,
          companyId,
          employeeId: employee.id,
          shiftId: stableId('shift', shiftKey),
          date: day(offset, 12),
          checkInAt: isAbsent ? null : day(offset, checkInHour, isLate ? 2 : 0),
          checkOutAt: isAbsent || offset === 0 ? null : day(offset, checkOutHour, 5),
          status,
          source: status === 'WORK_FROM_HOME' ? 'SELF' : 'BIOMETRIC',
          lateMinutes: isLate ? 22 : 0,
          location: status === 'WORK_FROM_HOME' ? 'Remote' : 'Office',
          notes: isAbsent ? 'Approved absence recorded by People Operations' : undefined,
          createdById: admin.id,
        },
      });
    }
  }

  const holidayData = [
    ['Founders Day', 14, 'Annual company foundation celebration', true],
    ['Regional Festival Holiday', 31, 'Office holiday across all branches', false],
    ['Year-end Break', 62, 'Company-wide year-end holiday', true],
  ] as const;
  for (const [name, offset, description, recurring] of holidayData) {
    await prisma.holiday.upsert({
      where: { id: stableId('holiday', name) },
      update: { date: day(offset, 12), description, recurring, status: 'ACTIVE', deletedAt: null },
      create: {
        id: stableId('holiday', name),
        companyId,
        name,
        date: day(offset, 12),
        description,
        recurring,
        createdById: admin.id,
      },
    });
  }

  const correctionData = [
    {
      key: 'pending-check-in',
      employee: employees[2],
      attendanceOffset: -1,
      requestedCheckInAt: day(-1, 9, 5),
      requestedCheckOutAt: day(-1, 18, 10),
      requestedStatus: 'PRESENT' as const,
      reason: 'Biometric terminal recorded a delayed synchronization time.',
      status: 'PENDING' as const,
      reviewComment: null,
    },
    {
      key: 'approved-remote-day',
      employee: employees[5],
      attendanceOffset: -3,
      requestedCheckInAt: day(-3, 9, 0),
      requestedCheckOutAt: day(-3, 18, 0),
      requestedStatus: 'WORK_FROM_HOME' as const,
      reason: 'Approved remote-work day was initially marked as office attendance.',
      status: 'APPROVED' as const,
      reviewComment: 'Approved against the manager remote-work confirmation.',
    },
    {
      key: 'rejected-late-change',
      employee: employees[8],
      attendanceOffset: -4,
      requestedCheckInAt: day(-4, 9, 10),
      requestedCheckOutAt: day(-4, 18, 5),
      requestedStatus: 'PRESENT' as const,
      reason: 'Requested removal of late status after the grace period.',
      status: 'REJECTED' as const,
      reviewComment: 'Access-control logs confirm arrival after the grace period.',
    },
  ];
  for (const item of correctionData) {
    const attendanceKey = item.attendanceOffset === 0
      ? item.employee.employeeCode
      : `${item.employee.employeeCode}:${item.attendanceOffset}`;
    await prisma.attendanceCorrectionRequest.upsert({
      where: { id: stableId('attendance-correction', item.key) },
      update: {
        attendanceRecordId: stableId('attendance', attendanceKey),
        employeeId: item.employee.id,
        date: day(item.attendanceOffset, 12),
        requestedCheckInAt: item.requestedCheckInAt,
        requestedCheckOutAt: item.requestedCheckOutAt,
        requestedStatus: item.requestedStatus,
        reason: item.reason,
        status: item.status,
        reviewedById: item.status === 'PENDING' ? null : admin.id,
        reviewedAt: item.status === 'PENDING' ? null : day(-1, 15),
        reviewComment: item.reviewComment,
      },
      create: {
        id: stableId('attendance-correction', item.key),
        companyId,
        attendanceRecordId: stableId('attendance', attendanceKey),
        employeeId: item.employee.id,
        date: day(item.attendanceOffset, 12),
        requestedCheckInAt: item.requestedCheckInAt,
        requestedCheckOutAt: item.requestedCheckOutAt,
        requestedStatus: item.requestedStatus,
        reason: item.reason,
        status: item.status,
        reviewedById: item.status === 'PENDING' ? undefined : admin.id,
        reviewedAt: item.status === 'PENDING' ? undefined : day(-1, 15),
        reviewComment: item.reviewComment ?? undefined,
        createdById: admin.id,
        updatedById: item.status === 'PENDING' ? undefined : admin.id,
      },
    });
  }

  const clientData = [
    ['Aster Retail Private Limited', 'Retail', 'Bengaluru'],
    ['BluePeak Logistics Limited', 'Logistics', 'Hyderabad'],
    ['Cedar Health Systems', 'Healthcare', 'Chennai'],
    ['Dharani Foods Private Limited', 'FMCG', 'Coimbatore'],
    ['Evergreen Learning Foundation', 'Education', 'Pune'],
    ['Finora Capital Advisors', 'Financial Services', 'Mumbai'],
    ['GreenGrid Energy Solutions', 'Energy', 'Ahmedabad'],
    ['HarborStay Hospitality', 'Hospitality', 'Goa'],
    ['Indus Mobility Labs', 'Automotive', 'Bengaluru'],
    ['Jiva Home Products', 'Consumer Goods', 'Jaipur'],
  ] as const;
  for (let index = 0; index < clientData.length; index += 1) {
    const [name, industry, city] = clientData[index];
    const id = stableId('client', name);
    await prisma.client.upsert({
      where: { id },
      update: {
        name,
        industry,
        billingAddress: `${city}, India`,
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        id,
        companyId,
        type: 'COMPANY',
        name,
        email: `accounts@client${index + 1}.demo`,
        phone: `+91 80 5000 ${String(index + 1).padStart(4, '0')}`,
        website: `https://client${index + 1}.example`,
        industry,
        companySize: index % 2 ? '51-200' : '201-500',
        taxNumber: `29AABCZ${1000 + index}F1Z5`,
        billingAddress: `${city}, India`,
        ownerId: admin.id,
      },
    });
    await prisma.clientContact.upsert({
      where: { id: stableId('client-contact', name) },
      update: { name: `Client Partner ${index + 1}`, isPrimary: true },
      create: {
        id: stableId('client-contact', name),
        companyId,
        clientId: id,
        name: `Client Partner ${index + 1}`,
        designation: 'Business Sponsor',
        email: `partner${index + 1}@client.demo`,
        phone: `+91 99 1000 ${String(index + 1).padStart(4, '0')}`,
        isPrimary: true,
      },
    });
  }

  const clients = await prisma.client.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
  });
  const projectNames = [
    'Retail Command Centre',
    'Fleet Visibility Platform',
    'Patient Engagement Portal',
    'Distributor Automation',
    'Learning Operations Suite',
    'Advisor Workspace',
    'Energy Analytics Cloud',
    'Guest Experience Modernisation',
  ] as const;
  const projectTaskTitles: Record<(typeof projectNames)[number], string[]> = {
    'Retail Command Centre': [
      'Map store operations',
      'Design executive KPI views',
      'Integrate POS data feeds',
      'Pilot regional rollout',
    ],
    'Fleet Visibility Platform': [
      'Audit fleet telemetry sources',
      'Design dispatcher workspace',
      'Integrate GPS event pipeline',
      'Launch pilot fleet',
    ],
    'Patient Engagement Portal': [
      'Map patient communication journeys',
      'Prototype appointment reminders',
      'Integrate clinical scheduling APIs',
      'Run privacy readiness review',
    ],
    'Distributor Automation': [
      'Map distributor order flow',
      'Design partner ordering portal',
      'Integrate inventory availability',
      'Pilot priority distributors',
    ],
    'Learning Operations Suite': [
      'Map academic operations',
      'Design faculty workspace',
      'Integrate learner records',
      'Prepare term launch',
    ],
    'Advisor Workspace': [
      'Map advisory workflows',
      'Design client review workspace',
      'Integrate portfolio data',
      'Pilot advisor cohort',
    ],
    'Energy Analytics Cloud': [
      'Define energy performance metrics',
      'Design operations dashboards',
      'Integrate meter data streams',
      'Launch site monitoring pilot',
    ],
    'Guest Experience Modernisation': [
      'Map guest service journeys',
      'Design concierge workspace',
      'Integrate booking and service data',
      'Pilot flagship property',
    ],
  };
  const legacyTaskTitles = [
    'Discovery and scope',
    'Experience design',
    'Platform implementation',
    'UAT and launch',
  ];
  for (let index = 0; index < projectNames.length; index += 1) {
    const name = projectNames[index];
    const projectId = stableId('project', name);
    await prisma.project.upsert({
      where: { id: projectId },
      update: {
        name,
        clientId: clients[index].id,
        status: index < 6 ? 'ACTIVE' : 'PLANNED',
        deletedAt: null,
      },
      create: {
        id: projectId,
        companyId,
        clientId: clients[index].id,
        name,
        description: `Strategic delivery programme for ${clients[index].name}.`,
        status: index < 6 ? 'ACTIVE' : 'PLANNED',
        startDate: day(-120 + index * 12),
        dueDate: day(70 + index * 15),
      },
    });
    await prisma.task.deleteMany({
      where: { projectId, title: { in: legacyTaskTitles } },
    });
    for (let memberIndex = 0; memberIndex < 3; memberIndex += 1) {
      const employee = employees[2 + ((index * 2 + memberIndex) % 15)];
      await prisma.projectMember.upsert({
        where: {
          id: stableId('project-member', `${name}:${employee.employeeCode}`),
        },
        update: {
          role: memberIndex === 0 ? 'Delivery Lead' : 'Contributor',
          deletedAt: null,
        },
        create: {
          id: stableId('project-member', `${name}:${employee.employeeCode}`),
          companyId,
          projectId,
          employeeId: employee.id,
          role: memberIndex === 0 ? 'Delivery Lead' : 'Contributor',
        },
      });
    }
    for (let taskIndex = 0; taskIndex < 4; taskIndex += 1) {
      const title = projectTaskTitles[name][taskIndex];
      const taskId = stableId('task', `${name}:${title}`);
      const status =
        taskIndex === 0 ? 'DONE' : taskIndex === 1 ? 'IN_PROGRESS' : 'TODO';
      const assignee = employees[2 + ((index * 2 + taskIndex) % 15)];
      await prisma.task.upsert({
        where: { id: taskId },
        update: {
          status,
          priority: taskIndex === 2 ? 'HIGH' : 'MEDIUM',
          deletedAt: null,
        },
        create: {
          id: taskId,
          companyId,
          projectId,
          title,
          description: `${title} for ${name}.`,
          status,
          priority: taskIndex === 2 ? 'HIGH' : 'MEDIUM',
          startDate: day(-30 + taskIndex * 15),
          dueDate: day(12 + taskIndex * 18),
          completedAt: status === 'DONE' ? day(-10) : undefined,
        },
      });
      await prisma.taskAssignee.upsert({
        where: { id: stableId('task-assignee', `${name}:${title}`) },
        update: { employeeId: assignee.id, deletedAt: null },
        create: {
          id: stableId('task-assignee', `${name}:${title}`),
          companyId,
          taskId,
          employeeId: assignee.id,
          assignedById: admin.id,
        },
      });
    }
  }

  const sourceNames = ['Referral', 'Website', 'Industry Event'];
  for (const name of sourceNames) {
    await prisma.leadSource.upsert({
      where: { companyId_name: { companyId, name } },
      update: { status: 'ACTIVE' },
      create: { id: stableId('lead-source', name), companyId, name },
    });
  }
  const stageNames = ['New', 'Qualified', 'Discovery', 'Proposal'];
  for (let index = 0; index < stageNames.length; index += 1) {
    const name = stageNames[index];
    await prisma.leadStage.upsert({
      where: { companyId_name: { companyId, name } },
      update: { sortOrder: index + 1, status: 'ACTIVE' },
      create: {
        id: stableId('lead-stage', name),
        companyId,
        name,
        sortOrder: index + 1,
      },
    });
  }
  const opportunityStages = [
    'Discovery',
    'Solution Fit',
    'Commercial Review',
    'Contracting',
  ];
  for (let index = 0; index < opportunityStages.length; index += 1) {
    const name = opportunityStages[index];
    await prisma.opportunityStage.upsert({
      where: { companyId_name: { companyId, name } },
      update: { sortOrder: index + 1, status: 'ACTIVE' },
      create: {
        id: stableId('opportunity-stage', name),
        companyId,
        name,
        sortOrder: index + 1,
      },
    });
  }
  for (let index = 0; index < 12; index += 1) {
    const leadId = stableId('lead', String(index + 1));
    await prisma.salesLead.upsert({
      where: { id: leadId },
      update: {
        estimatedValue: 450000 + index * 85000,
        status: index < 2 ? 'QUALIFIED' : 'NEW',
        deletedAt: null,
      },
      create: {
        id: leadId,
        companyId,
        sourceId: stableId(
          'lead-source',
          sourceNames[index % sourceNames.length],
        ),
        stageId: stableId('lead-stage', stageNames[index % stageNames.length]),
        name: `Growth Prospect ${index + 1}`,
        companyName: `Prospect Ventures ${index + 1}`,
        email: `prospect${index + 1}@growth.demo`,
        phone: `+91 97 2000 ${String(index + 1).padStart(4, '0')}`,
        industry: ['Manufacturing', 'Retail', 'Technology'][index % 3],
        estimatedValue: 450000 + index * 85000,
        status: index < 2 ? 'QUALIFIED' : 'NEW',
        assignedUserId: admin.id,
        assignedEmployeeId: employees[10 + (index % 3)].id,
      },
    });
  }
  for (let index = 0; index < 6; index += 1) {
    const opportunityId = stableId('opportunity', String(index + 1));
    await prisma.salesOpportunity.upsert({
      where: { id: opportunityId },
      update: {
        expectedValue: 850000 + index * 225000,
        probability: 35 + index * 10,
        status: index === 5 ? 'WON' : 'OPEN',
        deletedAt: null,
      },
      create: {
        id: opportunityId,
        companyId,
        leadId: stableId('lead', String(index + 1)),
        clientId: index === 5 ? clients[8].id : undefined,
        stageId: stableId(
          'opportunity-stage',
          opportunityStages[index % opportunityStages.length],
        ),
        name: `${['Commerce', 'Operations', 'Analytics', 'Experience', 'Automation', 'Mobility'][index]} transformation`,
        description:
          'Qualified opportunity with an active solution and commercial plan.',
        expectedValue: 850000 + index * 225000,
        probability: 35 + index * 10,
        expectedCloseDate: day(30 + index * 12),
        status: index === 5 ? 'WON' : 'OPEN',
        assignedUserId: admin.id,
        assignedEmployeeId: employees[10 + (index % 3)].id,
        wonAt: index === 5 ? day(-14) : undefined,
      },
    });
  }

  await prisma.invoiceSeries.upsert({
    where: { companyId_name: { companyId, name: 'FY 2026-27' } },
    update: {
      prefix: 'ZM/26-27/',
      nextNumber: 9,
      isDefault: true,
      status: 'ACTIVE',
    },
    create: {
      id: stableId('invoice-series', 'fy-2026-27'),
      companyId,
      name: 'FY 2026-27',
      prefix: 'ZM/26-27/',
      nextNumber: 9,
      padding: 4,
      financialYear: '2026-27',
      isDefault: true,
    },
  });
  for (let index = 0; index < 6; index += 1) {
    const quotationId = stableId('quotation', String(index + 1));
    const subTotal = 600000 + index * 180000;
    const tax = subTotal * 0.18;
    await prisma.quotation.upsert({
      where: { id: quotationId },
      update: {
        subTotal,
        taxTotal: tax,
        grandTotal: subTotal + tax,
        status: index < 2 ? 'ACCEPTED' : 'SENT',
        deletedAt: null,
      },
      create: {
        id: quotationId,
        companyId,
        opportunityId: stableId('opportunity', String(index + 1)),
        leadId: stableId('lead', String(index + 1)),
        clientId: index < 2 ? clients[index].id : undefined,
        quotationNumber: `QT-2026-${String(index + 1).padStart(3, '0')}`,
        title: `Digital transformation proposal ${index + 1}`,
        status: index < 2 ? 'ACCEPTED' : 'SENT',
        validUntil: day(20 + index * 4),
        subTotal,
        taxTotal: tax,
        grandTotal: subTotal + tax,
        terms: '30% advance, balance against delivery milestones.',
        sentAt: day(-12 + index),
        acceptedAt: index < 2 ? day(-5 + index) : undefined,
      },
    });
    for (let itemIndex = 0; itemIndex < 2; itemIndex += 1) {
      const lineTotal = itemIndex === 0 ? subTotal * 0.65 : subTotal * 0.35;
      await prisma.quotationItem.upsert({
        where: {
          id: stableId('quotation-item', `${index + 1}:${itemIndex + 1}`),
        },
        update: {
          lineTotal,
          unitPrice: lineTotal,
          taxAmount: lineTotal * 0.18,
          deletedAt: null,
        },
        create: {
          id: stableId('quotation-item', `${index + 1}:${itemIndex + 1}`),
          companyId,
          quotationId,
          description:
            itemIndex === 0
              ? 'Product discovery and implementation'
              : 'Enablement and managed support',
          unitPrice: lineTotal,
          taxAmount: lineTotal * 0.18,
          lineTotal,
          sortOrder: itemIndex + 1,
        },
      });
    }
  }
  for (let index = 0; index < 8; index += 1) {
    const invoiceId = stableId('invoice', String(index + 1));
    const subTotal = 240000 + index * 85000;
    const tax = subTotal * 0.18;
    const total = subTotal + tax;
    const paid = index < 4 ? total : index === 4 ? total * 0.5 : 0;
    const status =
      index < 4
        ? 'PAID'
        : index === 4
          ? 'PARTIALLY_PAID'
          : index === 5
            ? 'OVERDUE'
            : 'ISSUED';
    await prisma.invoice.upsert({
      where: { id: invoiceId },
      update: {
        subTotal,
        taxTotal: tax,
        grandTotal: total,
        paidAmount: paid,
        balanceAmount: total - paid,
        status,
        deletedAt: null,
      },
      create: {
        id: invoiceId,
        companyId,
        clientId: clients[index].id,
        projectId: stableId('project', projectNames[index]),
        seriesId: stableId('invoice-series', 'fy-2026-27'),
        invoiceNumber: `ZM/26-27/${String(index + 1).padStart(4, '0')}`,
        title: `${projectNames[index]} milestone`,
        status,
        issueDate: day(-70 + index * 8),
        dueDate: day(-40 + index * 8),
        subTotal,
        taxTotal: tax,
        grandTotal: total,
        paidAmount: paid,
        balanceAmount: total - paid,
        terms: 'Payable within 30 days.',
        issuedAt: day(-70 + index * 8),
        paidAt: index < 4 ? day(-35 + index * 7) : undefined,
        overdueAt: index === 5 ? day(-2) : undefined,
      },
    });
    await prisma.invoiceItem.upsert({
      where: { id: stableId('invoice-item', String(index + 1)) },
      update: {
        unitPrice: subTotal,
        taxAmount: tax,
        lineTotal: subTotal,
        deletedAt: null,
      },
      create: {
        id: stableId('invoice-item', String(index + 1)),
        companyId,
        invoiceId,
        description: 'Professional services milestone',
        unitPrice: subTotal,
        taxAmount: tax,
        lineTotal: subTotal,
      },
    });
    if (index < 5) {
      const receiptId = stableId('receipt', String(index + 1));
      await prisma.paymentReceipt.upsert({
        where: { id: receiptId },
        update: { amount: paid, paymentMode: 'BANK_TRANSFER', deletedAt: null },
        create: {
          id: receiptId,
          companyId,
          clientId: clients[index].id,
          receiptNumber: `RCPT-2026-${String(index + 1).padStart(3, '0')}`,
          receiptDate: day(-30 + index * 5),
          amount: paid,
          paymentMode: 'BANK_TRANSFER',
          referenceNumber: `UTRDEMO${1000 + index}`,
        },
      });
      await prisma.receiptAllocation.upsert({
        where: { id: stableId('receipt-allocation', String(index + 1)) },
        update: { amount: paid },
        create: {
          id: stableId('receipt-allocation', String(index + 1)),
          companyId,
          receiptId,
          invoiceId,
          amount: paid,
        },
      });
    }
  }

  const expenseCategories = [
    'Travel',
    'Client Meetings',
    'Software Subscriptions',
    'Office Supplies',
    'Training',
  ];
  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { companyId_name: { companyId, name } },
      update: { status: 'ACTIVE' },
      create: { id: stableId('expense-category', name), companyId, name },
    });
  }
  for (let index = 0; index < 8; index += 1) {
    const amount = 2800 + index * 1250;
    const claimId = stableId('expense-claim', String(index + 1));
    await prisma.expenseClaim.upsert({
      where: { id: claimId },
      update: {
        totalAmount: amount,
        status: index < 4 ? 'APPROVED' : 'SUBMITTED',
        deletedAt: null,
      },
      create: {
        id: claimId,
        companyId,
        employeeId: employees[2 + index].id,
        claimNumber: `EXP-2026-${String(index + 1).padStart(3, '0')}`,
        title: `${expenseCategories[index % expenseCategories.length]} reimbursement`,
        claimDate: day(-20 + index),
        status: index < 4 ? 'APPROVED' : 'SUBMITTED',
        totalAmount: amount,
        submittedAt: day(-18 + index),
        reviewedById: index < 4 ? admin.id : undefined,
        reviewedAt: index < 4 ? day(-15 + index) : undefined,
      },
    });
    await prisma.expenseClaimItem.upsert({
      where: { id: stableId('expense-item', String(index + 1)) },
      update: { amount },
      create: {
        id: stableId('expense-item', String(index + 1)),
        companyId,
        expenseClaimId: claimId,
        expenseCategoryId: stableId(
          'expense-category',
          expenseCategories[index % expenseCategories.length],
        ),
        description: 'Approved business expense with supporting receipt',
        expenseDate: day(-21 + index),
        amount,
      },
    });
  }

  const vendorData = [
    ['CloudNine Systems', 'Cloud infrastructure'],
    ['Dell Business India', 'Computing hardware'],
    ['Workspace Furnishings', 'Office furniture'],
    ['PeopleLearn Academy', 'Professional training'],
    ['SecureNet Services', 'Network and security'],
    ['PrintCraft Solutions', 'Brand and print services'],
  ] as const;
  for (let index = 0; index < vendorData.length; index += 1) {
    const [name, service] = vendorData[index];
    await prisma.vendor.upsert({
      where: { id: stableId('vendor', name) },
      update: { name, status: 'ACTIVE', deletedAt: null },
      create: {
        id: stableId('vendor', name),
        companyId,
        name,
        email: `accounts@vendor${index + 1}.demo`,
        phone: `+91 96 3000 ${String(index + 1).padStart(4, '0')}`,
        gstin: `29AABCV${2000 + index}G1Z4`,
        address: `${service}, Bengaluru, India`,
      },
    });
  }
  const vendors = await prisma.vendor.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
  });
  for (let index = 0; index < 5; index += 1) {
    const total = 55000 + index * 27500;
    const billId = stableId('vendor-bill', String(index + 1));
    await prisma.vendorBill.upsert({
      where: { id: billId },
      update: {
        totalAmount: total,
        balanceAmount: index < 2 ? 0 : total,
        status: index < 2 ? 'PAID' : 'APPROVED',
        deletedAt: null,
      },
      create: {
        id: billId,
        companyId,
        vendorId: vendors[index].id,
        billNumber: `VB-${String(index + 1).padStart(4, '0')}`,
        billDate: day(-35 + index * 4),
        dueDate: day(-5 + index * 4),
        status: index < 2 ? 'PAID' : 'APPROVED',
        subTotal: total / 1.18,
        taxAmount: total - total / 1.18,
        totalAmount: total,
        paidAmount: index < 2 ? total : 0,
        balanceAmount: index < 2 ? 0 : total,
      },
    });
    await prisma.vendorBillItem.upsert({
      where: { id: stableId('vendor-bill-item', String(index + 1)) },
      update: { lineTotal: total },
      create: {
        id: stableId('vendor-bill-item', String(index + 1)),
        companyId,
        vendorBillId: billId,
        description: vendorData[index][1],
        unitPrice: total / 1.18,
        taxAmount: total - total / 1.18,
        lineTotal: total,
      },
    });
  }

  const inventoryCategories = [
    'Computing',
    'Networking',
    'Office Equipment',
    'Accessories',
  ];
  for (const name of inventoryCategories) {
    await prisma.inventoryCategory.upsert({
      where: { companyId_name: { companyId, name } },
      update: { status: 'ACTIVE' },
      create: { id: stableId('inventory-category', name), companyId, name },
    });
  }
  const inventoryNames = [
    'Developer Laptop',
    'Designer Workstation',
    '24-inch Monitor',
    'USB-C Dock',
    'Wireless Keyboard',
    'Wireless Mouse',
    'Noise-cancelling Headset',
    'Wi-Fi Access Point',
    'Network Switch',
    'HD Conference Camera',
    'Meeting Room Speaker',
    'Laptop Stand',
    'Power Backup Unit',
    'External SSD',
    'Security Key',
  ];
  for (let index = 0; index < inventoryNames.length; index += 1) {
    const name = inventoryNames[index];
    const stock = 4 + ((index * 7) % 24);
    await prisma.inventoryItem.upsert({
      where: {
        companyId_itemCode: {
          companyId,
          itemCode: `INV-${String(index + 1).padStart(3, '0')}`,
        },
      },
      update: {
        name,
        currentStock: stock,
        lowStockThreshold: 5,
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        id: stableId('inventory-item', name),
        companyId,
        inventoryCategoryId: stableId(
          'inventory-category',
          inventoryCategories[index % inventoryCategories.length],
        ),
        name,
        itemCode: `INV-${String(index + 1).padStart(3, '0')}`,
        sku: `ZM-SKU-${1000 + index}`,
        unit: 'unit',
        currentStock: stock,
        lowStockThreshold: 5,
      },
    });
    await prisma.stockMovement.upsert({
      where: { id: stableId('stock-movement', name) },
      update: { newStock: stock, quantity: stock },
      create: {
        id: stableId('stock-movement', name),
        companyId,
        inventoryItemId: stableId('inventory-item', name),
        type: 'IN',
        quantity: stock,
        previousStock: 0,
        newStock: stock,
        movementDate: day(-45 + index),
        referenceType: 'DEMO_OPENING',
        reason: 'Demo opening inventory',
      },
    });
  }
  for (let index = 0; index < 5; index += 1) {
    const requestId = stableId('purchase-request', String(index + 1));
    const inventoryName = inventoryNames[index];
    const estimatedTotal = 28000 + index * 16000;
    await prisma.purchaseRequest.upsert({
      where: { id: requestId },
      update: { status: index < 2 ? 'APPROVED' : 'SUBMITTED', deletedAt: null },
      create: {
        id: requestId,
        companyId,
        requesterEmployeeId: employees[3 + index].id,
        requestNumber: `PR-2026-${String(index + 1).padStart(3, '0')}`,
        title: `${inventoryName} replenishment`,
        neededByDate: day(18 + index * 4),
        status: index < 2 ? 'APPROVED' : 'SUBMITTED',
        notes: 'Required for confirmed onboarding and project allocation.',
      },
    });
    await prisma.purchaseRequestItem.upsert({
      where: { id: stableId('purchase-request-item', String(index + 1)) },
      update: { estimatedTotal },
      create: {
        id: stableId('purchase-request-item', String(index + 1)),
        companyId,
        purchaseRequestId: requestId,
        inventoryItemId: stableId('inventory-item', inventoryName),
        description: inventoryName,
        quantity: 2,
        estimatedUnitPrice: estimatedTotal / 2,
        estimatedTotal,
      },
    });
    if (index < 4) {
      const orderId = stableId('purchase-order', String(index + 1));
      await prisma.purchaseOrder.upsert({
        where: { id: orderId },
        update: {
          totalAmount: estimatedTotal * 1.18,
          status: index === 0 ? 'RECEIVED' : 'SENT',
          deletedAt: null,
        },
        create: {
          id: orderId,
          companyId,
          vendorId: vendors[index].id,
          purchaseRequestId: requestId,
          orderNumber: `PO-2026-${String(index + 1).padStart(3, '0')}`,
          orderDate: day(-10 + index),
          expectedDeliveryDate: day(8 + index * 3),
          status: index === 0 ? 'RECEIVED' : 'SENT',
          subTotal: estimatedTotal,
          taxAmount: estimatedTotal * 0.18,
          totalAmount: estimatedTotal * 1.18,
        },
      });
      await prisma.purchaseOrderItem.upsert({
        where: { id: stableId('purchase-order-item', String(index + 1)) },
        update: { lineTotal: estimatedTotal * 1.18 },
        create: {
          id: stableId('purchase-order-item', String(index + 1)),
          companyId,
          purchaseOrderId: orderId,
          inventoryItemId: stableId('inventory-item', inventoryName),
          description: inventoryName,
          quantity: 2,
          unitPrice: estimatedTotal / 2,
          taxAmount: estimatedTotal * 0.18,
          lineTotal: estimatedTotal * 1.18,
          receivedQuantity: index === 0 ? 2 : 0,
        },
      });
    }
  }

  const assetCategories = [
    'Laptops',
    'Monitors',
    'Mobile Devices',
    'Office Infrastructure',
  ];
  for (const name of assetCategories) {
    await prisma.assetCategory.upsert({
      where: { companyId_name: { companyId, name } },
      update: { status: 'ACTIVE' },
      create: { id: stableId('asset-category', name), companyId, name },
    });
  }
  for (let index = 0; index < 10; index += 1) {
    const assigned = index < 7 ? employees[2 + index] : undefined;
    const name =
      index < 6
        ? `MacBook Pro ${index + 1}`
        : index < 8
          ? `Dell Monitor ${index - 5}`
          : `Meeting Room Equipment ${index - 7}`;
    const category =
      index < 6 ? 'Laptops' : index < 8 ? 'Monitors' : 'Office Infrastructure';
    await prisma.asset.upsert({
      where: {
        companyId_assetTag: {
          companyId,
          assetTag: `ZM-AST-${String(index + 1).padStart(4, '0')}`,
        },
      },
      update: {
        name,
        assignedEmployeeId: assigned?.id ?? null,
        status: assigned ? 'ASSIGNED' : 'AVAILABLE',
        deletedAt: null,
      },
      create: {
        id: stableId('asset', String(index + 1)),
        companyId,
        assetCategoryId: stableId('asset-category', category),
        assignedEmployeeId: assigned?.id,
        name,
        assetTag: `ZM-AST-${String(index + 1).padStart(4, '0')}`,
        serialNumber: `SNZM2026${String(index + 1).padStart(5, '0')}`,
        purchaseDate: day(-180 + index * 6),
        warrantyExpiryDate: day(550 + index * 6),
        status: assigned ? 'ASSIGNED' : 'AVAILABLE',
      },
    });
    if (assigned) {
      await prisma.assetAssignment.upsert({
        where: { id: stableId('asset-assignment', String(index + 1)) },
        update: { employeeId: assigned.id, status: 'ACTIVE' },
        create: {
          id: stableId('asset-assignment', String(index + 1)),
          companyId,
          assetId: stableId('asset', String(index + 1)),
          employeeId: assigned.id,
          assignedAt: day(-120 + index * 5),
          status: 'ACTIVE',
        },
      });
    }
  }

  const folderData = [
    ['Company Policies', '/company-policies'],
    ['Client Delivery', '/client-delivery'],
    ['Finance', '/finance'],
  ] as const;
  for (const [name, path] of folderData) {
    await prisma.documentFolder.upsert({
      where: { companyId_path: { companyId, path } },
      update: { name, status: 'ACTIVE', deletedAt: null },
      create: {
        id: stableId('document-folder', name),
        companyId,
        ownerUserId: admin.id,
        name,
        path,
        visibility: 'COMPANY',
      },
    });
  }
  const documentCategories = ['Policy', 'Template', 'Client Deliverable'];
  for (const name of documentCategories) {
    await prisma.documentCategory.upsert({
      where: { companyId_name: { companyId, name } },
      update: { status: 'ACTIVE' },
      create: { id: stableId('document-category', name), companyId, name },
    });
  }
  const documents = [
    ['Employee Handbook 2026', 'Company Policies', 'Policy'],
    ['Information Security Policy', 'Company Policies', 'Policy'],
    ['Project Kick-off Template', 'Client Delivery', 'Template'],
    ['Monthly Delivery Report', 'Client Delivery', 'Client Deliverable'],
    ['Expense and Travel Policy', 'Finance', 'Policy'],
  ] as const;
  for (let index = 0; index < documents.length; index += 1) {
    const [title, folder, category] = documents[index];
    const documentId = stableId('document', title);
    await prisma.documentRecord.upsert({
      where: { id: documentId },
      update: { title, status: 'ACTIVE', deletedAt: null },
      create: {
        id: documentId,
        companyId,
        folderId: stableId('document-folder', folder),
        categoryId: stableId('document-category', category),
        ownerUserId: admin.id,
        title,
        description: `Approved ${category.toLowerCase()} available to the demo organisation.`,
        visibility: 'COMPANY',
        status: 'ACTIVE',
        reminderAt: index === 0 ? day(45) : undefined,
      },
    });
    await prisma.documentVersion.upsert({
      where: { documentId_versionNumber: { documentId, versionNumber: 1 } },
      update: { fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf` },
      create: {
        id: stableId('document-version', title),
        companyId,
        documentId,
        versionNumber: 1,
        fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        storageKey: `demo/documents/${documentId}/v1.pdf`,
        mimeType: 'application/pdf',
        size: 64000 + index * 7500,
        checksum: stableId('checksum', title).replace(/-/g, ''),
      },
    });
  }
  await prisma.knowledgeBaseCategory.upsert({
    where: { companyId_path: { companyId, path: '/getting-started' } },
    update: { status: 'ACTIVE' },
    create: {
      id: stableId('kb-category', 'getting-started'),
      companyId,
      name: 'Getting Started',
      path: '/getting-started',
      description: 'Guides for everyday work in ZayanMax.',
    },
  });
  const articleTitles = [
    'How to submit an expense claim',
    'Project delivery checklist',
    'Requesting leave',
    'Using the client workspace',
  ];
  for (let index = 0; index < articleTitles.length; index += 1) {
    const title = articleTitles[index];
    await prisma.knowledgeBaseArticle.upsert({
      where: {
        companyId_slug: {
          companyId,
          slug: title.toLowerCase().replace(/\s+/g, '-'),
        },
      },
      update: {
        title,
        status: 'PUBLISHED',
        publishedAt: day(-20 + index),
        deletedAt: null,
      },
      create: {
        id: stableId('kb-article', title),
        companyId,
        categoryId: stableId('kb-category', 'getting-started'),
        authorUserId: admin.id,
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        summary: 'A concise, practical guide for the ZayanMax demo team.',
        content: `# ${title}\n\nFollow the documented workflow, attach supporting details, and track status from the relevant module.`,
        status: 'PUBLISHED',
        publishedAt: day(-20 + index),
      },
    });
  }

  const announcementData = [
    [
      'Quarterly town hall',
      'Join the leadership team for the quarterly business update and product roadmap.',
      day(-3),
    ],
    [
      'New client delivery playbook',
      'The refreshed delivery playbook is now available in Documents and Knowledge Base.',
      day(-8),
    ],
    [
      'September learning week',
      'Reserve time for engineering, design, sales, and leadership learning sessions.',
      day(-12),
    ],
  ] as const;
  for (const [title, body, publishedAt] of announcementData) {
    const announcementId = stableId('announcement', title);
    await prisma.companyAnnouncement.upsert({
      where: { id: announcementId },
      update: {
        title,
        body,
        status: 'PUBLISHED',
        publishedAt,
        deletedAt: null,
      },
      create: {
        id: announcementId,
        companyId,
        authorUserId: admin.id,
        title,
        body,
        status: 'PUBLISHED',
        publishedAt,
      },
    });
    await prisma.announcementAudience.upsert({
      where: { id: stableId('announcement-audience', title) },
      update: { audienceType: 'ALL_COMPANY' },
      create: {
        id: stableId('announcement-audience', title),
        companyId,
        announcementId,
        audienceType: 'ALL_COMPANY',
      },
    });
  }
  const notificationTypes = [
    ['TASK_DUE', 'Task due soon', 'PROJECT'],
    ['INVOICE_OVERDUE', 'Invoice overdue', 'FINANCE'],
    ['APPROVAL_REQUIRED', 'Approval required', 'SYSTEM'],
  ] as const;
  for (const [code, name, category] of notificationTypes) {
    await prisma.notificationType.upsert({
      where: { companyId_code: { companyId, code } },
      update: { name, category, status: 'ACTIVE' },
      create: {
        id: stableId('notification-type', code),
        companyId,
        code,
        name,
        category,
      },
    });
  }
  for (let index = 0; index < 6; index += 1) {
    const [code, name, category] =
      notificationTypes[index % notificationTypes.length];
    await prisma.internalNotification.upsert({
      where: { id: stableId('notification', String(index + 1)) },
      update: { title: name, isRead: index < 2 },
      create: {
        id: stableId('notification', String(index + 1)),
        companyId,
        recipientUserId: admin.id,
        notificationTypeId: stableId('notification-type', code),
        title: name,
        body:
          index % 3 === 0
            ? 'Review the delivery milestone due this week.'
            : index % 3 === 1
              ? 'A receivable has crossed its due date.'
              : 'A submitted request is awaiting your decision.',
        category,
        priority: index === 1 ? 'HIGH' : 'NORMAL',
        isRead: index < 2,
        readAt: index < 2 ? day(-1) : undefined,
      },
    });
  }

  const resources = [
    ['Boardroom A', 'Meeting room', 'Bengaluru HQ', 12],
    ['Collaboration Studio', 'Workshop space', 'Hyderabad Delivery Centre', 20],
    ['Focus Room 3', 'Meeting room', 'Chennai Studio', 6],
  ] as const;
  for (const [name, type, location, capacity] of resources) {
    await prisma.calendarResource.upsert({
      where: { companyId_name: { companyId, name } },
      update: { type, location, capacity, status: 'ACTIVE' },
      create: {
        id: stableId('calendar-resource', name),
        companyId,
        name,
        type,
        location,
        capacity,
      },
    });
  }
  const eventData = [
    ['Weekly delivery review', 'MEETING', 1, 10, 11, 'Boardroom A'],
    [
      'Aster Retail steering committee',
      'CLIENT_MEETING',
      2,
      15,
      16,
      'Collaboration Studio',
    ],
    ['Engineering architecture forum', 'MEETING', 4, 14, 15, 'Boardroom A'],
    ['September town hall', 'CUSTOM', 7, 11, 13, 'Collaboration Studio'],
    ['Finance month-end review', 'MEETING', 3, 16, 17, 'Focus Room 3'],
    [
      'Project launch workshop',
      'PROJECT_MILESTONE',
      9,
      10,
      13,
      'Collaboration Studio',
    ],
  ] as const;
  for (const [
    title,
    eventType,
    offset,
    startHour,
    endHour,
    resource,
  ] of eventData) {
    const eventId = stableId('calendar-event', title);
    await prisma.calendarEvent.upsert({
      where: { id: eventId },
      update: {
        title,
        startAt: day(offset, startHour),
        endAt: day(offset, endHour),
        status: 'SCHEDULED',
        deletedAt: null,
      },
      create: {
        id: eventId,
        companyId,
        createdByUserId: admin.id,
        title,
        description:
          'Scheduled demo calendar event with clear ownership and follow-up.',
        eventType,
        startAt: day(offset, startHour),
        endAt: day(offset, endHour),
        location: resource,
        entityType: title.includes('Aster') ? 'CLIENT' : undefined,
        entityId: title.includes('Aster') ? clients[0].id : undefined,
        clientId: title.includes('Aster') ? clients[0].id : undefined,
      },
    });
    await prisma.calendarResourceBooking.upsert({
      where: { id: stableId('calendar-booking', title) },
      update: {
        startAt: day(offset, startHour),
        endAt: day(offset, endHour),
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        id: stableId('calendar-booking', title),
        companyId,
        eventId,
        resourceId: stableId('calendar-resource', resource),
        startAt: day(offset, startHour),
        endAt: day(offset, endHour),
      },
    });
    await prisma.calendarEventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: admin.id } },
      update: { rsvpStatus: 'ACCEPTED', deletedAt: null },
      create: {
        id: stableId('calendar-attendee', title),
        companyId,
        eventId,
        userId: admin.id,
        rsvpStatus: 'ACCEPTED',
        respondedAt: day(-1),
      },
    });
  }

  const counts = {
    branches: await prisma.branch.count({
      where: { companyId, deletedAt: null },
    }),
    departments: await prisma.department.count({
      where: { companyId, deletedAt: null },
    }),
    employees: await prisma.employee.count({
      where: { companyId, deletedAt: null },
    }),
    shifts: await prisma.shift.count({ where: { companyId, deletedAt: null } }),
    attendanceRecords: await prisma.attendanceRecord.count({
      where: { companyId, deletedAt: null },
    }),
    attendanceCorrections: await prisma.attendanceCorrectionRequest.count({
      where: { companyId },
    }),
    holidays: await prisma.holiday.count({ where: { companyId, deletedAt: null } }),
    clients: await prisma.client.count({
      where: { companyId, deletedAt: null },
    }),
    projects: await prisma.project.count({
      where: { companyId, deletedAt: null },
    }),
    tasks: await prisma.task.count({ where: { companyId, deletedAt: null } }),
    leads: await prisma.salesLead.count({
      where: { companyId, deletedAt: null },
    }),
    quotations: await prisma.quotation.count({
      where: { companyId, deletedAt: null },
    }),
    invoices: await prisma.invoice.count({
      where: { companyId, deletedAt: null },
    }),
    expenseClaims: await prisma.expenseClaim.count({
      where: { companyId, deletedAt: null },
    }),
    vendors: await prisma.vendor.count({
      where: { companyId, deletedAt: null },
    }),
    purchaseRequests: await prisma.purchaseRequest.count({
      where: { companyId, deletedAt: null },
    }),
    inventoryItems: await prisma.inventoryItem.count({
      where: { companyId, deletedAt: null },
    }),
    assets: await prisma.asset.count({ where: { companyId, deletedAt: null } }),
    documents: await prisma.documentRecord.count({
      where: { companyId, deletedAt: null },
    }),
    knowledgeArticles: await prisma.knowledgeBaseArticle.count({
      where: { companyId, deletedAt: null },
    }),
    announcements: await prisma.companyAnnouncement.count({
      where: { companyId, deletedAt: null },
    }),
    notifications: await prisma.internalNotification.count({
      where: { companyId, deletedAt: null },
    }),
    calendarEvents: await prisma.calendarEvent.count({
      where: { companyId, deletedAt: null },
    }),
  };
  console.log(JSON.stringify({ company: company.name, counts }, null, 2));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
