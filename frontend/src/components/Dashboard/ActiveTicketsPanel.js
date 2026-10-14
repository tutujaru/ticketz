import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../../context/Socket/SocketContext.js";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
  wrapper: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2)
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2)
  },
  empty: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(3),
    textAlign: "center"
  },
  contact: {
    fontWeight: 600
  },
  muted: {
    color: theme.palette.text.secondary,
    display: "block",
    fontSize: "0.78rem"
  },
  status: {
    backgroundColor: "#dcfce7",
    color: "#166534"
  }
}));

const formatStartedAt = ticket => {
  const tracking = Array.isArray(ticket.ticketTrakings)
    ? ticket.ticketTrakings[0]
    : null;
  const date = tracking?.startedAt || ticket.updatedAt || ticket.createdAt;
  if (!date) return "-";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getContactLabel = ticket => {
  const contact = ticket.contact || {};
  return contact.name || contact.number || `Ticket #${ticket.id}`;
};

export default function ActiveTicketsPanel({ currentUser }) {
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/active-tickets");
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      // The endpoint is restricted to superadministrators.
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.super) return undefined;

    loadTickets();
    const socket = socketManager.GetSocket();
    const refresh = () => loadTickets();
    socket.on("superadmin-active-ticket", refresh);

    return () => {
      socket.off("superadmin-active-ticket", refresh);
    };
  }, [currentUser, loadTickets, socketManager]);

  if (!currentUser?.super) return null;

  return (
    <Paper className={classes.wrapper} elevation={0}>
      <div className={classes.header}>
        <Typography variant="h6">Atendimentos em andamento</Typography>
        {loading ? (
          <CircularProgress size={22} />
        ) : (
          <Chip
            className={classes.status}
            size="small"
            label={`${tickets.length} ativo${tickets.length === 1 ? "" : "s"}`}
          />
        )}
      </div>

      {!loading && tickets.length === 0 ? (
        <Typography className={classes.empty}>
          Nenhum atendimento em andamento no momento.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Atendente</TableCell>
                <TableCell>Pessoa atendida</TableCell>
                <TableCell>Secretaria</TableCell>
                <TableCell>Conexão</TableCell>
                <TableCell>Fila</TableCell>
                <TableCell>Início</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    {ticket.user?.name || "Não identificado"}
                  </TableCell>
                  <TableCell>
                    <span className={classes.contact}>
                      {getContactLabel(ticket)}
                    </span>
                    {ticket.contact?.number && (
                      <span className={classes.muted}>
                        {ticket.contact.number}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{ticket.company?.name || "-"}</TableCell>
                  <TableCell>{ticket.whatsapp?.name || "-"}</TableCell>
                  <TableCell>{ticket.queue?.name || "Sem fila"}</TableCell>
                  <TableCell>{formatStartedAt(ticket)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
