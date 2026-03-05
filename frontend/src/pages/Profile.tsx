import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Paper, Chip, Avatar, Button, Stack, TextField, IconButton, Divider } from "@mui/material";
import { AccountCircle, OpenInNew, TrendingUp, Warning, CheckCircle, Edit, Save, AccountBalanceWallet } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { usePrivLend } from "../context/PrivLendContext";
import CountUp from "react-countup";

const TESTNET_EXPLORER = "https://testnet.explorer.provable.com/address/";

interface UserProfile {
  username: string;
  avatar: string | null;
}

export const Profile: React.FC = () => {
  const { address, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const {
    activeUserLoans,
    expiredUserLoans,
    settledUserLoans,
    transactionHistory
  } = usePrivLend();

  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    avatar: null
  });
  const [editing, setEditing] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  const totalLoans = useMemo(
    () => activeUserLoans.length + expiredUserLoans.length + settledUserLoans.length,
    [activeUserLoans, expiredUserLoans, settledUserLoans]
  );

  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`profile_${address}`);
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      setProfile({
        username: `User_${address.slice(0, 6)}`,
        avatar: null
      });
    }
  }, [address]);

  const handleSave = () => {
    if (!address) return;
    localStorage.setItem(`profile_${address}`, JSON.stringify(profile));
    setEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile(prev => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (!connected || !address) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h5" mb={2}>
          Connect your wallet to view profile
        </Typography>
        <Button
          variant="contained"
          startIcon={<AccountBalanceWallet />}
          onClick={() => setVisible(true)}
        >
          Connect Wallet
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        My Profile
      </Typography>

      {/* Profile Card */}
      <motion.div whileHover={{ scale: 1.01 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            background: "linear-gradient(135deg,#1e293b,#0f172a)",
            border: "1px solid #334155",
            mb: 4
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems="center"
          >
            {/* Avatar */}
            <Box position="relative">
              <Avatar
                src={profile.avatar ?? undefined}
                sx={{ width: 100, height: 100, bgcolor: "#6366f1" }}
              >
                {!profile.avatar && <AccountCircle />}
              </Avatar>
              {editing && (
                <IconButton
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "primary.main",
                    color: "white"
                  }}
                >
                  <Edit fontSize="small" />
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </IconButton>
              )}
            </Box>

            {/* Info */}
            <Box flex={1}>
              {editing ? (
                <TextField
                  fullWidth
                  value={profile.username}
                  onChange={e =>
                    setProfile(prev => ({ ...prev, username: e.target.value }))
                  }
                />
              ) : (
                <Typography variant="h5">{profile.username}</Typography>
              )}

              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  {showAddress
                    ? address
                    : `${address.slice(0, 6)}...${address.slice(-4)}`}
                </Typography>
                <Button size="small" onClick={() => setShowAddress(prev => !prev)}>
                  {showAddress ? "Hide" : "Show"}
                </Button>
              </Stack>
            </Box>

            {/* Actions */}
            {editing ? (
              <IconButton onClick={handleSave}><Save /></IconButton>
            ) : (
              <IconButton onClick={() => setEditing(true)}><Edit /></IconButton>
            )}

            <Button
              variant="outlined"
              startIcon={<OpenInNew />}
              href={`${TESTNET_EXPLORER}${address}`}
              target="_blank"
            >
              Explorer
            </Button>
          </Stack>
        </Paper>
      </motion.div>

      {/* Metrics */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
        <MetricCard
          title="Active Loans"
          value={activeUserLoans.length}
          icon={<TrendingUp />}
          color="#10b981"
        />
        <MetricCard
          title="Expired"
          value={expiredUserLoans.length}
          icon={<Warning />}
          color="#ef4444"
        />
        <MetricCard
          title="Total Loans"
          value={totalLoans}
          icon={<CheckCircle />}
          color="#6366f1"
        />
      </Stack>

      {/* Recent Activity */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          background: "#0f172a",
          border: "1px solid #334155"
        }}
      >
        <Typography variant="h6" mb={2}>
          Recent Activity
        </Typography>

        {transactionHistory.length === 0 ? (
          <Box>
            <Typography color="text.secondary">
              No transactions yet.
            </Typography>
            {/* transactions only appear after wallet syncs */}
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
              Transactions appear here after your wallet syncs with the network.
              If you recently created a loan, try refreshing in a few seconds.
            </Typography>
          </Box>
        ) : (
          transactionHistory.slice(0, 5).map(tx => (
            <Box key={tx.id}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                py={1.5}
              >
                <Box>
                  <Typography>{tx.type}</Typography>
                  {/* show timestamp if available */}
                  {tx.timestamp && (
                    <Typography variant="caption" color="text.disabled">
                      {new Date(tx.timestamp).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={tx.status}
                    size="small"
                    color={
                      tx.status === "Completed"
                        ? "success"
                        : tx.status === "Failed"
                        ? "error"
                        : "warning"
                    }
                  />
                  {/* link to explorer for each tx */}
                  <IconButton
                    size="small"
                    href={`https://testnet.explorer.provable.com/transaction/${tx.id}`}
                    target="_blank"
                    component="a"
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
              <Divider />
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

const MetricCard = ({ title, value, icon, color }: any) => (
  <Paper
    sx={{
      flex: 1,
      p: 3,
      borderRadius: 4,
      background: `linear-gradient(135deg, ${color}20, ${color}05)`,
      border: `1px solid ${color}40`
    }}
  >
    <Stack direction="row" justifyContent="space-between">
      <Typography color="text.secondary">{title}</Typography>
      {icon}
    </Stack>
    <Typography variant="h4" fontWeight="bold" mt={2}>
      <CountUp end={value} duration={1.5} />
    </Typography>
  </Paper>
);
