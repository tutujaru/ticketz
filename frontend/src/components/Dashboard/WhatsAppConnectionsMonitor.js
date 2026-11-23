import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import RefreshIcon from "@material-ui/icons/Refresh";
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles(theme => ({
  wrapper: { marginTop: theme.spacing(3), padding: theme.spacing(2.5), borderRadius: 14, border: "1px solid #e5e7eb" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: theme.spacing(2), marginBottom: theme.spacing(2) },
  title: { fontWeight: 700, color: "#1f2937" },
  subtitle: { color: "#6b7280", fontSize: "0.82rem", marginTop: 3 },
  table: { minWidth: 720 },
  online: { backgroundColor: "#dcfce7", color: "#166534", fontWeight: 700 },
  offline: { backgroundColor: "#fee2e2", color: "#991b1b", fontWeight: 700 },
  waiting: { backgroundColor: "#fef3c7", color: "#92400e", fontWeight: 700 },
  muted: { color: "#6b7280", fontSize: "0.8rem" },
  actions: { display: "flex", justifyContent: "center", gap: theme.spacing(1) },
  empty: { color: "#6b7280", padding: theme.spacing(3), textAlign: "center" }
}));

const statusLabel = status => {
  if (status === "CONNECTED") return "Ativa";
  if (["PAIRING", "qrcode", "OPENING", "passkey_required", "PENDING"].includes(status)) return "Aguardando";
  return "Inativa";
};

const statusClass = (status, classes) => {
  if (status === "CONNECTED") return classes.online;
  if (["PAIRING", "qrcode", "OPENING", "passkey_required", "PENDING"].includes(status)) return classes.waiting;
  return classes.offline;
};

const formatDate = value => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";

export default function WhatsAppConnectionsMonitor({ currentUser }) {
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadConnections = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/active-whatsapps");
      setConnections(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (error) {
      // Keep the last known snapshot visible during a temporary API failure.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.super) return undefined;
    loadConnections();
    const timer = setInterval(loadConnections, 30000);
    const socket = socketManager.GetSocket();
    const refresh = payload => {
      if (payload?.action === "delete") {
        setConnections(items => items.filter(item => item.id !== payload.whatsappId));
      } else if (payload?.action === "update" && payload.whatsapp) {
        setConnections(items => {
          const index = items.findIndex(item => item.id === payload.whatsapp.id);
          if (index === -1) return [...items, payload.whatsapp];
          const next = [...items];
          next[index] = { ...next[index], ...payload.whatsapp };
          return next;
        });
      }
      setLastUpdated(new Date());
    };
    socket.on("superadmin-whatsapp", refresh);
    const unsubscribeIssue = socketManager.subscribeWsConnectionIssue?.(issue => {
      if (!issue) loadConnections();
    });
    return () => {
      clearInterval(timer);
      socket.off("superadmin-whatsapp", refresh);
      if (typeof unsubscribeIssue === "function") unsubscribeIssue();
    };
  }, [currentUser, loadConnections, socketManager]);

  const summary = useMemo(() => ({
    total: connections.length,
    connected: connections.filter(item => item.status === "CONNECTED").length
  }), [connections]);

  const handleAction = async (connection, action) => {
    setBusyId(connection.id);
    try {
      await api.post(`/dashboard/whatsapp/${connection.id}/action`, { action });
      await loadConnections();
    } finally {
      setBusyId(null);
    }
  };

  if (!currentUser?.super) return null;

  return (
    <Paper className={classes.wrapper} elevation={0}>
      <div className={classes.header}>
        <div>
          <Typography variant="h6" className={classes.title}>Monitor de conexões WhatsApp</Typography>
          <Typography className={classes.subtitle}>
            {summary.connected} de {summary.total} conexões ativas · atualização em tempo real
            {lastUpdated ? ` · última leitura ${formatDate(lastUpdated)}` : ""}
          </Typography>
        </div>
        <Button size="small" startIcon={<RefreshIcon />} onClick={loadConnections} disabled={loading}>Atualizar</Button>
      </div>
      {loading ? <CircularProgress size={24} /> : connections.length === 0 ? (
        <Typography className={classes.empty}>Nenhuma conexão encontrada.</Typography>
      ) : (
        <Grid container>
          <Grid item xs={12} style={{ overflowX: "auto" }}>
            <Table size="small" className={classes.table}>
              <TableHead><TableRow>
                <TableCell>Empresa</TableCell><TableCell>Conexão</TableCell><TableCell>Canal</TableCell>
                <TableCell>Status</TableCell><TableCell>Última alteração</TableCell><TableCell align="center">Ações</TableCell>
              </TableRow></TableHead>
              <TableBody>{connections.map(connection => (
                <TableRow key={connection.id}>
                  <TableCell>{connection.company?.name || `Empresa #${connection.companyId}`}</TableCell>
                  <TableCell><strong>{connection.name}</strong>{connection.isDefault ? " · padrão" : ""}</TableCell>
                  <TableCell className={classes.muted}>{connection.channel || connection.provider || "-"}</TableCell>
                  <TableCell><Chip size="small" label={`${statusLabel(connection.status)}${connection.status ? ` (${connection.status})` : ""}`} className={statusClass(connection.status, classes)} /></TableCell>
                  <TableCell className={classes.muted}>{formatDate(connection.updatedAt)}</TableCell>
                  <TableCell><div className={classes.actions}>
                    <Button size="small" color="primary" variant="outlined" startIcon={busyId === connection.id ? <CircularProgress size={14} /> : <RefreshIcon />} disabled={busyId === connection.id} onClick={() => handleAction(connection, "restart")}>Reconectar</Button>
                    <Button size="small" color="secondary" startIcon={<PowerSettingsNewIcon />} disabled={busyId === connection.id || connection.status !== "CONNECTED"} onClick={() => handleAction(connection, "disconnect")}>Desconectar</Button>
                  </div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}
