import React, { useState, useRef } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { Box, Typography, Button, Fab, Dialog, DialogContent, Chip, Stack, Alert, Paper, CircularProgress } from "@mui/material";
import { Add as AddIcon, AccountBalanceWallet as WalletIcon, AssignmentTurnedIn as TierIcon } from "@mui/icons-material";
import { motion } from "framer-motion";

import VariableProximity  from "../components/VariableProximity";
import { usePrivLend } from "../context/PrivLendContext";
import { StatsDashboard } from "../components/StatsDashboard";
import { LoanCard } from "../components/LoanCard";
import { CreditTierCreator } from "../components/CreditTierCreator";
import { LoanCreationForm } from "../components/LoanCreationForm";

export const Dashboard: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const {
    activeUserLoans,
    expiredUserLoans,
    settledUserLoans,
    loading,
    refreshData
  } = usePrivLend();

  const [creditDialogOpen, setCreditDialogOpen] =
    useState(false);
  const [loanDialogOpen, setLoanDialogOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  if (!connected) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background:
            "radial-gradient(circle at 30% 20%, #1e293b, #0f172a 60%)"
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Paper
            sx={{
              p: 6,
              borderRadius: 4,
              backdropFilter: "blur(20px)",
              background: "rgba(255,255,255,0.03)",
              border:
                "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <div
              ref={containerRef}
              style={{
                position: "relative",
                display: "inline-block"
              }}
            >
              <VariableProximity
                label="Welcome to PrivLend"
                fromFontVariationSettings="'wght' 400, 'opsz' 14"
                toFontVariationSettings="'wght' 1000, 'opsz' 60"
                containerRef={containerRef}
                radius={140}
                falloff="gaussian"
                style={{
                  fontSize: "3rem",
                  color: "white"
                }}
              />
            </div>

            <Box mt={3}>
              <Typography color="text.secondary">
                Private DeFi Lending on Aleo
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              sx={{
                mt: 6,
                px: 5,
                py: 1.8,
                borderRadius: 3,
                background:
                  "linear-gradient(135deg,#6366f1,#8b5cf6)"
              }}
              onClick={() => setVisible(true)}
              startIcon={<WalletIcon />}
            >
              Connect Wallet
            </Button>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  const totalLoans =
    activeUserLoans.length +
    expiredUserLoans.length +
    settledUserLoans.length;

  const exposureCount =
    activeUserLoans.length;

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="white"
        >
          My Portfolio
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
        >
          Your private borrowing activity
        </Typography>
      </Box>

      {/* Network Stats */}
      <StatsDashboard />

      {/* Summary Chips */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Chip
          label={`Active: ${activeUserLoans.length}`}
        />
        <Chip
          label={`Expired: ${expiredUserLoans.length}`}
          color="error"
        />
        <Chip
          label={`Settled: ${settledUserLoans.length}`}
        />
        <Chip
          label={`Total: ${totalLoans}`}
        />
      </Stack>

      {/* Expired Warning */}
      {expiredUserLoans.length > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          You have{" "}
          {expiredUserLoans.length} loan(s)
          eligible for liquidation.
        </Alert>
      )}

      {/* Loans Section */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="white"
          mb={3}
        >
          My Loans
        </Typography>

        {loading ? (
          <Box textAlign="center" py={6}>
            <CircularProgress />
          </Box>
        ) : totalLoans === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              border:
                "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 4
            }}
          >
            <Typography color="text.secondary">
              No loans found.
            </Typography>

            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() =>
                setLoanDialogOpen(true)
              }
            >
              Create Your First Loan
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns:
                "repeat(auto-fill, minmax(350px, 1fr))"
            }}
          >
            {[...activeUserLoans,
              ...expiredUserLoans,
              ...settledUserLoans].map(
              loan => (
                <LoanCard
                  key={loan.loan_id}
                  loan={loan}
                  onUpdate={refreshData}
                />
              )
            )}
          </Box>
        )}
      </Box>

      {/* Floating Actions */}
      <Box
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}
      >
        <Fab
          variant="extended"
          color="secondary"
          onClick={() =>
            setCreditDialogOpen(true)
          }
        >
          <TierIcon sx={{ mr: 1 }} />
          Create Credit Tier
        </Fab>

        <Fab
          variant="extended"
          color="primary"
          onClick={() =>
            setLoanDialogOpen(true)
          }
        >
          <AddIcon sx={{ mr: 1 }} />
          New Loan
        </Fab>
      </Box>

      {/* Dialogs */}
      <CreditTierCreator
        open={creditDialogOpen}
        onClose={() =>
          setCreditDialogOpen(false)
        }
        onSuccess={refreshData}
      />

      <Dialog
        open={loanDialogOpen}
        onClose={() =>
          setLoanDialogOpen(false)
        }
        maxWidth="md"
        fullWidth
      >
        <DialogContent
          sx={{ p: 0, bgcolor: "#0f172a" }}
        >
          <LoanCreationForm
            onSuccess={refreshData}
            onClose={() =>
              setLoanDialogOpen(false)
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
