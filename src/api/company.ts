import { apiRequest } from './client';

interface PaginatedResponse<T> {
  Items: T[];
  TotalItems: number;
  NumPerPage: number;
  Page: number;
}

export interface Company {
  Id: number;
  Name: string;
  Org: string;
  Url: string;
  IsTimeReportingEnabled: boolean;
}

export interface CompanyDetail extends Company {
  LockDate: string;
  LoggedInUserIsAllowedToReportTime: boolean;
  FinancialYears: Array<{
    Id: number;
    Start: string;
    End: string;
  }>;
}

export async function listCompanies(): Promise<Company[]> {
  const res = await apiRequest<PaginatedResponse<Company>>(
    '/Company?isAutoPaginating=true&includeSummary=false',
  );
  return res.Items;
}

export async function selectCompany(companyId: number): Promise<void> {
  await apiRequest('/Company/Selected', {
    method: 'POST',
    body: { companyId },
  });
}

export async function getCompanyDetail(companyId: number): Promise<CompanyDetail> {
  return apiRequest<CompanyDetail>(`/Company/${companyId}`);
}
