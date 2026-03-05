import { PROGRAM_ID } from "../utils/aleo";

export type TxStatus = "Pending" | "Completed" | "Failed";

export interface TransactionItem {
  id: string;
  type: string;
  status: TxStatus;
  timestamp: number;
}

export class TransactionManager {
  private requestTransactionHistory: any;

  constructor(requestTransactionHistory: any) {
    this.requestTransactionHistory = requestTransactionHistory;
  }

  async load(): Promise<TransactionItem[]> {
    if (!this.requestTransactionHistory) return [];

    try {
      const history = await this.requestTransactionHistory(PROGRAM_ID);

      if (!history) return [];
      const txList: any[] = Array.isArray(history)
        ? history
        : Array.isArray(history.transactions)
        ? history.transactions
        : [];

      if (txList.length === 0) return [];

      return txList
        .map((tx: any) => ({
          id: tx.transactionId ?? tx.id ?? "unknown",
          type: this.mapFunctionName(tx.functionName ?? tx.function),
          status: this.mapStatus(tx.status),
          timestamp: tx.timestamp || Date.now()
        }))
        .reverse();
    } catch {
      return [];
    }
  }

  private mapStatus(status: string): TxStatus {
    const s = status?.toLowerCase() || "";

    if (s.includes("completed") || s.includes("accepted")) return "Completed";
    if (s.includes("failed") || s.includes("rejected")) return "Failed";

    return "Pending";
  }

  private mapFunctionName(fn?: string): string {
    if (!fn) return "Unknown";

    if (fn.includes("create_credit_tier")) return "Create Credit Tier";
    if (fn.includes("create_loan_private")) return "Create Loan (Private)";
    if (fn.includes("register_loan_public")) return "Register Loan (Public)";
    if (fn.includes("repay_private")) return "Repay Loan (Private)";
    if (fn.includes("mark_repaid_public")) return "Mark Repaid (Public)";
    if (fn.includes("liquidate")) return "Liquidate";

    return fn;
  }
}
