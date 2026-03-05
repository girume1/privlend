import { LoanPublic } from '../types';

export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID;
export const NETWORK = import.meta.env.VITE_NETWORK;
export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

export class AleoService {
  async getLatestBlock(): Promise<number> {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/${NETWORK}/block/height/latest`
      );

      if (!response.ok) {
        console.warn(`getLatestBlock failed: ${response.status} ${response.statusText}`);
        return 0;
      }

      const data = await response.json();

      if (typeof data === 'number') return data;

      if (typeof data?.height === 'number') return data.height;

      const parsed = Number(data);
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      console.error('Error fetching latest block:', error);
      return 0;
    }
  }

  async getLoanCounter(): Promise<number> {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_counter/0u32`
      );

      if (response.status === 404) return 0;
      if (!response.ok) return 0;

      const data = await response.text();

      const cleaned = data.replace(/['"]/g, '').replace(/u32$/i, '').trim();
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  async getLoanPublic(loanId: number): Promise<LoanPublic | null> {
    try {
      const [activeRes, ownerRes, deadlineRes] = await Promise.all([
        fetch(`${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_active/${loanId}u32`),
        fetch(`${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_owner/${loanId}u32`),
        fetch(`${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_deadline/${loanId}u32`)
      ]);

      if (!activeRes.ok || !ownerRes.ok || !deadlineRes.ok) return null;

      const activeText = await activeRes.text();
      const ownerText = await ownerRes.text();
      const deadlineText = await deadlineRes.text();

      const active = activeText.replace(/['"]/g, '').trim() === 'true';
      const owner = ownerText.replace(/['"]/g, '').trim();

      const deadlineCleaned = deadlineText.replace(/['"]/g, '').replace(/u32$/i, '').trim();
      const deadline = parseInt(deadlineCleaned, 10);

      if (!owner || isNaN(deadline)) return null;

      return {
        loan_id: loanId,
        active,
        owner,
        deadline
      };
    } catch {
      return null;
    }
  }

  async getLoansByBorrower(borrower: string, maxLoanId: number): Promise<LoanPublic[]> {
    const loans: LoanPublic[] = [];
    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan && loan.owner === borrower) loans.push(loan);
    }
    return loans;
  }

  async getExpiredLoans(currentBlock: number, maxLoanId: number): Promise<LoanPublic[]> {
    const expired: LoanPublic[] = [];
    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan && loan.active && loan.deadline < currentBlock) {
        expired.push(loan);
      }
    }
    return expired;
  }

  async getAllLoans(maxLoanId: number): Promise<LoanPublic[]> {
    const loans: LoanPublic[] = [];
    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan) loans.push(loan);
    }
    return loans;
  }
}