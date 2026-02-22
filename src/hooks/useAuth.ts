import { useState, useCallback, useEffect, useRef } from 'react';
import { startBankId, pollJwt } from '../api/auth';
import { listCompanies, selectCompany } from '../api/company';
import type { Company } from '../api/company';
import { setAuthToken, setCompanyId } from '../api/client';
import type { BankIdQrData } from '../components/Login/Login';

const STORAGE_KEY_JWT = 'wint-jwt';
const STORAGE_KEY_EMPLOYEE = 'wint-employee';
const STORAGE_KEY_COMPANY = 'wint-company';
const STORAGE_KEY_COMPANIES = 'wint-companies';

export interface EmployeeInfo {
  id: number;
  name: string;
}

interface AuthState {
  jwt: string | null;
  employee: EmployeeInfo | null;
  companyId: string | null;
  companyName: string | null;
  companies: Company[];
  isLoggingIn: boolean;
  loginStatus: string;
  bankIdQr: BankIdQrData | null;
  login: () => void;
  cancelLogin: () => void;
  logout: () => void;
  switchCompany: (company: Company) => Promise<void>;
}

/** Build the full QR data string from server-provided components */
function buildQrData(qrStartToken: string, qrTime: string, qrAuthCode: string): string {
  return `bankid.${qrStartToken}.${qrTime}.${qrAuthCode}`;
}

export function useAuth(): AuthState {
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_JWT));
  const [employee, setEmployee] = useState<EmployeeInfo | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_EMPLOYEE);
    return stored ? JSON.parse(stored) as EmployeeInfo : null;
  });
  const [companyId, setCompanyIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY_COMPANY),
  );
  const [companies, setCompanies] = useState<Company[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_COMPANIES);
    return stored ? JSON.parse(stored) as Company[] : [];
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  const [bankIdQr, setBankIdQr] = useState<BankIdQrData | null>(null);
  const cancelledRef = useRef(false);

  const companyName = companies.find((c) => String(c.Id) === companyId)?.Name ?? null;

  // Restore auth headers on mount
  useEffect(() => {
    if (jwt) setAuthToken(jwt);
    if (companyId) setCompanyId(companyId);
  }, [jwt, companyId]);

  const cancelLogin = useCallback(() => {
    cancelledRef.current = true;
    setIsLoggingIn(false);
    setLoginStatus('');
    setBankIdQr(null);
  }, []);

  const login = useCallback(async () => {
    cancelledRef.current = false;
    setIsLoggingIn(true);
    setLoginStatus('');
    setBankIdQr(null);

    try {
      const session = await startBankId();
      if (cancelledRef.current) return;

      // Set initial QR from start response
      setBankIdQr({
        qrData: buildQrData(session.qrStartToken, session.qrTime, session.qrAuthCode),
        autoStartToken: session.autoStartToken,
      });

      // Poll for JWT — each poll returns updated QR data
      const result = await new Promise<{ jwt: string; employeeId?: number; name?: string }>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 200; // ~60 seconds at 300ms intervals

        const poll = async () => {
          if (cancelledRef.current) {
            reject(new Error('Cancelled'));
            return;
          }
          try {
            const resp = await pollJwt(session.signId);
            if (cancelledRef.current) {
              reject(new Error('Cancelled'));
              return;
            }

            if (resp.status === 'complete') {
              resolve({ jwt: resp.jwt, employeeId: resp.employeeId, name: resp.name });
              return;
            }

            // Update QR code with latest server-provided data
            setBankIdQr({
              qrData: buildQrData(resp.qrStartToken, resp.qrTime, resp.qrAuthCode),
              autoStartToken: session.autoStartToken,
            });

            attempts++;
            if (attempts >= maxAttempts) {
              reject(new Error('BankID timeout — försök igen'));
              return;
            }
            setTimeout(poll, 1000); // Poll every second (QR updates per second)
          } catch (err) {
            reject(err);
          }
        };
        poll();
      });

      if (cancelledRef.current) return;

      // Store JWT and set up client
      setAuthToken(result.jwt);
      localStorage.setItem(STORAGE_KEY_JWT, result.jwt);
      setJwt(result.jwt);
      setBankIdQr(null);

      // Get employee info from JWT or poll response
      let empId = result.employeeId;
      let empName = result.name;
      if (!empId) {
        try {
          const payload = JSON.parse(atob(result.jwt.split('.')[1]!));
          empId = Number(payload.employeeId ?? payload.sub);
          empName = empName ?? payload.name ?? 'Användare';
        } catch {
          empId = 0;
          empName = 'Användare';
        }
      }

      const emp: EmployeeInfo = { id: empId ?? 0, name: empName ?? 'Användare' };
      setEmployee(emp);
      localStorage.setItem(STORAGE_KEY_EMPLOYEE, JSON.stringify(emp));

      // List companies and auto-select
      setLoginStatus('Väljer företag...');
      const companyList = await listCompanies();
      if (cancelledRef.current) return;

      setCompanies(companyList);
      localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(companyList));

      if (companyList.length > 0) {
        const company = companyList[0]!;
        await selectCompany(company.Id);
        const id = String(company.Id);
        setCompanyId(id);
        setCompanyIdState(id);
        localStorage.setItem(STORAGE_KEY_COMPANY, id);
      }
    } catch (err) {
      if (cancelledRef.current) return;
      setLoginStatus(`Fel: ${err instanceof Error ? err.message : 'Okänt fel'}`);
      setBankIdQr(null);
      setTimeout(() => setLoginStatus(''), 5000);
    } finally {
      if (!cancelledRef.current) {
        setIsLoggingIn(false);
      }
    }
  }, []);

  const switchCompany = useCallback(async (company: Company) => {
    await selectCompany(company.Id);
    const id = String(company.Id);
    setCompanyId(id);
    setCompanyIdState(id);
    localStorage.setItem(STORAGE_KEY_COMPANY, id);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setCompanyId(null);
    setJwt(null);
    setEmployee(null);
    setCompanyIdState(null);
    setCompanies([]);
    setBankIdQr(null);
    localStorage.removeItem(STORAGE_KEY_JWT);
    localStorage.removeItem(STORAGE_KEY_EMPLOYEE);
    localStorage.removeItem(STORAGE_KEY_COMPANY);
    localStorage.removeItem(STORAGE_KEY_COMPANIES);
  }, []);

  return {
    jwt, employee, companyId, companyName, companies, isLoggingIn, loginStatus,
    bankIdQr, login, cancelLogin, logout, switchCompany,
  };
}
