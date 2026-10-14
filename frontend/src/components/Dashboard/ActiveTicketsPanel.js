import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import { SocketContext } from "../../context/Socket/SocketContext.js";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
  wrapper: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2.5),
    borderRadius: 14,
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2)
  },
  title: {
    fontWeight: 700,
    color: "#1f2937"
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "0.82rem",
    marginTop: 3
  },
  activeChip: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontWeight: 700,
    flexShrink: 0
  },
  navigation: {
    alignItems: "center",
    display: "flex",
    gap: theme.spacing(0.5),
    justifyContent: "center",
    marginTop: theme.spacing(2)
  },
  navigationButton: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    padding: 7,
    "&:hover": {
      backgroundColor: "#e5e7eb"
    },
    "&.Mui-disabled": {
      color: "#cbd5e1"
    }
  },
  pageLabel: {
    color: "#6b7280",
    fontSize: "0.8rem",
    minWidth: 110,
    textAlign: "center"
  },
  empty: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(4),
    textAlign: "center"
  },
  ticketCard: {
    height: "100%",
    padding: theme.spacing(1.75),
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    borderLeft: "4px solid #16a34a",
    backgroundColor: "#fbfdff",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)"
  },
  ticketHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5)
  },
  attendant: {
    color: "#111827",
    fontSize: "1rem",
    fontWeight: 700,
    lineHeight: 1.25
  },
  ticketId: {
    color: "#6b7280",
    fontSize: "0.72rem",
    whiteSpace: "nowrap"
  },
  contact: {
    color: "#2563eb",
    fontSize: "0.95rem",
    fontWeight: 700,
    lineHeight: 1.3
  },
  phone: {
    color: "#6b7280",
    display: "block",
    fontSize: "0.78rem",
    marginTop: 2
  },
  detailGrid: {
    borderTop: "1px solid #eef2f7",
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.25)
  },
  label: {
    color: "#6b7280",
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase"
  },
  value: {
    color: "#374151",
    display: "block",
    fontSize: "0.82rem",
    lineHeight: 1.35,
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  queueValue: {
    color: "#047857",
    fontWeight: 700
  }
}));

const PAGE_SIZE = 6;

const formatStartedAt = ticket => {
  const tracking = Array.isArray(ticket.ticketTrakings)
    ? ticket.ticketTrakings[0]
    : null;
  const date = tracking?.startedAt || ticket.updatedAt || ticket.createdAt;
  if (!date) return "-";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getContactLabel = ticket => {
  const contact = ticket.contact || {};
  return contact.name || contact.number || `Ticket #${ticket.id}`;
};

function Detail({ label, value, className = "", classes }) {
  return (
    <Grid item xs={6}>
      <span className={classes.label}>{label}</span>
      <span className={`${classes.value} ${className}`}>{value || "-"}</span>
    </Grid>
  );
}

export default function ActiveTicketsPanel({ currentUser }) {
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const loadTickets = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/active-tickets");
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
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

  const totalPages = Math.ceil(tickets.length / PAGE_SIZE);
  const visibleTickets = tickets.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    setPage(currentPage => Math.min(currentPage, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  useEffect(() => {
    if (loading || totalPages <= 1) return undefined;

    const timer = setInterval(() => {
      setPage(currentPage => (currentPage + 1) % totalPages);
    }, 10000);

    return () => clearInterval(timer);
  }, [loading, totalPages]);

  if (!currentUser?.super) return null;

  return (
    <Paper className={classes.wrapper} elevation={0}>
      <div className={classes.header}>
        <div>
          <Typography variant="h6" className={classes.title}>
            Atendimentos em andamento
          </Typography>
          <Typography className={classes.subtitle}>
            Acompanhamento dos atendimentos ativos de todas as Secretarias
          </Typography>
        </div>
        {loading ? (
          <CircularProgress size={22} />
        ) : (
          <Chip
            className={classes.activeChip}
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
        <Grid container spacing={2}>
          {visibleTickets.map(ticket => (
            <Grid item xs={12} sm={6} key={ticket.id}>
              <Paper className={classes.ticketCard} elevation={0}>
                <div className={classes.ticketHeader}>
                  <div>
                    <Typography className={classes.attendant}>
                      {ticket.user?.name || "Atendente não identificado"}
                    </Typography>
                    <Typography className={classes.ticketId}>
                      Atendimento #{ticket.id}
                    </Typography>
                  </div>
                  <Chip
                    size="small"
                    className={classes.activeChip}
                    label="Em atendimento"
                  />
                </div>

                <Typography className={classes.contact}>
                  {getContactLabel(ticket)}
                </Typography>
                {ticket.contact?.number && (
                  <span className={classes.phone}>{ticket.contact.number}</span>
                )}

                <Grid container spacing={1} className={classes.detailGrid}>
                  <Detail
                    classes={classes}
                    label="Secretaria"
                    value={ticket.company?.name}
                  />
                  <Detail
                    classes={classes}
                    label="Conexão"
                    value={ticket.whatsapp?.name}
                  />
                  <Detail
                    classes={classes}
                    label="Fila"
                    value={ticket.queue?.name || "Sem fila"}
                    className={classes.queueValue}
                  />
                  <Detail
                    classes={classes}
                    label="Início"
                    value={formatStartedAt(ticket)}
                  />
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && totalPages > 1 && (
        <div className={classes.navigation}>
          <IconButton
            className={classes.navigationButton}
            size="small"
            aria-label="Página anterior"
            disabled={page === 0}
            onClick={() => setPage(currentPage => currentPage - 1)}
          >
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
          <Typography className={classes.pageLabel}>
            Página {page + 1} de {totalPages}
          </Typography>
          <IconButton
            className={classes.navigationButton}
            size="small"
            aria-label="Próxima página"
            disabled={page === totalPages - 1}
            onClick={() => setPage(currentPage => currentPage + 1)}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </div>
      )}
    </Paper>
  );
}
