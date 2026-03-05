import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { AleoService } from "../utils/aleo";
import { LoanPublic, NetworkStats } from "../types";
import { TransactionManager, TransactionItem } from "../services/TransactionManager";

interface PrivLendContextType {
  service: AleoService;
  currentBlock: number;
  loanCounter: number;

  allPublicLoans: LoanPublic[];
  userLoans: LoanPublic[];

  activePublicLoans: LoanPublic[];
  expiredPublicLoans: LoanPublic[];
  settledPublicLoans: LoanPublic[];

  activeUserLoans: LoanPublic[];
  expiredUserLoans: LoanPublic[];
  settledUserLoans: LoanPublic[];

  stats: NetworkStats;
  transactionHistory: TransactionItem[];

  loading: boolean;
  refreshData: () => Promise<void>;
}

const PrivLendContext = createContext<PrivLendContextType | undefined>(undefined);

export const usePrivLend = () => {
  const ctx = useContext(PrivLendContext);
  if (!ctx) throw new Error("usePrivLend must be used inside PrivLendProvider");
  return ctx;
};

export const PrivLendProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { connected, address, requestTransactionHistory } = useWallet();

  const serviceRef = useRef<AleoService>(new AleoService());
  const service = serviceRef.current;

  const [currentBlock, setCurrentBlock] = useState(0);
  const [loanCounter, setLoanCounter] = useState(0);
  const [allPublicLoans, setAllPublicLoans] = useState<LoanPublic[]>([]);
  const [userLoans, setUserLoans] = useState<LoanPublic[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NetworkStats>({
    totalLoans: 0,
    activeLoans: 0,
    totalVolume: BigInt(0),
    avgInterestRate: 5.2
  });

  const activePublicLoans = useMemo(
    () => allPublicLoans.filter(l => l.active && currentBlock <= l.deadline),
    [allPublicLoans, currentBlock]
  );

  const expiredPublicLoans = useMemo(
    () => allPublicLoans.filter(l => l.active && currentBlock > l.deadline),
    [allPublicLoans, currentBlock]
  );

  const settledPublicLoans = useMemo(
    () => allPublicLoans.filter(l => !l.active),
    [allPublicLoans]
  );

  const activeUserLoans = useMemo(
    () => userLoans.filter(l => l.active && currentBlock <= l.deadline),
    [userLoans, currentBlock]
  );

  const expiredUserLoans = useMemo(
    () => userLoans.filter(l => l.active && currentBlock > l.deadline),
    [userLoans, currentBlock]
  );

  const settledUserLoans = useMemo(
    () => userLoans.filter(l => !l.active),
    [userLoans]
  );

  const loadTransactions = useCallback(async () => {
    if (!connected || !requestTransactionHistory) {
      setTransactionHistory([]);
      return;
    }
    const manager = new TransactionManager(requestTransactionHistory);
    const txs = await manager.load();
    setTransactionHistory(txs);
  }, [connected, requestTransactionHistory]);

  useEffect(() => {
    const pollBlock = async () => {
      try {
        const block = await service.getLatestBlock();
        setCurrentBlock(block);
      } catch {

      }
    };

    pollBlock();
    const id = setInterval(pollBlock, 6_000);
    return () => clearInterval(id);
  }, [service]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);

      const [block, counter] = await Promise.all([
        service.getLatestBlock(),
        service.getLoanCounter()
      ]);

      setCurrentBlock(block);
      setLoanCounter(counter);

      const allLoans = await service.getAllLoans(counter);
      setAllPublicLoans(allLoans);

      const activeCount = allLoans.filter(l => l.active).length;
      setStats(prev => ({
        ...prev,
        totalLoans: counter,
        activeLoans: activeCount
      }));

      if (connected && address) {
        const user = await service.getLoansByBorrower(address, counter);
        setUserLoans(user);
      } else {
        setUserLoans([]);
      }

      await loadTransactions();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  }, [service, connected, address, loadTransactions]);

  const refreshDataRef = useRef(refreshData);
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  useEffect(() => {
    refreshDataRef.current();
    const id = setInterval(() => refreshDataRef.current(), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!loading) {
      refreshDataRef.current();
    }
  }, [connected, address]);

  return (
    <PrivLendContext.Provider
      value={{
        service,
        currentBlock,
        loanCounter,

        allPublicLoans,
        userLoans,

        activePublicLoans,
        expiredPublicLoans,
        settledPublicLoans,

        activeUserLoans,
        expiredUserLoans,
        settledUserLoans,

        stats,
        transactionHistory,
        loading,
        refreshData
      }}
    >
      {children}
    </PrivLendContext.Provider>
  );
};
