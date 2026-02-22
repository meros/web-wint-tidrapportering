import { http, HttpResponse, delay } from 'msw';

/** BankID session state for test control */
let bankIdState: 'pending' | 'complete' = 'pending';
let pollCount = 0;

export function setBankIdState(state: 'pending' | 'complete') {
  bankIdState = state;
  pollCount = 0;
}

/** A minimal JWT for testing (not cryptographically valid) */
const TEST_JWT = btoa(JSON.stringify({ alg: 'HS256' })) + '.' +
  btoa(JSON.stringify({
    sub: '10001',
    employeeId: '10001',
    name: 'Test Användare',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })) + '.test-signature';

const TEST_REFRESH_TOKEN = 'test-refresh-token-abc123';

export const TEST_EMPLOYEE = { id: 10001, name: 'Test Användare' };
export const TEST_COMPANY_ID = '12345';

const handlers = [
  // BankID start — matches real Wint API PascalCase response
  http.post('/api/BankIdAuth/start', async () => {
    await delay(50);
    return HttpResponse.json({
      InProgress: true,
      BankIdData: {
        SignId: 'test-session-123',
        AutoStartToken: 'test-auto-token',
        QRStartToken: 'test-qr-token',
        Time: '0',
        QRAuthCode: 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
      },
      LoginInfo: null,
    });
  }),

  // BankID poll — matches real Wint API response shape
  http.get('/api/BankIdAuth/jwt/:signId', async () => {
    await delay(50);
    pollCount++;
    if (bankIdState === 'complete' || pollCount >= 3) {
      return HttpResponse.json({
        InProgress: false,
        BankIdData: null,
        LoginInfo: {
          AuthTokens: {
            AccessToken: TEST_JWT,
            RefreshToken: TEST_REFRESH_TOKEN,
          },
          PersonId: 10001,
          Name: 'Test Användare',
        },
      });
    }
    return HttpResponse.json({
      InProgress: true,
      BankIdData: {
        SignId: 'test-session-123',
        AutoStartToken: 'test-auto-token',
        QRStartToken: 'test-qr-token',
        Time: String(pollCount),
        QRAuthCode: `${pollCount}bcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234`.slice(0, 64),
      },
      LoginInfo: null,
    });
  }),

  // Company list
  http.get('/api/Company', async () => {
    await delay(50);
    return HttpResponse.json({
      Items: [
        {
          Id: 12345,
          Name: 'Acme Consulting AB',
          Org: '556677-8899',
          Url: 'acme.consulting.ab',
          IsTimeReportingEnabled: true,
        },
      ],
      TotalItems: 1,
      NumPerPage: 30,
      Page: 0,
    });
  }),

  // Company select
  http.post('/api/Company/Selected', async () => {
    await delay(50);
    return new HttpResponse(null, { status: 200 });
  }),

  // Company detail
  http.get('/api/Company/:id', async () => {
    await delay(50);
    return HttpResponse.json({
      Id: 12345,
      Name: 'Acme Consulting AB',
      LockDate: '2025-04-30T00:00:00',
      IsTimeReportingEnabled: true,
      LoggedInUserIsAllowedToReportTime: true,
    });
  }),

  // Time report — Filter endpoint (new, flat structure with comments)
  http.get('/api/TimeReport/Filter', async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') ?? '2026-02-16T00:00:00.000';
    const monday = new Date(startDate);

    function dayDate(offset: number): string {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      return d.toISOString().split('T')[0] + 'T00:00:00';
    }

    const timeReports = [];
    for (let i = 0; i < 7; i++) {
      const isWorkDay = i < 5;
      const projectTimes = [];

      // Solaris: 8h on weekdays
      if (isWorkDay) {
        projectTimes.push({
          ProjectId: 'proj-solaris-001',
          ProjectName: 'Solaris — normala timmar',
          Hours: 8,
          IsInternal: false,
          IsLocked: false,
          CategoryTimes: [{
            CategoryId: 12542,
            CategoryName: 'Normaltid',
            Hours: 8,
            IsLocked: false,
            InternalComment: i === 0 ? 'Jobbade med frontend' : null,
            ExternalComment: null,
          }],
        });
      }

      // Globex: 2h on Friday
      if (i === 4) {
        projectTimes.push({
          ProjectId: 'proj-globex-002',
          ProjectName: 'Globex konsulttjänster',
          Hours: 2,
          IsInternal: false,
          IsLocked: false,
          CategoryTimes: [{
            CategoryId: 11177,
            CategoryName: 'Normaltid',
            Hours: 2,
            IsLocked: false,
            InternalComment: null,
            ExternalComment: null,
          }],
        });
      }

      timeReports.push({
        TimeLogDate: dayDate(i),
        WeekDayName: i === 6 ? 0 : i + 1,
        WeekNumber: 8,
        IsWorkDay: isWorkDay,
        TotalHours: projectTimes.reduce((s, pt) => s + pt.Hours, 0),
        IsLocked: false,
        TimeReduction: 0,
        TimeReportStatus: 0,
        ProjectTimes: projectTimes,
        Deviations: [],
      });
    }

    const endDate = dayDate(6);

    return HttpResponse.json({
      EmployeeId: 10001,
      EmployeeName: 'Test Användare',
      Projects: [
        { Id: 'proj-solaris-001', Name: 'Solaris — normala timmar', IsInternal: false, Categories: [{ Id: 12542, Name: 'Normaltid', IsDefault: true }] },
        { Id: 'proj-globex-002', Name: 'Globex konsulttjänster', IsInternal: false, Categories: [{ Id: 11177, Name: 'Normaltid', IsDefault: true }] },
      ],
      Weeks: [{
        WeekStart: startDate,
        WeekEnd: endDate,
        WeekNumber: 8,
        TotalHours: 42,
        ExpectedWorkHours: 40,
        ExpectedCompHours: -2,
        WeekSegments: [{ WeekSegmentStatus: 0, WeekSegmentStart: startDate, WeekSegmentEnd: endDate }],
        LastWeekInMonthInfo: { IsLastWeekInMonth: false, Month: null },
        TimeReports: timeReports,
      }],
    });
  }),

  // Time report status (GET = read, PUT = lock/unlock)
  http.get('/api/TimeReport/Status', async () => {
    await delay(50);
    return HttpResponse.json(0); // Open
  }),

  http.put('/api/TimeReport/Status', async () => {
    await delay(50);
    return new HttpResponse(null, { status: 200 });
  }),

  // Save time report
  http.post('/api/TimeReport/MergeTimeReport', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 200 });
  }),
];

export { handlers };
