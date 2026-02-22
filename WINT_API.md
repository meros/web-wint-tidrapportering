# Wint.se API Documentation

Base URL: `https://api.wint.se`
Frontend: `https://app.wint.se`
Server: Microsoft-IIS/10.0 / ASP.NET (Azure, IP 13.79.6.12)
Rate limit: 1000 requests/minute (`x-rate-limit-limit: 1m`)

---

## Technology Stack (Deduced)

### Backend
- **ASP.NET Web API** on **IIS 10.0** (C#/.NET)
- PascalCase JSON properties, standard .NET pagination patterns
- Azure-hosted (Application Insights: `appId=cid-v1:00000000-0000-0000-0000-000000000000`)
- Rate limiting via `x-rate-limit-*` headers (likely AspNetCoreRateLimit)
- CORS configured per-origin (`access-control-allow-origin: https://app.wint.se`)

### Frontend
- **React SPA** (Create React App build pattern: `static/js/main.73f882a5.js`)
- PWA with manifest.json
- Sentry SDK v9.46.0 for error tracking (org: `o0000000000000000`, region: `de`)
- Client identifier: `wint-client-web` v0.2.258
- Axios-based HTTP client (stack traces show `d.request`, `r.forEach.d.<computed>` patterns)

---

## Common Headers

All API calls include:

| Header | Value | Notes |
|--------|-------|-------|
| `wint-client` | `wint-client-web` | Client identifier |
| `wint-client-version` | `0.2.258` | App version |
| `origin` | `https://app.wint.se` | CORS origin |

After authentication, add:

| Header | Value | Notes |
|--------|-------|-------|
| `Authorization` | `Bearer <jwt>` | JWT from BankID flow |

After company selection, add:

| Header | Value | Notes |
|--------|-------|-------|
| `companyid` | `12345` | Numeric company ID |
| `x-wint-capabilities` | `ReceiptPaymentMethodNullability` | Feature capability flags |

---

## Common Pagination Wrapper

Most list endpoints use a shared pagination pattern:

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `isAutoPaginating` | bool | Auto-paginate (30/page) vs manual |
| `numPerPage` | int | Items per page (when not auto) |
| `page` | int | Page number (0-indexed) |
| `orderByDescending` | bool | Primary sort direction |
| `orderByProperty` | string | Primary sort field |
| `thenByDescending` | bool | Secondary sort direction |
| `thenByProperty` | string | Secondary sort field |
| `includeSummary` | bool | Return summary totals instead of items |

**Response wrapper:**
```json
{
  "Items": [...],
  "NumPerPage": 30,
  "Page": 0,
  "SummaryItem": null,
  "TotalItems": 1,
  "TotalItemsWithOutFilter": 0
}
```

When `includeSummary=true`, `Items` is `null` and `SummaryItem` contains aggregated totals.

---

## 1. Authentication (BankID)

### POST /api/BankIdAuth/start

Start a BankID authentication session. No auth required.

**Request:** Empty body (content-length: 0)

**Response** (200) — PascalCase, wrapped in `{InProgress, BankIdData, LoginInfo}`:
```json
{
  "InProgress": true,
  "BankIdData": {
    "SignId": "e3a66eb5-32fc-486d-bd18-30f43f7343a7",
    "AutoStartToken": "880c6fe0-...",
    "QRStartToken": "c3732fd7-...",
    "Time": "0",
    "QRAuthCode": "f095a006..."
  },
  "LoginInfo": null
}
```
> **Verified from HAR.** The server pre-computes `QRAuthCode` — no `qrStartSecret` is returned.
> QR data string format: `bankid.<QRStartToken>.<Time>.<QRAuthCode>`
> BankID autostart URL: `bankid:///?autostarttoken=<AutoStartToken>&redirect=null`

### GET /api/BankIdAuth/jwt/{SignId}

Poll for JWT token. Call every ~1s until auth completes. No auth required.
Each poll returns updated QR data (Time increments, QRAuthCode changes).

**Pending response** (200):
```json
{
  "InProgress": true,
  "BankIdData": {
    "SignId": "e3a66eb5-...",
    "AutoStartToken": "880c6fe0-...",
    "QRStartToken": "c3732fd7-...",
    "Time": "3",
    "QRAuthCode": "updated-auth-code..."
  },
  "LoginInfo": null
}
```

**Success response** (200):
```json
{
  "InProgress": false,
  "BankIdData": null,
  "LoginInfo": {
    "AuthTokens": {
      "AccessToken": "eyJhbGciOiJIUzI1N...",
      "RefreshToken": "a8806643-4487-42d2-..."
    },
    "PersonId": 10001,
    "Name": "Anna Andersson"
  }
}
```
> **Verified from HAR.** JWT is at `LoginInfo.AuthTokens.AccessToken`, NOT `LoginInfo.Jwt`.
> Employee ID is `LoginInfo.PersonId`, NOT `LoginInfo.EmployeeId`.
> Token expiry is indicated by 401 with header `token-expired: true` and
> `www-authenticate: Bearer error="invalid_token"`. No refresh endpoint observed yet.

---

## 2. Company

### GET /api/Company

List companies the authenticated user belongs to.

**Query:** Standard pagination params + `includeSummary=false`

**Response item:**
```json
{
  "Id": 12345,
  "Name": "Acme Consulting AB",
  "Org": "556677-8899",
  "Url": "acme.consulting.ab",
  "IsPaymentPaused": false,
  "NoVat": false,
  "ReportsAvailable": false,
  "IsTimeReportingEnabled": false,
  "LoggedInUserIsSalaryAdmin": false,
  "LoggedInUserIsProjectManager": false
  // ... many more boolean permission fields (all false/null in list mode)
}
```

### POST /api/Company/Selected

Select a company for the session. After this, include `companyid` header on all requests.

**Request:**
```json
{"companyId": 12345}
```

**Response** (200): Empty body

### GET /api/Company/{companyId}

Full company details with all permissions, dimensions, financial years, etc.

**Response** (200, ~8262 bytes): Full company object. Key fields:
```json
{
  "Id": 12345,
  "Name": "Acme Consulting AB",
  "Org": "556677-8899",
  "Url": "acme.consulting.ab",
  "RelationFlags": 1522499580,
  "IsTimeReportingEnabled": true,
  "LoggedInUserIsProjectManager": true,
  "LoggedInUserIsAllowedToReportTime": true,
  "LoggedInUserIsSalaryAdmin": true,
  "LoggedInUserIsDeviationAdmin": true,
  "ReceiptCreator": true,
  "InvoiceCreator": true,
  "SupplierInvoiceCreator": true,
  "ReportsAvailable": true,
  "IsSelfInvoicingEnabled": true,
  "IsBusinessUnitsEnabled": false,
  "IsDebtCollectionEnabled": false,
  "PageroEInvoice": false,
  "IsRegisteredAtPagero": true,
  "HasROT": false,
  "HasRUT": false,
  "LockDate": "2025-04-30T00:00:00",
  "ReconciliationDate": "2025-04-30T00:00:00",
  "DefaultInvoicePaymentTerms": 30,
  "InvoiceDimensionTypes": [
    {"Name": "Ansvarig manager", "Id": "uuid", "Type": 12},
    {"Name": "Tidrapportering anställd", "Id": "uuid", "Type": 13},
    {"Name": "Grupp", "Id": "uuid", "Type": 11},
    {"Name": "Projekt", "Id": "uuid", "Type": 2}
  ],
  "FinancialYears": [
    {"Id": 74734, "Start": "2023-12-13T00:00:00", "End": "2025-04-30T00:00:00"},
    {"Id": 78978, "Start": "2025-05-01T00:00:00", "End": "2026-04-30T00:00:00"},
    {"Id": 87322, "Start": "2026-05-01T00:00:00", "End": "2027-04-30T00:00:00"}
  ],
  "ReceiptCategories": [
    {"Id": 133090, "Name": "Representation", "Type": 0, "CategoryType": 0},
    {"Id": 133091, "Name": "Bilkostnader", "Type": 1, "CategoryType": 1},
    {"Id": 133092, "Name": "Kontorsinredning/Teknik", "Type": 2, "CategoryType": 2}
    // ... 16 categories total
  ],
  "ReceiptPaymentMethods": {
    "10001": [
      {"Id": 19010, "Name": "Eget utlägg", "Type": 2},
      {"Id": 29665, "Name": "Wintkort - 1234", "Type": 5},
      {"Id": 34747, "Name": "Saknat underlag", "Type": 6}
    ]
  },
  "AllowedDeviationTypes": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14],
  "LoggedInUserWintEmail": "12345_10001@underlag.wint.se",
  "LoggedInUserSelfInvoiceEmail": "selfinvoice_12345_10001@underlag.wint.se",
  "VisitorAddress": {"ZipCode": "111 22", "Street1": "Storgatan 1", "City": "Malmö", "Country": "SE"},
  "BillingAddress": {"ZipCode": "105 69", "Street1": "Kund-id XXXXX, FE nr 000", "City": "Stockholm", "Country": "SE"}
}
```

---

## 3. User & Profile

### GET /api/User/ProfileToggles

```json
{
  "ShownIntroductions": ["home-index", "web3-index"],
  "ShownHelps": ["home-index", "receipt-index", "web3-index"]
}
```

### GET /api/User/DefaultTodoGroupType

Returns bare integer: `0`

### GET /api/ProfileImages/{userId}

Returns profile image or 204 if none set.

### GET /api/Settings/Profile

```json
{
  "Mail": "anna.andersson@example.com",
  "Name": "Anna Andersson",
  "Phone": "+46701234567",
  "SelectedLanguage": "sv",
  "BankAccount": "1234567890",
  "BankAccountClearing": "54321",
  "IncludeOverdueInvoices": true,
  "NoDailyMailOnWeekends": false,
  "TableSize": 0,
  "ProfileImage": null,
  "PaymentMethods": [
    {"Id": 19010, "Name": "Eget utlägg", "Type": 2, "Amount": 0.0, "IsActive": true},
    {"Id": 29665, "Name": "Wintkort - 1234", "Type": 5, "Amount": 0.0, "IsActive": true},
    {"Id": 34747, "Name": "Saknat underlag", "Type": 6, "Amount": 0.0, "IsActive": true}
  ],
  "CompanySpecificEmails": [
    {"CompanyId": 12345, "PersonId": 10001, "CompanyName": "Acme Consulting AB", "Email": null}
  ]
}
```

---

## 4. Employees

### GET /api/Employees/{id}

```json
{
  "Id": 10001,
  "Name": "Anna Andersson",
  "Pno": "900101-1234",
  "Mail": "anna.andersson@example.com",
  "Phone": "+46701234567",
  "SupplierInvoicesAvalible": true,
  "BusinessUnitId": null,
  "ProfileImage": null,
  "SalarySettings": {
    "IsActive": true,
    "BankAccount": "1234567890",
    "BankAccountClearing": "54321",
    "TaxTable": 33,
    "EmploymentStartDate": "2024-01-01T00:00:00",
    "EmploymentEndDate": null,
    "MonthlySalary": 45000.0,
    "EmploymentRate": 100.0,
    "WorkPlaceStreetAddress": "Storgatan 1",
    "WorkPlaceCity": "Malmö",
    "Position": "Konsult",
    "VacationConditions": 30,
    "WorkType": 0,
    "UsualWorkHours": 40.0
  },
  "Permissions": {
    "CEO": false, "Contact": true, "Employee": true, "Documents": true,
    "IncomingInvoicesOverview": true, "IncomingInvoices": true,
    "InvoicesAdmin": true, "Invoices": true,
    "ReceiptsAdmin": true, "Receipts": true,
    "Admin": true, "Reports": true,
    "SalaryAdmin": true, "PaymentSignee": true,
    "DeviationAdmin": true, "Auditor": false, "Revisor": false
  },
  "TimeReportingSettings": {
    "IsTimeReportingMandatory": false,
    "TimeReportingInterval": 0
  }
}
```

### GET /api/Settings/Employee

Returns all employees with salary info and permissions.

```json
{
  "DefaultSalaryDeviationDraftReceiverName": null,
  "DefaultSalaryDeviationDraftReceiverId": null,
  "CanAddDeviationViaMobileApp": false,
  "Employees": [{ /* same shape as GET /api/Employees/{id} minus some fields */ }]
}
```

---

## 5. Feature Flags

### GET /api/Feature/{featureName}

Returns `{"IsEnabled": bool}`. Observed feature flags:

| Feature | Value |
|---------|-------|
| `WintSalaryOverviewEnabled` | `true` |
| `RouteGenericVoucherToSupplierInvoice` | `false` |
| `AutomaticReminders` | `true` |

---

## 6. Todos

### GET /api/Todo

**Query params:** `excludeSnoozed`, `numPerPage=100`, `types=0,1,2,3,5,6,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,25,26,27,28,29,32,33,34,35,36,37,38,39`

Standard paginated response.

### GET /api/Todo/TodoSummary

**Query params:** `isSnoozed=false`, `types=...` (same type list)

```json
{
  "TodosUrgencySummary": [],
  "TodosTypeSummary": [],
  "TodosGroupSummary": [],
  "TotalTodosCount": 0
}
```

---

## 7. Customer Invoices

### GET /api/Invoice/List

Paginated list. **orderByProperty:** `PostingDate`

**Response item:**
```json
{
  "Id": 2328011,
  "SerialNumber": 31,
  "OwnerId": 10001,
  "OwnerName": "Anna Andersson",
  "PostingDate": "2026-02-01T00:00:00",
  "DueDate": "2026-03-03T00:00:00",
  "CustomerId": 872295,
  "CustomerName": "Globex International AB",
  "Status": 1,
  "CreditStatus": 0,
  "Currency": "SEK",
  "TotalAmount": 32375.0,
  "TotalAmountExcludingTax": 25900.0,
  "LeftToPay": 32375.0,
  "BookedAmount": 32375.0,
  "AmountPaidSEK": 0.0,
  "PaymentState": 0,
  "ReminderInvoicesCount": 0,
  "Rot": false,
  "Rut": false,
  "FromQuotation": false,
  "FromRecurring": false
}
```

With `includeSummary=true`, returns aggregate `SummaryItem` with `TotalAmountSummary`, `LeftToPaySummary`, etc.

### GET /api/Invoice/{id}

Full invoice detail with rows, payment info, send info, warnings.

**Response** (200): Large object including:
```json
{
  "Id": 2328011,
  "Status": 1,
  "SerialNumber": 31,
  "Ocr": 202612345314,
  "PaymentTerms": 30,
  "CustomerName": "Globex International AB",
  "TotalAmount": 32375.0,
  "TotalTax": 6475.0,
  "LeftToPay": 32375.0,
  "Currency": "SEK",
  "IsTimeReportingInvoice": true,
  "InvoicePaymentBgNumber": "123-4567",
  "Rows": [
    {
      "Id": 4613234,
      "ArticleId": -1,
      "Quantity": 1.0,
      "Description": "Anna Andersson",
      "UnitPrice": 0.0,
      "Vat": 25.0,
      "Unit": {"Id": 0, "Name": ""},
      "Periodisation": false
    },
    {
      "Id": 4613229,
      "ArticleId": -1,
      "Quantity": 1.0,
      "Description": "Normaltid - 2026-01-05",
      "Unit": {"Id": 41330, "Name": "h"},
      "UnitPrice": 1400.0,
      "Vat": 25.0,
      "Periodisation": true,
      "PeriodisationStartMonth": 202601,
      "PeriodisationEndMonth": 202601
    }
    // ... more rows
  ],
  "InvoiceSendInfo": {
    "InvoiceSendMethod": 0,
    "MailOptions": {
      "Subject": null,
      "Message": null,
      "To": {"Type": 1, "Address": "info@globex.example.com,archive@example.se"}
    }
  },
  "Dimensions": ["a450af56-...", "1414ed17-..."],
  "Warnings": [{"Message": "...", "Type": 17, "Level": 2, "Category": 6}]
}
```

### GET /api/Invoice/StateLogs/{id}

```json
[
  {"Status": 0, "Date": "2026-02-01T09:07:54.02", "ChangedByName": "Anna Andersson", "Active": false},
  {"Status": 1, "Date": "2026-02-01T09:10:15.21", "ChangedByName": "Anna Andersson", "Active": true},
  {"Status": 100, "Date": "2026-03-03T00:00:00", "ChangedByName": null, "Active": false},
  {"Status": 6, "Date": null, "Active": false},
  {"Status": 4, "Date": null, "Active": false}
]
```

### GET /api/Invoice/{id}/transactions

Accounting voucher entries for the invoice.

```json
[{
  "Series": "B",
  "VoucherNumber": 32,
  "Text": "Faktura 31 - Globex International AB",
  "BookingDate": "2026-02-01T00:00:00",
  "Currency": "SEK",
  "Transactions": [
    {"Account": 3011, "AccountName": "Försäljning inom Sverige, 25 % moms", "Amount": -1400.0, "Dimensions": [...]},
    {"Account": 2611, "AccountName": "Utgående moms...", "Amount": -6475.0, "Dimensions": [...]},
    {"Account": 1510, "AccountName": "Kundfordringar", "Amount": 32375.0, "Dimensions": [...]}
  ]
}]
```

### GET /api/Invoice/{id}/pdf/{version}

```json
{
  "FileName": "Faktura - Acme Consulting AB - 31.pdf",
  "ContentType": "application/pdf",
  "Data": "<base64>"
}
```

### GET /api/Invoice/{id}/Versions

```json
[
  {"Version": 0, "CreatedDate": "2025-11-23T00:00:00", "DueDate": "2025-12-23T00:00:00", "Amount": 175013.0},
  {"Version": 1, "CreatedDate": "2025-12-30T00:00:00", "DueDate": "2026-01-29T00:00:00", "Amount": 175409.0}
]
```

### GET /api/Invoice/FindSimilar/{id}?limit=7

Returns array of similar invoices (empty if none found).

---

## 8. Incoming Invoices (Supplier Invoices)

### GET /api/IncomingInvoice

Paginated list. **orderByProperty:** `InvoiceDate`, extra param: `onlyMine=false`

**Response item:**
```json
{
  "Id": 4334612,
  "Bg": "5050-1055",
  "State": 7,
  "Supplier": {
    "Id": 427747, "Name": "Skatteverket", "Bg": "5050-1055",
    "OrgNr": "2021005448", "Street": "LIKVIDSEKTIONEN, Norrgatan 4", "City": "VÄXJÖ"
  },
  "SupplierName": "Skatteverket",
  "IsAutoInvoice": true,
  "IsTaxInvoice": true,
  "CertifyPersonName": "Anna Andersson",
  "Amount": 60566.0,
  "Tax": 0.0,
  "Currency": "SEK",
  "OCR": "1655946276623",
  "DueDate": "2026-02-12T00:00:00",
  "InvoiceDate": "2026-02-12T00:00:00",
  "IsBooked": true,
  "IsPaid": true,
  "PaymentDate": "2026-02-12T00:00:00",
  "PaymentStatus": 3,
  "LeftToPay": 0.0,
  "ImageIds": [13201110, 13201111, 13201112, 13201113],
  "Attachments": [{"Id": 13201110, "ContentType": "image/png"}]
}
```

### GET /api/IncomingInvoice/{id}

Same shape as list item but with additional `Meta` field:
```json
{
  "Meta": {
    "NumberOfImages": 4,
    "Images": [{"ImageId": 13201110, "ContentType": "image/png", "NumberOfPages": 1}]
  },
  "OCRCollisions": [],
  "AccountName": "Skattekonto"
}
```

### GET /api/IncomingInvoice/StateLogs/{id}

```json
[
  {"Status": 5, "Date": "2026-02-02T09:38:11.753"},
  {"Status": 0, "Date": "2026-02-02T09:38:12.48"},
  {"Status": 9, "Date": "2026-02-02T19:18:53.986", "ChangedByName": "Anna Andersson"},
  {"Status": 1, "Date": "2026-02-02T19:42:46.286", "ChangedByName": "Anna Andersson"},
  {"Status": 3, "Date": "2026-02-02T19:47:23.673"},
  {"Status": 7, "Date": null}
]
```

### GET /api/IncomingInvoice/Transactions/{id}

```json
[
  {
    "Series": "D", "VoucherNumber": 128,
    "Text": "Leverantörsfaktura från Skatteverket (1655946276623)",
    "Transactions": [
      {"Account": 1630, "AccountName": "Skattekonto", "Amount": 60566.0},
      {"Account": 2440, "AccountName": "Leverantörsreskontra", "Amount": -60566.0}
    ]
  },
  {
    "Series": "E", "VoucherNumber": 126,
    "Text": "Levbet. Skatteverket (4334612)",
    "Transactions": [
      {"Account": 2440, "AccountName": "Leverantörsreskontra", "Amount": 60566.0},
      {"Account": 1930, "AccountName": "Företagskonto", "Amount": -60566.0}
    ]
  }
]
```

### GET /api/IncomingInvoice/{id}/Attachments/{attachmentId}

Returns binary image (image/png).

### GET /api/IncomingInvoice/FindSimilar/{id}?limit=7

```json
[
  {"Id": 4207767, "Date": "2025-12-12", "Sender": "Skatteverket", "Amount": 60789.0, "State": 7, "Account": 4, "AccountName": "Ingen aning"},
  {"Id": 3980522, "Date": "2025-09-12", "Sender": "Skatteverket", "Amount": 63704.0, "State": 7}
]
```

### GET /api/IncomingInvoice/CheckPeriodisation

**Query:** `currency=SEK&invoiceTotalAmount=60566&invoicedDate=2026-02-12T00:00:00`

Returns bare boolean: `true`

### GET /api/IncomingInvoiceBookingTip/{id}

Account suggestions for booking a supplier invoice.

```json
{
  "Items": [
    {"Name": "Skattekonto", "Account": 1630, "IsPreSelectedAccount": true},
    {"Name": "Försäkring och skatt", "Account": 5612, "IsPreSelectedAccount": false},
    {"Name": "Övrig extern kostnad", "Account": 6990, "IsPreSelectedAccount": false}
    // ... more suggestions
  ]
}
```

---

## 9. Suppliers

### GET /api/IncomingInvoice/Suppliers?name={search}

Search suppliers by name. Standard pagination.

```json
{
  "Items": [{
    "Id": 427747, "Name": "Skatteverket", "Bg": "5050-1055", "OrgNr": "2021005448",
    "NumOfInvoices": 26, "TotalInvoicedAmount": 1470220.0, "ToPay": 0.0,
    "Street1": "LIKVIDSEKTIONEN, Norrgatan 4", "City": "VÄXJÖ", "ZipCode": "35233"
  }]
}
```

### GET /api/IncomingInvoice/Suppliers/{supplierId}

Same shape as search result item.

### GET /api/IncomingInvoice/GetSuggestedIncomingInvoiceSuppliers

```json
[
  {"Id": "443472", "Name": "Mynt AB"},
  {"Id": "406524", "Name": "Wint Accounting AB"},
  {"Id": "427747", "Name": "Skatteverket"}
]
```

### GET /api/IncomingInvoice/GetSuggestedIncomingInvoicePersons?count=5&includeSelf=true

```json
{"Items": [{"Id": "10001", "Name": "Anna Andersson"}]}
```

---

## 10. Customers & Articles

### GET /api/Customer/Common

```json
[
  {"Id": 728729, "Name": "Stellar Consulting AB", "Address": "...", "OrgNr": "556234-5678"},
  {"Id": 793142, "Name": "Nordic Tech AB", "Address": "...", "OrgNr": "556789-0123"},
  {"Id": 872295, "Name": "Globex International AB", "Address": "...", "OrgNr": "556123-4567"}
]
```

### GET /api/Article/Common

```json
[
  {
    "Id": 212188,
    "Name": "Avgår tidigare fakturerad (ref faktura #25)",
    "EUVatCategory": 0,
    "StandardPrice": -100.0,
    "Vat": 25.0,
    "Unit": {"Id": 34089, "Name": "tim"}
  }
]
```

---

## 11. Dimensions

### GET /api/Dimension

All dimensions (customers, suppliers, projects, employees). Standard pagination.

```json
{
  "Items": [
    {"Name": "Nordic Tech AB", "Id": "uuid", "TypeName": "Kund", "Type": 5},
    {"Name": "Skatteverket", "Id": "uuid", "TypeName": "Leverantör", "Type": 4},
    {"Name": "Nordic Tech — normala timmar", "Id": "uuid", "TypeName": "Projekt", "Type": 2},
    {"Name": "Anna Andersson", "Id": "uuid", "TypeName": "Anställd", "Type": 6},
    {"Name": "Anna Andersson", "Id": "uuid", "TypeName": "Tidrapportering anställd", "Type": 13}
  ]
}
```

**Dimension Types:** 2=Projekt, 4=Leverantör, 5=Kund, 6=Anställd, 11=Grupp, 12=Ansvarig manager, 13=Tidrapportering anställd

### GET /api/DimensionTypes/Invoices

### GET /api/DimensionTypes/IncomingInvoices

### GET /api/DimensionTypes/Receipts

All return arrays of `{"Name", "Id", "Type", "IsForced", "RecommendedDimensionId"}`.

### GET /api/Invoice/DimensionSuggestions

### GET /api/IncomingInvoice/DimensionSuggestions

### GET /api/Receipt/DimensionSuggestions

Return arrays of dimension UUIDs.

---

## 12. Salary

### GET /api/PersonSalary

**Query:** `yearAndMonthFrom=202602&yearAndMonthTo=202602` + pagination params

```json
{
  "Items": [{
    "Id": 132344,
    "PersonId": 10001,
    "PersonName": "Anna Andersson",
    "MonthDb": 202602,
    "PayoutDate": "2026-02-25T00:00:00",
    "MonthlySalary": 45000.0,
    "TaxesAndFees": 17291.36,
    "GrossAmount": 45000.0,
    "BenefitAmount": 0.0,
    "State": 4,
    "ViewState": 3,
    "IsSalaryActive": true
  }]
}
```

### GET /api/SalarySpecificationDocument/Filter

Paginated pay slips. **orderByProperty:** `Created`

```json
{
  "Items": [
    {"Id": 516003, "Created": "2026-02-20T01:00:51.46", "FileName": "Lönespecifikation för Anna Andersson 20260201 - 20260228.pdf"},
    {"Id": 507027, "Created": "2026-01-20T00:52:13.217", "FileName": "Lönespecifikation för Anna Andersson 20260101 - 20260131.pdf"}
    // ... 24 total
  ]
}
```

### GET /api/PersonSalary/SalarySpecificationDocument/{salaryId}

Returns binary PDF content.

---

## 13. Time Reporting

### GET /api/TimeReportingProject/Report

Project summaries for a date range.

**Query:** `from=2026-01-01T00:00:00.000&to=2026-01-31T00:00:00.000` + pagination params

```json
{
  "Items": [
    {
      "Id": "ebeb1ce1-cf05-46a4-9b06-7e57a0702896",
      "Name": "Nordic Tech — normala timmar",
      "ManagerName": "Anna Andersson",
      "NumberOfMembersInProject": 1,
      "NumberOfHoursWorked": 114.0,
      "CurrencyCode": "SEK",
      "Invoiced": 108300.0,
      "ProjectActiveState": 0
    },
    {
      "Id": "0363bfe4-eca1-4f3f-b303-2cd52cdda984",
      "Name": "Globex konsulttjänster",
      "ManagerName": "Anna Andersson",
      "NumberOfMembersInProject": 1,
      "NumberOfHoursWorked": 18.5,
      "Invoiced": 25900.0,
      "ProjectActiveState": 0
    }
  ]
}
```

### GET /api/TimeReportingProject/{projectId}

```json
{
  "Id": "ebeb1ce1-...",
  "Name": "Nordic Tech — normala timmar",
  "Description": "Löpande konsulttimmar",
  "ProjectManagerName": "Anna Andersson",
  "CustomerName": "Nordic Tech AB",
  "CustomerId": 793142,
  "IsAutoInvoicing": true,
  "Currency": "SEK",
  "StartDate": "2026-01-01T00:00:00",
  "ProjectActiveState": 0,
  "InvoiceDimensions": {"ProjectDimensionId": "ad28bfdc-..."},
  "ProjectMembers": [
    {"Name": "Anna Andersson", "Id": 10001, "StartDate": "2026-01-07T00:00:00", "EndDate": null}
  ],
  "ProjectCategories": [
    {"Id": 12542, "Name": "Normaltid", "BillingModel": 0, "DefaultHourlyRate": 850.0, "IsDefault": true}
  ],
  "ProjectCategoryMembers": [{
    "ProjectCategory": {"Id": 12542, "Name": "Normaltid"},
    "ProjectMember": {"Id": 10001, "Name": "Anna Andersson"},
    "IndividualBillingModel": 0,
    "HourlyRates": [{"Id": 28748, "HourlyRate": 0.0, "IsCurrent": true}]
  }],
  "PeriodisationEnabled": true
}
```

### GET /api/TimeReportingProject/{projectId}/HasUnInvoicedProjectTime

Returns bare boolean: `true`

### GET /api/TimeReport/Report

Detailed hierarchical time report. **NOT** paginated (returns raw array).

**Query:** `projectId={uuid}&fromDate=...&toDate=...&excludeInvoiced=false&includeAllEmployees=true&includeOnlyDeviations=false&onlyIncludeHourlyIndividualBillingModel=false`

**Response structure** (4-level tree):
```
Level 0 (type 0) - Person summary     → 114h total, 108,300 SEK invoiced
  └── Level 1 (type 1) - Project      → "Nordic Tech — normala timmar"
        └── Level 2 (type 26) - Category → "Normaltid"
              └── Level 3 (type 4) - Daily entries → "Timvis", 8h per day
```

Each node:
```json
{
  "PersonId": 10001,
  "Description": "Anna Andersson",
  "TimeReportingReportRowLevel": 0,
  "TimeReportingReportRowType": 0,
  "Columns": [{
    "FromDate": "2026-01-01T00:00:00",
    "ToDate": "2026-01-31T00:00:00",
    "ProjectTime": 114.0,
    "InvoicedAmount": 108300.0,
    "TimeReportStatus": 3,
    "TimeReportInvoiceStatus": 2,
    "UtilizationRate": 1.0,
    "Invoices": [{
      "SerialNumber": 32, "InvoiceId": 2328013,
      "Amount": 121125.0, "CustomerName": "Nordic Tech AB", "InvoiceState": 1
    }]
  }],
  "Children": [...]
}
```

Daily entries (level 3):
```json
{
  "ProjectTimeId": 546462,
  "FromDate": "2026-01-07T00:00:00",
  "ProjectTime": 8.0,
  "HourlyRate": 0.0,
  "InvoicedAmount": 7600.0,
  "CategoryId": 12542,
  "CategoryName": "Normaltid",
  "BillingModel": 0
}
```

---

## 14. Comments

### GET /api/GenericComment

**Query:** `parentId={entityId}&type={commentType}` + pagination (`orderByProperty=Created`)

| Type | Entity |
|------|--------|
| 1 | IncomingInvoice |
| 2 | Invoice |

```json
{
  "Items": [{
    "Id": 68751255,
    "AuthorId": 10001,
    "AuthorName": "Anna Andersson",
    "Created": "2026-02-01T09:10:21.59",
    "IsManual": false,
    "ParentId": 2328011,
    "Message": "Faktura 31 mailades till info@globex.example.com",
    "Type": 2
  }]
}
```

---

## 15. Report Widgets (Dashboard)

### POST /api/ReportWidget/filter/{key}

All return the same shape. Request body is `{}` or `{"type": 1|2}` or `{"onlyMine": false, "accounts": []}`.

```json
{
  "Name": "Widget Title",
  "Description": "Subtitle",
  "Key": "S1",
  "Type": 0,
  "Data": [{"StartDate": "...", "EndDate": "...", "DataPoints": [...], "Name": "...", "DataFrequency": 0}],
  "DataLabels": [...],
  "DataType": 0,
  "NumOfRecords": null
}
```

**Observed widget keys:**

| Key | Name | Body |
|-----|------|------|
| `S1` | Försäljning (month) | `{}` |
| `DS1` | Försäljning (daily) | `{"type": 1}` |
| `DS1` | Försäljning (monthly/FY) | `{"type": 2}` |
| `R3` | Rörelseresultat per räkenskapsår | `{}` |
| `R4` | Ackumulerad rörelseresultat | `{}` |
| `DC3` | Kostnader senaste 12 mån | `{}` |
| `CI1` | Fakturerat belopp (chart) | `{}` |
| `CI2` | Fördelning status (invoices) | `{}` |
| `II1` | Fördelning status (incoming) | `{}` |
| `II2` | När förfaller fakturorna? | `{"onlyMine": false, "accounts": []}` |

---

## 16. Accounting

### GET /api/Account/AccountingDoneUntil

Returns bare date string: `"2025-12-31T23:59:59"`

---

## 17. Receipts

### GET /api/Receipt/CanReceivePayouts

Returns bare boolean: `true`

### GET /api/ReceiptPaymentMethod

Standard pagination + `includeAllEmployees=false&includeCompanyIdForWintCards=true`

```json
{
  "Items": [
    {"Id": 29665, "PersonId": 10001, "Name": "Wintkort - 1234", "Type": 5, "CompanyId": 12345, "IsActive": true},
    {"Id": 34747, "PersonId": 10001, "Name": "Saknat underlag", "Type": 6, "IsActive": true},
    {"Id": 19010, "PersonId": 10001, "Name": "Eget utlägg", "Type": 2, "IsActive": true}
  ]
}
```

---

## 18. Saved Filters

### GET /api/Filter

**Query:** `types={filterType}` + pagination

| Type | Context |
|------|---------|
| 1 | Invoices |
| 2 | IncomingInvoices |
| 24 | PersonSalary |
| 26 | TimeReporting |

Returns empty paginated list for this account.

---

## 19. Business Units

### GET /api/BusinessUnits

Standard pagination. Returns empty for this company (`IsBusinessUnitsEnabled: false`).

---

## 20. Support

### GET /api/SupportCategory

```json
{
  "Items": [
    {"Id": 16, "Name": "Skatteverket"},
    {"Id": 15, "Name": "Kundfaktura"},
    {"Id": 14, "Name": "Årsbokslut/K10a"},
    {"Id": 13, "Name": "Lön"},
    {"Id": 12, "Name": "Leverantörsfaktura"},
    {"Id": 11, "Name": "Kvitton"},
    {"Id": 10, "Name": "Teknisk support"}
  ]
}
```

---

## 21. News

### GET /api/NewsArticles/GetLatest

```json
{
  "Id": "698eeee9a408eedeeac481d8",
  "Name": "Gillar du oss? Låt hela världen få veta!",
  "PublishedDate": "2026-02-13T00:00:00Z",
  "Content": "Är du nöjd med Wint? Lämna gärna en recension...",
  "Link": "https://faq-v2.wint.se/nyhet/..."
}
```

---

## 22. Content (Frontend API)

### GET /api/content?slug=status

Served by `app.wint.se` (not `api.wint.se`). Returns `[]`.

---

## Enum Reference

### Invoice Status
| Value | Meaning |
|-------|---------|
| 0 | Draft |
| 1 | Sent |
| 4 | Paid |
| 6 | Credited |
| 100 | Due date (future state) |

### IncomingInvoice State
| Value | Meaning |
|-------|---------|
| 0 | Received / Pending review |
| 1 | Approved for payment |
| 3 | Booked |
| 5 | Initial (auto-received) |
| 7 | Paid |
| 8 | Unpaid (outstanding) |
| 9 | Attested (awaiting signature) |

### IncomingInvoice PaymentStatus
| Value | Meaning |
|-------|---------|
| 0 | Unpaid |
| 3 | Paid |

### TimeReportStatus
| Value | Meaning |
|-------|---------|
| 3 | Approved/Locked |

### TimeReportInvoiceStatus
| Value | Meaning |
|-------|---------|
| 2 | Invoiced |

### BillingModel
| Value | Meaning |
|-------|---------|
| 0 | Hourly |

### ProjectActiveState
| Value | Meaning |
|-------|---------|
| 0 | Active |

### PersonSalary.State
| Value | Meaning |
|-------|---------|
| 4 | Finalized |

### PersonSalary.ViewState
| Value | Meaning |
|-------|---------|
| 3 | Completed |

### ReceiptPaymentMethod.Type
| Value | Meaning |
|-------|---------|
| 2 | Eget utlägg (own expense) |
| 5 | Wint card |
| 6 | Saknat underlag (missing documentation) |

### Dimension.Type
| Value | Meaning |
|-------|---------|
| 2 | Projekt |
| 4 | Leverantör |
| 5 | Kund |
| 6 | Anställd |
| 11 | Grupp |
| 12 | Ansvarig manager |
| 13 | Tidrapportering anställd |
