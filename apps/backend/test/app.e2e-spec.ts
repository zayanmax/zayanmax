import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { setupSwagger } from '../src/common/openapi/swagger';
import { PrismaService } from '../src/database/prisma.service';

jest.setTimeout(30000);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    setupSwagger(app);
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect({
        success: true,
        message: 'Request completed successfully',
        data: {
          service: 'zayan-max-backend',
          status: 'ok',
        },
      });
  });

  it('exposes Swagger and health/readiness endpoints', async () => {
    await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect((response) => {
        expect(response.body.openapi).toEqual(expect.any(String));
        expect(response.body.components.securitySchemes.bearer).toEqual(
          expect.objectContaining({ type: 'http', scheme: 'bearer' }),
        );
        expect(response.body.components.schemas.StandardErrorResponse).toEqual(
          expect.any(Object),
        );
      });

    await request(app.getHttpServer())
      .get('/api/docs')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Swagger UI');
      });

    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            status: expect.any(String),
            service: 'zayan-max-backend',
            version: expect.any(String),
            checks: expect.objectContaining({
              database: expect.objectContaining({ status: expect.any(String) }),
              redis: expect.objectContaining({ status: expect.any(String) }),
            }),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect((response) => {
        expect(response.body.data.status).toBe('ok');
      });

    await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect((response) => {
        expect([200, 503]).toContain(response.status);
        expect(response.body.data ?? response.body).toEqual(expect.any(Object));
      });
  });

  it('denies permission-gated APIs for users without required permissions', async () => {
    const prisma = app.get(PrismaService);
    const suffix = Date.now();
    const email = `limited-${suffix}@zayan.test`;
    await prisma.user.create({
      data: {
        companyId: '00000000-0000-0000-0000-000000000001',
        email,
        passwordHash: await bcrypt.hash('Password123', 10),
        isEmailVerified: true,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Password123' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
      .expect(403)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.objectContaining({
            success: false,
            errorCode: 'FORBIDDEN',
            message: 'Permission denied',
          }),
        );
      });
  });

  it('logs in seeded admin and creates a company-scoped employee', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    expect(accessToken).toEqual(expect.any(String));

    const employeeCode = `E2E-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'E2E',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: '2026-06-12',
      })
      .expect(201);

    expect(createResponse.body.data).toEqual(
      expect.objectContaining({
        employeeCode,
        companyId: '00000000-0000-0000-0000-000000000001',
      }),
    );

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: employeeCode })
      .expect(200);

    expect(listResponse.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ employeeCode })]),
    );
    expect(listResponse.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('manages clients, contacts, notes, activities, and document metadata', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const suffix = Date.now();
    const clientName = `Acme CRM ${suffix}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'COMPANY',
        name: clientName,
        email: `crm-${suffix}@acme.test`,
        phone: `9000${String(suffix).slice(-6)}`,
        website: 'https://acme.test',
        industry: 'Technology',
        companySize: '11-50',
        taxNumber: `GST${suffix}`,
        billingAddress: 'Local test address',
      })
      .expect(201);

    const clientId = createResponse.body.data.id;
    expect(createResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        companyId: '00000000-0000-0000-0000-000000000001',
        name: clientName,
        status: 'ACTIVE',
      }),
    );

    await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'COMPANY',
        name: clientName,
        email: `crm-${suffix}@acme.test`,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/clients/${clientId}/contacts`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Primary CRM Contact',
        designation: 'Manager',
        email: `contact-${suffix}@acme.test`,
        phone: `9111${String(suffix).slice(-6)}`,
        isPrimary: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/clients/${clientId}/notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ noteText: 'Follow up next week' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/clients/${clientId}/activities`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'FOLLOW_UP',
        title: 'Call client',
        description: 'Discuss proposal',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/clients/${clientId}/documents`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fileName: 'contract.pdf',
        storageKey: `clients/${clientId}/contract.pdf`,
        mimeType: 'application/pdf',
        size: 4096,
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: clientName, type: 'COMPANY', status: 'ACTIVE' })
      .expect(200);

    expect(listResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: clientId, name: clientName }),
      ]),
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/clients/${clientId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'INACTIVE' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/clients/${clientId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('manages projects, members, tasks, subtasks, comments, attachments, assignees, and kanban lists', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();
    const projectName = `Project E2E ${suffix}`;

    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: projectName,
        description: 'E2E project',
        status: 'ACTIVE',
        startDate: '2026-06-12',
        dueDate: '2026-07-12',
      })
      .expect(201);

    const projectId = projectResponse.body.data.id;
    expect(projectResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        companyId: '00000000-0000-0000-0000-000000000001',
        name: projectName,
        status: 'ACTIVE',
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId, role: 'Owner' })
      .expect(201);

    const taskTitle = `Task E2E ${suffix}`;
    const taskResponse = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        projectId,
        title: taskTitle,
        description: 'E2E task',
        priority: 'HIGH',
        status: 'TODO',
        startDate: '2026-06-12',
        dueDate: '2026-06-20',
        assigneeUserIds: [userId],
      })
      .expect(201);

    const taskId = taskResponse.body.data.id;
    expect(taskResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        projectId,
        title: taskTitle,
        status: 'TODO',
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/subtasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Subtask E2E', priority: 'MEDIUM' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ commentText: 'Initial task comment' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/attachments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fileName: 'task-brief.pdf',
        storageKey: `tasks/${taskId}/task-brief.pdf`,
        mimeType: 'application/pdf',
        size: 2048,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/tasks/kanban')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ projectId })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.TODO).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: taskId, title: taskTitle }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'DONE', completedAt: '2026-06-21T10:00:00.000Z' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'COMPLETED', completedAt: '2026-07-12T10:00:00.000Z' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('manages attendance, corrections, leave approvals, and holidays', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const suffix = Date.now();
    const employeeCode = `ATT-${suffix}`;

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Attendance',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: '2026-06-12',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const shiftResponse = await request(app.getHttpServer())
      .post('/api/v1/shifts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `General ${suffix}`,
        startTime: '09:30',
        endTime: '18:30',
        graceMinutes: 10,
      })
      .expect(201);

    const shiftId = shiftResponse.body.data.id;
    const manualAttendanceResponse = await request(app.getHttpServer())
      .post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        shiftId,
        date: '2026-06-12',
        checkInAt: '2026-06-12T09:25:00.000Z',
        checkOutAt: '2026-06-12T18:35:00.000Z',
        status: 'PRESENT',
        location: 'Office',
        notes: 'Manual E2E attendance',
      })
      .expect(201);

    const attendanceId = manualAttendanceResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/attendance/manual')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        date: '2026-06-12',
        status: 'PRESENT',
      })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        shiftId,
        date: '2026-06-13',
        checkInAt: '2026-06-13T09:40:00.000Z',
        status: 'LATE',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/attendance/check-out')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        date: '2026-06-13',
        checkOutAt: '2026-06-13T18:45:00.000Z',
      })
      .expect(201);

    const correctionResponse = await request(app.getHttpServer())
      .post('/api/v1/attendance/corrections')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        attendanceRecordId: attendanceId,
        employeeId,
        date: '2026-06-12',
        requestedCheckInAt: '2026-06-12T09:20:00.000Z',
        requestedCheckOutAt: '2026-06-12T18:40:00.000Z',
        requestedStatus: 'PRESENT',
        reason: 'Forgot exact checkout time',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(
        `/api/v1/attendance/corrections/${correctionResponse.body.data.id}/review`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'APPROVED', reviewComment: 'Approved in E2E' })
      .expect(200);

    const leaveTypeResponse = await request(app.getHttpServer())
      .post('/api/v1/leaves/types')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Annual Leave ${suffix}`,
        code: `AL${String(suffix).slice(-6)}`,
        annualAllowance: 12,
      })
      .expect(201);

    const leaveTypeId = leaveTypeResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/leaves/balances')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        leaveTypeId,
        year: 2026,
        openingBalance: 12,
        accrued: 0,
        used: 0,
      })
      .expect(201);

    const leaveRequestResponse = await request(app.getHttpServer())
      .post('/api/v1/leaves/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        leaveTypeId,
        fromDate: '2026-06-20',
        toDate: '2026-06-21',
        days: 2,
        reason: 'Personal leave',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(
        `/api/v1/leaves/requests/${leaveRequestResponse.body.data.id}/review`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'APPROVED', reviewComment: 'Approved' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Holiday ${suffix}`,
        date: '2026-06-25',
        description: 'E2E holiday',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/attendance/monthly-summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ year: 2026, month: 6, employeeId })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.total).toBeGreaterThanOrEqual(2);
        expect(response.body.data.byStatus.PRESENT).toBeGreaterThanOrEqual(1);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/attendance/employees/${employeeId}/report`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ fromDate: '2026-06-01', toDate: '2026-06-30' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.records).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: attendanceId }),
          ]),
        );
      });
  });

  it('manages payroll structures, assignments, advances, runs, statuses, and payslip metadata', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const suffix = Date.now();
    const employeeCode = `PAY-${suffix}`;
    const dayOffset = Math.floor(suffix / 1000) % 10000;
    const startDateValue = new Date(Date.UTC(2030, 0, 1 + dayOffset));
    const dateText = (date: Date) => date.toISOString().slice(0, 10);
    const addDays = (date: Date, days: number) =>
      new Date(date.getTime() + days * 86_400_000);
    const startDate = dateText(startDateValue);
    const secondDate = dateText(addDays(startDateValue, 1));
    const thirdDate = dateText(addDays(startDateValue, 2));
    const endDate = dateText(addDays(startDateValue, 29));

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Payroll',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: startDate,
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const structureResponse = await request(app.getHttpServer())
      .post('/api/v1/payroll/salary-structures')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Payroll Structure ${suffix}`,
        description: 'E2E payroll structure',
        components: [
          { name: 'Basic', code: 'BASIC', type: 'EARNING', amount: 30000 },
          {
            name: 'Professional Tax',
            code: 'PT',
            type: 'DEDUCTION',
            amount: 300,
          },
        ],
      })
      .expect(201);

    const salaryStructureId = structureResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/payroll/salary-assignments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        salaryStructureId,
        effectiveFrom: startDate,
        monthlyGross: 30000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/payroll/advances')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        amount: 1000,
        installmentAmount: 250,
        notes: 'E2E advance',
      })
      .expect(201);

    for (const attendance of [
      { date: startDate, status: 'PRESENT' },
      { date: secondDate, status: 'HALF_DAY' },
      { date: thirdDate, status: 'LEAVE' },
    ]) {
      await request(app.getHttpServer())
        .post('/api/v1/attendance/manual')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          employeeId,
          date: attendance.date,
          status: attendance.status,
        })
        .expect(201);
    }

    const periodResponse = await request(app.getHttpServer())
      .post('/api/v1/payroll/periods')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Payroll Period ${suffix}`,
        startDate,
        endDate,
      })
      .expect(201);

    const payrollPeriodId = periodResponse.body.data.id;

    const runResponse = await request(app.getHttpServer())
      .post('/api/v1/payroll/runs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ payrollPeriodId, notes: 'E2E payroll run' })
      .expect(201);

    const payrollRunId = runResponse.body.data.id;
    expect(runResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        payrollPeriodId,
        status: 'DRAFT',
      }),
    );

    await request(app.getHttpServer())
      .post('/api/v1/payroll/runs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ payrollPeriodId })
      .expect(409);

    await request(app.getHttpServer())
      .get(`/api/v1/payroll/runs/${payrollRunId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.lineItems).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              employeeId,
              payableDays: '2.5',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/payroll/runs/${payrollRunId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'APPROVED' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/payroll/runs/${payrollRunId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'PAID' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/payroll/payslips/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ payrollRunId })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              payrollRunId,
              employeeId,
              status: 'GENERATED',
            }),
          ]),
        );
      });
  });

  it('manages finance expenses, vendors, bills, payments, and petty cash', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const suffix = Date.now();
    const employeeCode = `FIN-${suffix}`;

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Finance',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const categoryResponse = await request(app.getHttpServer())
      .post('/api/v1/finance/expense-categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Travel ${suffix}`,
        description: 'Travel expenses',
      })
      .expect(201);

    const expenseCategoryId = categoryResponse.body.data.id;

    const vendorEmail = `vendor-${suffix}@zayan.test`;
    const vendorResponse = await request(app.getHttpServer())
      .post('/api/v1/vendors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Vendor ${suffix}`,
        email: vendorEmail,
        phone: `98${String(suffix).slice(-8)}`,
        gstin: `29ABCDE${String(suffix).slice(-4)}F1Z5`,
        address: 'Vendor test address',
      })
      .expect(201);

    const vendorId = vendorResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/vendors')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Duplicate Vendor ${suffix}`,
        email: vendorEmail,
      })
      .expect(409);

    const expenseResponse = await request(app.getHttpServer())
      .post('/api/v1/finance/expenses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        claimDate: '2026-06-13',
        title: `Travel Claim ${suffix}`,
        items: [
          {
            expenseCategoryId,
            description: 'Cab fare',
            expenseDate: '2026-06-13',
            amount: 500,
            taxAmount: 50,
          },
        ],
        attachments: [
          {
            fileName: 'receipt.jpg',
            storageKey: `expenses/${suffix}/receipt.jpg`,
            mimeType: 'image/jpeg',
            size: 1024,
          },
        ],
      })
      .expect(201);

    const expenseId = expenseResponse.body.data.id;

    for (const status of ['SUBMITTED', 'APPROVED', 'PAID']) {
      await request(app.getHttpServer())
        .patch(`/api/v1/finance/expenses/${expenseId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status, reviewComment: `${status} in E2E` })
        .expect(200);
    }

    const billResponse = await request(app.getHttpServer())
      .post('/api/v1/finance/vendor-bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorId,
        billNumber: `BILL-${suffix}`,
        billDate: '2026-06-13',
        dueDate: '2026-06-30',
        items: [
          {
            description: 'Consulting services',
            quantity: 1,
            unitPrice: 1000,
            taxAmount: 180,
          },
        ],
      })
      .expect(201);

    const vendorBillId = billResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/finance/vendor-bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorId,
        billNumber: `BILL-${suffix}`,
        billDate: '2026-06-13',
        items: [{ description: 'Duplicate', quantity: 1, unitPrice: 1000 }],
      })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/v1/finance/vendor-payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorId,
        vendorBillId,
        paymentDate: '2026-06-14',
        amount: 1180,
        mode: 'BANK_TRANSFER',
        referenceNumber: `UTR-${suffix}`,
      })
      .expect(201);

    const pettyCashResponse = await request(app.getHttpServer())
      .post('/api/v1/finance/petty-cash-accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Main Cash ${suffix}`,
        openingBalance: 1000,
      })
      .expect(201);

    const pettyCashAccountId = pettyCashResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/finance/petty-cash-transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        pettyCashAccountId,
        type: 'OUTFLOW',
        transactionDate: '2026-06-15',
        amount: 250,
        description: 'Office supplies',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/finance/dashboard-summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.expenseClaims.total).toBeGreaterThanOrEqual(
          1,
        );
        expect(
          response.body.data.vendorPayments.paidAmount,
        ).toBeGreaterThanOrEqual(1180);
      });
  });

  it('manages purchases, inventory, stock movements, assets, assignments, and maintenance', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const suffix = Date.now();
    const employeeCode = `PIA-${suffix}`;

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Purchase',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const inventoryCategoryResponse = await request(app.getHttpServer())
      .post('/api/v1/inventory/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `IT Hardware ${suffix}`,
        description: 'Hardware stock',
      })
      .expect(201);

    const inventoryCategoryId = inventoryCategoryResponse.body.data.id;
    const itemCode = `ITM-${suffix}`;
    const sku = `SKU-${suffix}`;
    const inventoryItemResponse = await request(app.getHttpServer())
      .post('/api/v1/inventory/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        inventoryCategoryId,
        name: `Laptop ${suffix}`,
        itemCode,
        sku,
        unit: 'pcs',
        lowStockThreshold: 5,
      })
      .expect(201);

    const inventoryItemId = inventoryItemResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/inventory/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Duplicate Laptop ${suffix}`,
        itemCode,
        unit: 'pcs',
      })
      .expect(409);

    const purchaseRequestResponse = await request(app.getHttpServer())
      .post('/api/v1/purchases/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        requesterEmployeeId: employeeId,
        title: `Laptop Purchase ${suffix}`,
        neededByDate: '2026-06-20',
        items: [
          {
            inventoryItemId,
            description: 'Laptop stock',
            quantity: 2,
            estimatedUnitPrice: 50000,
          },
        ],
      })
      .expect(201);

    const purchaseRequestId = purchaseRequestResponse.body.data.id;

    for (const status of ['SUBMITTED', 'APPROVED', 'ORDERED']) {
      await request(app.getHttpServer())
        .patch(`/api/v1/purchases/requests/${purchaseRequestId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status, reviewComment: `${status} in E2E` })
        .expect(200);
    }

    const orderNumber = `PO-${suffix}`;
    const purchaseOrderResponse = await request(app.getHttpServer())
      .post('/api/v1/purchases/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        purchaseRequestId,
        orderNumber,
        orderDate: '2026-06-13',
        expectedDeliveryDate: '2026-06-25',
        items: [
          {
            inventoryItemId,
            description: 'Laptop stock',
            quantity: 2,
            unitPrice: 50000,
            taxAmount: 9000,
          },
        ],
      })
      .expect(201);

    const purchaseOrderId = purchaseOrderResponse.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/purchases/orders/${purchaseOrderId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'SENT' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/purchases/goods-received-notes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        purchaseOrderId,
        grnNumber: `GRN-${suffix}`,
        receivedDate: '2026-06-14',
        items: [
          {
            inventoryItemId,
            description: 'Laptop stock received',
            quantityReceived: 2,
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/inventory/stock-adjustments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        inventoryItemId,
        quantity: -1,
        movementDate: '2026-06-15',
        reason: 'Damaged during testing',
      })
      .expect(201);

    const listInventoryResponse = await request(app.getHttpServer())
      .get('/api/v1/inventory/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: itemCode })
      .expect(200);

    expect(listInventoryResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: inventoryItemId, itemCode }),
      ]),
    );

    const assetCategoryResponse = await request(app.getHttpServer())
      .post('/api/v1/assets/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Laptop Assets ${suffix}`,
        description: 'Track issued laptops',
      })
      .expect(201);

    const assetCategoryId = assetCategoryResponse.body.data.id;
    const assetTag = `AST-${suffix}`;
    const serialNumber = `SN-${suffix}`;
    const assetResponse = await request(app.getHttpServer())
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        assetCategoryId,
        name: `Laptop Asset ${suffix}`,
        assetTag,
        serialNumber,
        purchaseDate: '2026-06-13',
        warrantyExpiryDate: '2027-06-13',
      })
      .expect(201);

    const assetId = assetResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Duplicate Asset ${suffix}`,
        assetTag,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/assign`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        assignedAt: '2026-06-16',
        notes: 'Issued for work',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/assets/${assetId}/maintenance`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        maintenanceDate: '2026-06-17',
        description: 'Initial inspection',
        cost: 500,
        nextMaintenanceDate: '2026-12-17',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: assetTag })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: assetId,
              assetTag,
              status: 'ASSIGNED',
            }),
          ]),
        );
      });
  });

  it('manages document metadata, versions, folders, and knowledge base articles', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();
    const employeeCode = `DOC-${suffix}`;

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Document',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const rootFolderResponse = await request(app.getHttpServer())
      .post('/api/v1/document-folders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Policies ${suffix}`,
        description: 'Company policy documents',
        visibility: 'COMPANY',
        ownerUserId: userId,
      })
      .expect(201);

    const rootFolderId = rootFolderResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/document-folders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Policies ${suffix}` })
      .expect(409);

    const childFolderResponse = await request(app.getHttpServer())
      .post('/api/v1/document-folders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        parentFolderId: rootFolderId,
        name: `HR ${suffix}`,
        visibility: 'COMPANY',
      })
      .expect(201);

    const folderId = childFolderResponse.body.data.id;

    const categoryResponse = await request(app.getHttpServer())
      .post('/api/v1/document-categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Contracts ${suffix}`,
        description: 'Contract records',
      })
      .expect(201);

    const categoryId = categoryResponse.body.data.id;

    const tagResponse = await request(app.getHttpServer())
      .post('/api/v1/document-tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `legal-${suffix}` })
      .expect(201);

    const tagId = tagResponse.body.data.id;
    const documentTitle = `Employment Contract ${suffix}`;
    const documentResponse = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        folderId,
        categoryId,
        ownerUserId: userId,
        title: documentTitle,
        description: 'Metadata-only employment contract',
        visibility: 'COMPANY',
        linkedEntityType: 'EMPLOYEE',
        linkedEntityId: employeeId,
        tagIds: [tagId],
        expiresAt: '2027-06-13',
        reminderAt: '2027-05-13',
        fileName: 'employment-contract.pdf',
        storageKey: `documents/${suffix}/employment-contract.pdf`,
        mimeType: 'application/pdf',
        size: 4096,
      })
      .expect(201);

    const documentId = documentResponse.body.data.id;
    expect(documentResponse.body.data.versions).toEqual(
      expect.arrayContaining([expect.objectContaining({ versionNumber: 1 })]),
    );

    await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        folderId,
        title: documentTitle,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fileName: 'employment-contract-v2.pdf',
        storageKey: `documents/${suffix}/employment-contract-v2.pdf`,
        mimeType: 'application/pdf',
        size: 8192,
        notes: 'Second version',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.data.versionNumber).toBe(2);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Updated metadata-only contract' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/documents/${documentId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'ARCHIVED' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        search: documentTitle,
        linkedEntityType: 'EMPLOYEE',
        linkedEntityId: employeeId,
        status: 'ARCHIVED',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: documentId,
              title: documentTitle,
              status: 'ARCHIVED',
            }),
          ]),
        );
      });

    const kbCategoryResponse = await request(app.getHttpServer())
      .post('/api/v1/knowledge-base/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Operations ${suffix}`,
        description: 'Operations knowledge',
      })
      .expect(201);

    const kbCategoryId = kbCategoryResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/knowledge-base/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Operations ${suffix}` })
      .expect(409);

    const articleTitle = `How to request assets ${suffix}`;
    const articleResponse = await request(app.getHttpServer())
      .post('/api/v1/knowledge-base/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId: kbCategoryId,
        authorUserId: userId,
        title: articleTitle,
        summary: 'Asset request process',
        content: 'Create an asset request with business justification.',
        tagIds: [tagId],
      })
      .expect(201);

    const articleId = articleResponse.body.data.id;
    expect(articleResponse.body.data.status).toBe('DRAFT');

    await request(app.getHttpServer())
      .patch(`/api/v1/knowledge-base/articles/${articleId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/knowledge-base/articles/${articleId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'ARCHIVED' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/knowledge-base/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: articleTitle, status: 'ARCHIVED' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: articleId,
              title: articleTitle,
              status: 'ARCHIVED',
            }),
          ]),
        );
      });
  });

  it('manages announcements, notification metadata, preferences, and reminders', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();
    const employeeCode = `COM-${suffix}`;

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Communication',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const announcementTitle = `Office update ${suffix}`;
    const announcementResponse = await request(app.getHttpServer())
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: announcementTitle,
        body: 'Office timing update.',
        audiences: [
          { audienceType: 'ALL_COMPANY' },
          { audienceType: 'EMPLOYEE', employeeId },
        ],
      })
      .expect(201);

    const announcementId = announcementResponse.body.data.id;
    expect(announcementResponse.body.data.audiences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ audienceType: 'ALL_COMPANY' }),
        expect.objectContaining({ audienceType: 'EMPLOYEE', employeeId }),
      ]),
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'Updated office timing.' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/announcements/${announcementId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/announcements/${announcementId}/read`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/announcements/${announcementId}/read-receipts`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ announcementId, userId }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/announcements/${announcementId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'ARCHIVED' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: announcementTitle, status: 'ARCHIVED' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: announcementId,
              title: announcementTitle,
              status: 'ARCHIVED',
            }),
          ]),
        );
      });

    const notificationTypeCode = `TASK_UPDATED_${suffix}`;
    const notificationTypeResponse = await request(app.getHttpServer())
      .post('/api/v1/notification-types')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: notificationTypeCode,
        name: `Task Updated ${suffix}`,
        category: 'TASK',
        description: 'Task update notification',
      })
      .expect(201);

    const notificationTypeId = notificationTypeResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/notification-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        notificationTypeId,
        code: `TASK_UPDATED_EMAIL_${suffix}`,
        name: `Task Updated Email ${suffix}`,
        channel: 'EMAIL',
        category: 'TASK',
        subject: 'Task updated',
        bodyTemplate: 'Task {{taskName}} was updated.',
      })
      .expect(201);

    const notificationTitle = `Task notification ${suffix}`;
    const notificationResponse = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientUserId: userId,
        notificationTypeId,
        title: notificationTitle,
        body: 'A task changed.',
        category: 'TASK',
        priority: 'HIGH',
        entityType: 'EMPLOYEE',
        entityId: employeeId,
        channels: ['IN_APP', 'EMAIL'],
      })
      .expect(201);

    const notificationId = notificationResponse.body.data.id;
    expect(notificationResponse.body.data.deliveries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channel: 'IN_APP', status: 'PENDING' }),
        expect.objectContaining({ channel: 'EMAIL', status: 'PENDING' }),
      ]),
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.isRead).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notificationId}/unread`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.isRead).toBe(false);
      });

    await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: notificationTitle, category: 'TASK', isRead: false })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: notificationId,
              title: notificationTitle,
              isRead: false,
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .post('/api/v1/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        channel: 'EMAIL',
        category: 'PAYROLL',
        enabled: false,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/notification-preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ category: 'PAYROLL', channel: 'EMAIL' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              userId,
              channel: 'EMAIL',
              category: 'PAYROLL',
              enabled: false,
            }),
          ]),
        );
      });

    const reminderTitle = `Reminder ${suffix}`;
    await request(app.getHttpServer())
      .post('/api/v1/reminders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientUserId: userId,
        title: reminderTitle,
        body: 'Follow up tomorrow.',
        remindAt: '2026-06-14T09:00:00.000Z',
        category: 'TASK',
        priority: 'NORMAL',
        entityType: 'EMPLOYEE',
        entityId: employeeId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/reminders')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: reminderTitle, status: 'PENDING' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              recipientUserId: userId,
              title: reminderTitle,
              status: 'PENDING',
            }),
          ]),
        );
      });
  });

  it('manages calendar events, attendees, resources, bookings, and calendar views', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();
    const employeeCode = `CAL-${suffix}`;

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Calendar',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const resourceName = `Board Room ${suffix}`;
    const resourceResponse = await request(app.getHttpServer())
      .post('/api/v1/calendar/resources')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: resourceName,
        type: 'MEETING_ROOM',
        location: 'First floor',
        capacity: 8,
        description: 'Room for client meetings',
      })
      .expect(201);

    const resourceId = resourceResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/calendar/resources')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: resourceName })
      .expect(409);

    const eventTitle = `Client Scheduling ${suffix}`;
    const eventResponse = await request(app.getHttpServer())
      .post('/api/v1/calendar/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: eventTitle,
        description: 'Discuss delivery timeline',
        eventType: 'CLIENT_MEETING',
        startAt: '2035-06-20T09:00:00.000Z',
        endAt: '2035-06-20T10:00:00.000Z',
        timezone: 'Asia/Kolkata',
        location: 'First floor',
        recurrenceRule: 'FREQ=WEEKLY;COUNT=2',
        recurrenceEndsAt: '2035-07-04T10:00:00.000Z',
        entityType: 'EMPLOYEE',
        entityId: employeeId,
        attendees: [{ userId, employeeId }],
        resourceBookings: [{ resourceId }],
        reminders: [
          {
            method: 'IN_APP',
            remindAt: '2035-06-20T08:45:00.000Z',
            minutesBefore: 15,
          },
        ],
      })
      .expect(201);

    const eventId = eventResponse.body.data.id;
    expect(eventResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: eventTitle,
        eventType: 'CLIENT_MEETING',
        status: 'SCHEDULED',
        entityType: 'EMPLOYEE',
        entityId: employeeId,
      }),
    );
    expect(eventResponse.body.data.attendees).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId, rsvpStatus: 'PENDING' }),
      ]),
    );
    expect(eventResponse.body.data.resourceBookings).toEqual(
      expect.arrayContaining([expect.objectContaining({ resourceId })]),
    );
    expect(eventResponse.body.data.reminders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: 'IN_APP', status: 'PENDING' }),
      ]),
    );

    await request(app.getHttpServer())
      .post('/api/v1/calendar/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `Conflicting Scheduling ${suffix}`,
        eventType: 'MEETING',
        startAt: '2035-06-20T09:30:00.000Z',
        endAt: '2035-06-20T10:30:00.000Z',
        resourceBookings: [{ resourceId }],
      })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/api/v1/calendar/events/${eventId}/rsvp`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rsvpStatus: 'ACCEPTED' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.rsvpStatus).toBe('ACCEPTED');
      });

    await request(app.getHttpServer())
      .post(`/api/v1/calendar/resources/${resourceId}/bookings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        eventId,
        startAt: '2035-06-20T11:00:00.000Z',
        endAt: '2035-06-20T12:00:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/calendar/events/${eventId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'CANCELLED' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/calendar/my')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: eventTitle, status: 'CANCELLED' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: eventId, title: eventTitle }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/calendar/company')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        eventType: 'CLIENT_MEETING',
        fromDate: '2035-06-20T00:00:00.000Z',
        toDate: '2035-06-21T00:00:00.000Z',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: eventId, title: eventTitle }),
          ]),
        );
      });
  });

  it('manages helpdesk ticket categories, tickets, comments, notes, attachments, and queues', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();

    const departmentResponse = await request(app.getHttpServer())
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Helpdesk IT ${suffix}`,
        description: 'Helpdesk e2e department',
      })
      .expect(201);

    const departmentId = departmentResponse.body.data.id;
    const employeeCode = `HD-${suffix}`;
    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        firstName: 'Helpdesk',
        lastName: 'Employee',
        email: `${employeeCode.toLowerCase()}@zayan.test`,
        departmentId,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;
    const categoryName = `Hardware ${suffix}`;
    const categoryResponse = await request(app.getHttpServer())
      .post('/api/v1/helpdesk/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        departmentId,
        name: categoryName,
        description: 'Hardware support',
      })
      .expect(201);

    const categoryId = categoryResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/helpdesk/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: categoryName })
      .expect(409);

    const subcategoryResponse = await request(app.getHttpServer())
      .post(`/api/v1/helpdesk/categories/${categoryId}/subcategories`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Laptop ${suffix}`,
        description: 'Laptop support',
      })
      .expect(201);

    const subcategoryId = subcategoryResponse.body.data.id;
    const ticketTitle = `Laptop support ${suffix}`;
    const ticketResponse = await request(app.getHttpServer())
      .post('/api/v1/helpdesk/tickets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        requesterUserId: userId,
        requesterEmployeeId: employeeId,
        departmentId,
        categoryId,
        subcategoryId,
        title: ticketTitle,
        description: 'Laptop does not power on.',
        priority: 'HIGH',
        source: 'EMPLOYEE',
        assignedUserId: userId,
        assignedEmployeeId: employeeId,
        assignedTeamName: 'IT',
        entityType: 'EMPLOYEE',
        entityId: employeeId,
        firstResponseDueAt: '2035-06-20T09:30:00.000Z',
        resolutionDueAt: '2035-06-21T09:30:00.000Z',
      })
      .expect(201);

    const ticketId = ticketResponse.body.data.id;
    expect(ticketResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ticketNumber: expect.any(String),
        title: ticketTitle,
        status: 'OPEN',
        priority: 'HIGH',
        source: 'EMPLOYEE',
        requesterUserId: userId,
        requesterEmployeeId: employeeId,
        assignedUserId: userId,
        assignedEmployeeId: employeeId,
        assignedTeamName: 'IT',
        entityType: 'EMPLOYEE',
        entityId: employeeId,
      }),
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/helpdesk/tickets/${ticketId}/assignment`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        assignedUserId: userId,
        assignedEmployeeId: employeeId,
        assignedTeamName: 'IT Escalation',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/helpdesk/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        authorEmployeeId: employeeId,
        commentText: 'We are checking the laptop.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/helpdesk/tickets/${ticketId}/internal-notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        authorEmployeeId: employeeId,
        noteText: 'Try replacement adapter first.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/helpdesk/tickets/${ticketId}/attachments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fileName: 'laptop-photo.png',
        storageKey: `helpdesk/${ticketId}/laptop-photo.png`,
        mimeType: 'image/png',
        size: 4096,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/helpdesk/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/helpdesk/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'CLOSED' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/helpdesk/tickets/my')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: ticketTitle, status: 'CLOSED' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: ticketId, title: ticketTitle }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/helpdesk/tickets/queue')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ departmentId, categoryId, priority: 'HIGH' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: ticketId,
              departmentId,
              categoryId,
              priority: 'HIGH',
            }),
          ]),
        );
      });
  });

  it('manages performance cycles, goals, KPIs, reviews, feedback, and summaries', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();

    const managerResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode: `PER-MGR-${suffix}`,
        firstName: 'Performance',
        lastName: 'Manager',
        email: `per-mgr-${suffix}@zayan.test`,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const managerEmployeeId = managerResponse.body.data.id;
    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode: `PER-EMP-${suffix}`,
        firstName: 'Performance',
        lastName: 'Employee',
        email: `per-emp-${suffix}@zayan.test`,
        reportingManagerId: managerEmployeeId,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;
    const cycleName = `FY Performance ${suffix}`;
    const cycleResponse = await request(app.getHttpServer())
      .post('/api/v1/performance/cycles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: cycleName,
        description: 'Annual performance cycle',
        startDate: '2035-01-01',
        endDate: '2035-12-31',
      })
      .expect(201);

    const cycleId = cycleResponse.body.data.id;
    await request(app.getHttpServer())
      .post('/api/v1/performance/cycles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: cycleName,
        startDate: '2035-01-01',
        endDate: '2035-12-31',
      })
      .expect(409);

    const goalResponse = await request(app.getHttpServer())
      .post('/api/v1/performance/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cycleId,
        employeeId,
        title: `Improve quality ${suffix}`,
        description: 'Reduce rework across delivery',
        targetValue: '95%',
        weight: 30,
        dueDate: '2035-06-30',
      })
      .expect(201);

    const goalId = goalResponse.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/performance/goals/${goalId}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        progress: 60,
        comment: 'Good progress',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/performance/goals/${goalId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    const kpiCategoryResponse = await request(app.getHttpServer())
      .post('/api/v1/performance/kpi-categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Quality ${suffix}` })
      .expect(201);

    const kpiCategoryId = kpiCategoryResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/performance/kpis')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cycleId,
        employeeId,
        categoryId: kpiCategoryId,
        title: 'Quality score',
        score: 92,
        maxScore: 100,
        notes: 'Strong quality rating',
      })
      .expect(201);

    const templateResponse = await request(app.getHttpServer())
      .post('/api/v1/performance/review-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Annual Review ${suffix}`,
        questions: [
          {
            questionText: 'What went well?',
            responseType: 'TEXT',
            sortOrder: 1,
            required: true,
          },
        ],
      })
      .expect(201);

    const templateId = templateResponse.body.data.id;
    const questionId = templateResponse.body.data.questions[0].id;

    const reviewResponse = await request(app.getHttpServer())
      .post('/api/v1/performance/reviews')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cycleId,
        employeeId,
        templateId,
        reviewerUserId: userId,
        managerEmployeeId,
        overallScore: 4.5,
        summary: 'Strong performer',
        promotionRecommended: true,
        promotionRecommendationText: 'Ready for senior role',
      })
      .expect(201);

    const reviewId = reviewResponse.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/performance/reviews/${reviewId}/responses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionId,
        responseText: 'Delivered major improvements.',
        score: 4,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/performance/reviews/${reviewId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/performance/feedback')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        feedbackByEmployeeId: managerEmployeeId,
        feedbackText: 'Strong ownership and follow through.',
        feedbackType: 'POSITIVE',
        visibility: 'MANAGER',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/performance/one-on-ones')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        managerEmployeeId,
        meetingDate: '2035-06-20',
        title: 'Monthly 1:1',
        notes: 'Discussed growth goals.',
        actionItems: 'Prepare leadership plan.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/performance/promotion-recommendations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId,
        reviewId,
        recommendedByEmployeeId: managerEmployeeId,
        recommendationText: 'Ready for senior role.',
        currentDesignation: 'Executive',
        recommendedDesignation: 'Senior Executive',
        effectiveFrom: '2035-07-01',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/performance/employees/${employeeId}/summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            employeeId,
            feedbackCount: 1,
            oneOnOneCount: 1,
          }),
        );
        expect(response.body.data.goals).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: goalId })]),
        );
      });

    await request(app.getHttpServer())
      .get(`/api/v1/performance/managers/${managerEmployeeId}/team-summary`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.employees).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: employeeId })]),
        );
      });
  });

  it('manages recruitment jobs, candidates, applications, interviews, offers, onboarding, and conversion', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const suffix = Date.now();

    const departmentResponse = await request(app.getHttpServer())
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Recruitment Dept ${suffix}` })
      .expect(201);

    const departmentId = departmentResponse.body.data.id;
    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/recruitment/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `Backend Engineer ${suffix}`,
        departmentId,
        description: 'Build backend services',
        requirements: 'NestJS and PostgreSQL',
        location: 'Hyderabad',
        employmentType: 'FULL_TIME',
        openingsCount: 2,
      })
      .expect(201);

    const jobId = jobResponse.body.data.id;
    await request(app.getHttpServer())
      .patch(`/api/v1/recruitment/jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'OPEN' })
      .expect(200);

    const candidateResponse = await request(app.getHttpServer())
      .post('/api/v1/recruitment/candidates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Recruit',
        lastName: 'Candidate',
        email: `candidate-${suffix}@zayan.test`,
        phone: `9888${String(suffix).slice(-6)}`,
        source: 'LinkedIn',
        sourceDetails: 'Sourced by recruiter',
        skills: 'NestJS, Prisma',
      })
      .expect(201);

    const candidateId = candidateResponse.body.data.id;
    await request(app.getHttpServer())
      .post('/api/v1/recruitment/candidates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Candidate',
        email: `candidate-${suffix}@zayan.test`,
      })
      .expect(409);

    const stageResponse = await request(app.getHttpServer())
      .post('/api/v1/recruitment/pipeline-stages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Screening ${suffix}`, sortOrder: 1 })
      .expect(201);

    const stageId = stageResponse.body.data.id;
    const applicationResponse = await request(app.getHttpServer())
      .post('/api/v1/recruitment/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ candidateId, jobOpeningId: jobId, stageId })
      .expect(201);

    const applicationId = applicationResponse.body.data.id;
    await request(app.getHttpServer())
      .patch(`/api/v1/recruitment/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'INTERVIEW' })
      .expect(200);

    const interviewResponse = await request(app.getHttpServer())
      .post('/api/v1/recruitment/interviews')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        applicationId,
        roundName: 'Technical Round',
        interviewType: 'TECHNICAL',
        scheduledAt: '2035-03-01T10:00:00.000Z',
        meetingLink: 'https://meet.zayan.test/recruitment',
      })
      .expect(201);

    const interviewId = interviewResponse.body.data.id;
    await request(app.getHttpServer())
      .post(`/api/v1/recruitment/interviews/${interviewId}/feedback`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        rating: 4,
        feedback: 'Strong technical fundamentals.',
        recommendation: 'advance',
      })
      .expect(201);

    const offerResponse = await request(app.getHttpServer())
      .post('/api/v1/recruitment/offers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        applicationId,
        title: 'Backend Engineer Offer',
        offeredDesignation: 'Backend Engineer',
        offeredSalary: 1200000,
        joiningDate: '2035-04-01',
        expiryDate: '2035-03-15',
        documentName: 'offer-letter.pdf',
        documentUrl: 'metadata://offer-letter',
      })
      .expect(201);

    const offerId = offerResponse.body.data.id;
    await request(app.getHttpServer())
      .patch(`/api/v1/recruitment/offers/${offerId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'SENT' })
      .expect(200);

    const checklistResponse = await request(app.getHttpServer())
      .post('/api/v1/recruitment/onboarding-checklists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        applicationId,
        candidateId,
        title: 'Candidate onboarding',
        dueDate: '2035-04-05',
        items: [{ title: 'Collect ID proof', sortOrder: 1 }],
      })
      .expect(201);

    const checklistId = checklistResponse.body.data.id;
    const itemId = checklistResponse.body.data.items[0].id;
    await request(app.getHttpServer())
      .post(`/api/v1/recruitment/onboarding-checklists/${checklistId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Create payroll profile placeholder', sortOrder: 2 })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/recruitment/onboarding-items/${itemId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isCompleted: true })
      .expect(200);

    const employeeCode = `REC-${suffix}`;
    await request(app.getHttpServer())
      .post(
        `/api/v1/recruitment/applications/${applicationId}/convert-to-employee`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode,
        joiningDate: '2035-04-01',
        departmentId,
        employmentType: 'FULL_TIME',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.data.employee).toEqual(
          expect.objectContaining({
            employeeCode,
            firstName: 'Recruit',
          }),
        );
        expect(response.body.data.application).toEqual(
          expect.objectContaining({ status: 'HIRED' }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/recruitment/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'HIRED', search: 'Recruit' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: applicationId, status: 'HIRED' }),
          ]),
        );
      });
  });

  it('manages sales leads, opportunities, quotations, and lead conversion', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();

    const employeeResponse = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeCode: `SALE-EMP-${suffix}`,
        firstName: 'Sales',
        lastName: 'Owner',
        email: `sales-owner-${suffix}@zayan.test`,
        joiningDate: '2026-06-13',
      })
      .expect(201);

    const employeeId = employeeResponse.body.data.id;

    const sourceResponse = await request(app.getHttpServer())
      .post('/api/v1/sales/lead-sources')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Website ${suffix}` })
      .expect(201);

    const sourceId = sourceResponse.body.data.id;
    const stageResponse = await request(app.getHttpServer())
      .post('/api/v1/sales/lead-stages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Qualified ${suffix}`, sortOrder: 2 })
      .expect(201);

    const stageId = stageResponse.body.data.id;
    const leadResponse = await request(app.getHttpServer())
      .post('/api/v1/sales/leads')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sourceId,
        stageId,
        name: `Sales Lead ${suffix}`,
        companyName: `Sales Company ${suffix}`,
        email: `sales-lead-${suffix}@zayan.test`,
        phone: `9777${String(suffix).slice(-6)}`,
        website: 'https://sales.example.test',
        industry: 'Technology',
        estimatedValue: 250000,
        assignedUserId: userId,
        assignedEmployeeId: employeeId,
        notes: 'Initial inbound lead',
      })
      .expect(201);

    const leadId = leadResponse.body.data.id;
    await request(app.getHttpServer())
      .post('/api/v1/sales/leads')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Duplicate Sales Lead',
        email: `sales-lead-${suffix}@zayan.test`,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/sales/leads/${leadId}/activities`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        activityType: 'CALL',
        title: 'Discovery call',
        description: 'Discussed ERP requirements',
        activityAt: '2035-04-01T10:00:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/sales/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ note: 'Interested in implementation package.' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/sales/leads/${leadId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ estimatedValue: 275000, notes: 'Updated expected value' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/sales/leads/${leadId}/assignment`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ assignedUserId: userId, assignedEmployeeId: employeeId })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/sales/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'QUALIFIED' })
      .expect(200);

    const conversionResponse = await request(app.getHttpServer())
      .post(`/api/v1/sales/leads/${leadId}/convert-to-client`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientType: 'COMPANY',
        industry: 'Technology',
        billingAddress: 'Sales billing address',
      })
      .expect(201);

    const clientId = conversionResponse.body.data.client.id;
    expect(conversionResponse.body.data.lead).toEqual(
      expect.objectContaining({
        id: leadId,
        status: 'WON',
        convertedClientId: clientId,
      }),
    );

    const opportunityStageResponse = await request(app.getHttpServer())
      .post('/api/v1/sales/opportunity-stages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `Proposal ${suffix}`, sortOrder: 3 })
      .expect(201);

    const opportunityStageId = opportunityStageResponse.body.data.id;
    const opportunityResponse = await request(app.getHttpServer())
      .post('/api/v1/sales/opportunities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        leadId,
        clientId,
        stageId: opportunityStageId,
        name: `ERP Opportunity ${suffix}`,
        expectedValue: 275000,
        probability: 60,
        expectedCloseDate: '2035-05-01',
        assignedUserId: userId,
        assignedEmployeeId: employeeId,
      })
      .expect(201);

    const opportunityId = opportunityResponse.body.data.id;
    await request(app.getHttpServer())
      .patch(`/api/v1/sales/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ probability: 75 })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/sales/opportunities/${opportunityId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'WON' })
      .expect(200);

    const quotationResponse = await request(app.getHttpServer())
      .post('/api/v1/sales/quotations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        opportunityId,
        leadId,
        clientId,
        quotationNumber: `Q-${suffix}`,
        title: `ERP Quotation ${suffix}`,
        validUntil: '2035-06-01',
        terms: 'Valid for 30 days',
        items: [
          {
            description: 'ERP implementation',
            quantity: 1,
            unitPrice: 250000,
            taxAmount: 45000,
          },
          {
            description: 'Training',
            quantity: 2,
            unitPrice: 12500,
            discountAmount: 5000,
          },
        ],
      })
      .expect(201);

    const quotationId = quotationResponse.body.data.id;
    expect(Number(quotationResponse.body.data.grandTotal)).toBe(315000);

    await request(app.getHttpServer())
      .post(`/api/v1/sales/quotations/${quotationId}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ versionNumber: 2, metadata: { reason: 'commercial revision' } })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/sales/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'SENT' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/sales/leads')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'WON', search: `Sales Lead ${suffix}` })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: leadId, status: 'WON' }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/sales/quotations')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'SENT', clientId })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: quotationId, status: 'SENT' }),
          ]),
        );
      });
  });

  it('manages invoice billing, receipts, notes, summaries, and quotation conversion', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const suffix = Date.now();

    const clientResponse = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'COMPANY',
        name: `Billing Client ${suffix}`,
        email: `billing-client-${suffix}@zayan.test`,
        phone: `9666${String(suffix).slice(-6)}`,
        billingAddress: 'Billing test address',
      })
      .expect(201);

    const clientId = clientResponse.body.data.id;
    const seriesResponse = await request(app.getHttpServer())
      .post('/api/v1/billing/invoice-series')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `FY 2035 Billing ${suffix}`,
        prefix: 'INV-',
        nextNumber: 1,
        padding: 5,
        financialYear: '2035-36',
        isDefault: true,
      })
      .expect(201);

    const seriesId = seriesResponse.body.data.id;
    const invoiceNumber = `INV-${suffix}`;
    const invoiceResponse = await request(app.getHttpServer())
      .post('/api/v1/billing/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        seriesId,
        invoiceNumber,
        title: `Implementation Invoice ${suffix}`,
        issueDate: '2035-06-01',
        dueDate: '2035-06-30',
        taxMetadata: { gstRate: 18 },
        discountMetadata: { campaign: 'launch' },
        items: [
          {
            description: 'Implementation services',
            quantity: 1,
            unitPrice: 100000,
            taxAmount: 18000,
            discountAmount: 5000,
            taxMetadata: { gstRate: 18 },
            discountMetadata: { type: 'commercial' },
          },
        ],
      })
      .expect(201);

    const invoiceId = invoiceResponse.body.data.id;
    expect(Number(invoiceResponse.body.data.grandTotal)).toBe(113000);

    await request(app.getHttpServer())
      .post('/api/v1/billing/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        invoiceNumber,
        issueDate: '2035-06-01',
        items: [{ description: 'Duplicate', quantity: 1, unitPrice: 1 }],
      })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/api/v1/billing/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'Updated billing note', terms: 'Net 30' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/billing/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200)
      .expect((response) => {
        expect(response.body.data.status).toBe('ISSUED');
      });

    await request(app.getHttpServer())
      .post('/api/v1/billing/payment-receipts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        receiptNumber: `RCT-${suffix}`,
        receiptDate: '2035-06-10',
        amount: 40000,
        paymentMode: 'UPI',
        referenceNumber: `UPI-${suffix}`,
        allocations: [{ invoiceId, amount: 40000 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/billing/credit-notes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        invoiceId,
        creditNoteNumber: `CN-${suffix}`,
        amount: 1000,
        reason: 'Goodwill credit metadata',
        metadata: { source: 'e2e' },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/billing/debit-notes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        invoiceId,
        debitNoteNumber: `DN-${suffix}`,
        amount: 500,
        reason: 'Additional charge metadata',
        metadata: { source: 'e2e' },
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/billing/receivables/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(Number(response.body.data.outstandingAmount)).toBeGreaterThan(0);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/billing/clients/${clientId}/statement`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.invoices).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: invoiceId })]),
        );
        expect(response.body.data.creditNotes).toHaveLength(1);
        expect(response.body.data.debitNotes).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .get('/api/v1/billing/receivables/aging')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.totalOutstanding).toBeGreaterThan(0);
      });

    const quotationResponse = await request(app.getHttpServer())
      .post('/api/v1/sales/quotations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        quotationNumber: `QB-${suffix}`,
        title: `Billing Conversion Quote ${suffix}`,
        validUntil: '2035-07-01',
        items: [
          {
            description: 'Converted service',
            quantity: 2,
            unitPrice: 25000,
            taxAmount: 9000,
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/api/v1/billing/quotations/${quotationResponse.body.data.id}/convert-to-invoice`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        invoiceNumber: `INV-Q-${suffix}`,
        issueDate: '2035-06-15',
        dueDate: '2035-07-15',
        seriesId,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            clientId,
            quotationId: quotationResponse.body.data.id,
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/billing/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ search: invoiceNumber, clientId })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: invoiceId,
              status: 'PARTIALLY_PAID',
            }),
          ]),
        );
      });
  });

  it('manages approval workflows, requests, actions, pending approvals, and entity history', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;
    const userId = loginResponse.body.data.user.id;
    const suffix = Date.now();

    const workflowResponse = await request(app.getHttpServer())
      .post('/api/v1/approvals/workflows')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        key: `invoice-approval-${suffix}`,
        name: `Invoice Approval ${suffix}`,
        description: 'E2E approval workflow',
        module: 'billing',
        entityType: 'INVOICE',
        isDefault: true,
        steps: [
          {
            stepOrder: 1,
            name: 'Admin approval',
            approverType: 'USER',
            approverUserId: userId,
            escalationAfterHours: 24,
            escalationMetadata: { channel: 'metadata-only' },
          },
        ],
      })
      .expect(201);

    const workflowId = workflowResponse.body.data.id;
    expect(workflowResponse.body.data.steps).toHaveLength(1);

    await request(app.getHttpServer())
      .post('/api/v1/approvals/workflows')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        key: `invoice-approval-${suffix}`,
        name: 'Duplicate workflow',
        entityType: 'INVOICE',
        steps: [
          {
            stepOrder: 1,
            name: 'Duplicate approval',
            approverType: 'ADMIN',
          },
        ],
      })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/api/v1/approvals/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Updated approval workflow' })
      .expect(200);

    const entityId = `invoice-${suffix}`;
    const requestResponse = await request(app.getHttpServer())
      .post('/api/v1/approvals/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workflowDefinitionId: workflowId,
        entityType: 'INVOICE',
        entityId,
        title: `Approve invoice ${suffix}`,
        description: 'Approval request e2e',
        metadata: { source: 'e2e' },
      })
      .expect(201);

    const approvalRequestId = requestResponse.body.data.id;
    expect(requestResponse.body.data.status).toBe('PENDING');

    const requestsListResponse = await request(app.getHttpServer())
      .get('/api/v1/approvals/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'PENDING', entityType: 'INVOICE', entityId })
      .expect(200);

    const stepInstanceId =
      requestsListResponse.body.data[0].stepInstances[0].id;
    await request(app.getHttpServer())
      .get('/api/v1/approvals/pending')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ entityType: 'INVOICE', entityId })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: stepInstanceId }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/approvals/requests/${approvalRequestId}/approve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ stepInstanceId, comment: 'Approved in e2e' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.request.status).toBe('APPROVED');
        expect(response.body.data.step.status).toBe('APPROVED');
      });

    await request(app.getHttpServer())
      .get(`/api/v1/approvals/history/INVOICE/${entityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.requests).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: approvalRequestId }),
          ]),
        );
        expect(response.body.data.actions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ action: 'APPROVE' }),
          ]),
        );
      });

    const rejectedRequestResponse = await request(app.getHttpServer())
      .post('/api/v1/approvals/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workflowDefinitionId: workflowId,
        entityType: 'QUOTATION',
        entityId: `quotation-${suffix}`,
        title: `Reject quotation ${suffix}`,
      })
      .expect(201);

    const rejectedListResponse = await request(app.getHttpServer())
      .get('/api/v1/approvals/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ entityType: 'QUOTATION', entityId: `quotation-${suffix}` })
      .expect(200);

    await request(app.getHttpServer())
      .patch(
        `/api/v1/approvals/requests/${rejectedRequestResponse.body.data.id}/reject`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        stepInstanceId: rejectedListResponse.body.data[0].stepInstances[0].id,
        comment: 'Rejected in e2e',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.request.status).toBe('REJECTED');
      });

    const delegatedRequestResponse = await request(app.getHttpServer())
      .post('/api/v1/approvals/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workflowDefinitionId: workflowId,
        entityType: 'CUSTOM',
        entityId: `custom-${suffix}`,
        title: `Delegate custom approval ${suffix}`,
      })
      .expect(201);

    const delegatedListResponse = await request(app.getHttpServer())
      .get('/api/v1/approvals/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ entityType: 'CUSTOM', entityId: `custom-${suffix}` })
      .expect(200);

    const delegatedStepId =
      delegatedListResponse.body.data[0].stepInstances[0].id;

    await request(app.getHttpServer())
      .patch(
        `/api/v1/approvals/requests/${delegatedRequestResponse.body.data.id}/delegate`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        stepInstanceId: delegatedStepId,
        delegatedToUserId: userId,
        comment: 'Delegate metadata only',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.delegatedToUserId).toBe(userId);
      });

    await request(app.getHttpServer())
      .patch(
        `/api/v1/approvals/requests/${delegatedRequestResponse.body.data.id}/cancel`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ comment: 'Cancelled in e2e' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.status).toBe('CANCELLED');
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/approvals/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('reads dashboard summaries and manages report export request metadata', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    const accessToken = loginResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ fromDate: '2035-01-01', toDate: '2035-12-31' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            employees: expect.objectContaining({
              total: expect.any(Number),
              active: expect.any(Number),
            }),
            finance: expect.objectContaining({
              outstandingReceivables: expect.any(Number),
            }),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/hr')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            employees: expect.objectContaining({
              total: expect.any(Number),
              active: expect.any(Number),
            }),
            departmentsCount: expect.any(Number),
            todayAttendance: expect.any(Object),
            leaveRequests: expect.any(Object),
            upcomingHolidays: expect.any(Array),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/projects-tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            activeProjects: expect.any(Number),
            overdueTasks: expect.any(Number),
            taskStatusCounts: expect.any(Object),
            myTasks: expect.any(Object),
            projectProgress: expect.any(Array),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/crm-sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            totalClients: expect.any(Number),
            activeClients: expect.any(Number),
            leadsByStage: expect.any(Array),
            quotationSummary: expect.any(Object),
            recentClientActivities: expect.any(Array),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/finance')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            expenses: expect.any(Object),
            vendorBills: expect.any(Object),
            payroll: expect.any(Object),
            pettyCash: expect.any(Object),
            outstandingReceivables: expect.any(Object),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/inventory-assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            lowStockItems: expect.any(Array),
            assetAssignments: expect.any(Object),
            maintenanceDue: expect.any(Object),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/helpdesk')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            openTickets: expect.any(Number),
            urgentTickets: expect.any(Number),
            slaBreachedTickets: expect.any(Object),
            ticketsByCategory: expect.any(Array),
            ticketsByStatus: expect.any(Object),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/approvals')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            myPendingApprovals: expect.any(Number),
            companyPendingApprovals: expect.any(Number),
            recentApprovalActions: expect.any(Array),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/calendar')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            todayEvents: expect.any(Array),
            upcomingMeetings: expect.any(Array),
            resourceBookings: expect.any(Array),
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/reports/registry')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              reportType: 'hr_summary',
              permissionKey: 'reports.view',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/reports/metadata/hr_summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.objectContaining({
            reportType: 'hr_summary',
            availableFilters: expect.any(Array),
          }),
        );
      });

    const exportResponse = await request(app.getHttpServer())
      .post('/api/v1/reports/export-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        reportType: 'hr_summary',
        requestedFilters: {
          fromDate: '2035-01-01',
          toDate: '2035-12-31',
        },
        format: 'CSV',
      })
      .expect(201);

    expect(exportResponse.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        reportType: 'hr_summary',
        format: 'CSV',
        status: 'PENDING',
        fileName: null,
        storageKey: null,
      }),
    );

    await request(app.getHttpServer())
      .get('/api/v1/reports/export-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ reportType: 'hr_summary', format: 'CSV' })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: exportResponse.body.data.id }),
          ]),
        );
        expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
      });
  });

  it('supports password change, password reset metadata, and logout-all sessions', async () => {
    const firstLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password123' })
      .expect(201);

    expect(firstLogin.body.data.sessionId).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'admin@zayan.test' })
      .expect(201)
      .expect((response) => {
        expect(response.body.data).toEqual({
          resetRequested: true,
          delivery: 'metadata_only',
        });
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${firstLogin.body.data.accessToken}`)
      .send({
        currentPassword: 'Password123',
        newPassword: 'Password456',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.data).toEqual({ passwordChanged: true });
      });

    const secondLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password456' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${secondLogin.body.data.accessToken}`)
      .expect(201)
      .expect((response) => {
        expect(response.body.data).toEqual({ loggedOutAllSessions: true });
      });

    const restoreLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@zayan.test', password: 'Password456' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${restoreLogin.body.data.accessToken}`)
      .send({
        currentPassword: 'Password456',
        newPassword: 'Password123',
      })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });
});
