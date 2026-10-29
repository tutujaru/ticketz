import React, { useEffect, useMemo, useState, useContext } from "react";

import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Skeleton from "@material-ui/lab/Skeleton";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Chip from "@material-ui/core/Chip";
import EmojiEventsIcon from "@material-ui/icons/EmojiEvents";
import { SocketContext } from "../../context/Socket/SocketContext.js";

import { makeStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";

import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";

import Rating from "@material-ui/lab/Rating";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  on: {
    color: green[600],
    fontSize: "20px"
  },
  off: {
    color: red[600],
    fontSize: "20px"
  },
  rankingWrapper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: "1px solid #e2e8f0",
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
  },
  companyTitle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontWeight: 700,
    color: "#1e293b"
  },
  podium: {
    fontWeight: 700,
    color: "#b45309"
  },
  empty: {
    padding: theme.spacing(2),
    color: theme.palette.text.secondary,
    textAlign: "center"
  }
}));

export function RatingBox({ rating }) {
  const numericRating = Number(rating);
  const hasRating = Number.isFinite(numericRating) && numericRating > 0;
  const displayRating = hasRating ? numericRating : 0;

  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <Rating value={displayRating} precision={0.1} max={5} readOnly />
      <Typography variant="body2" component="span">
        {hasRating ? ` ${numericRating.toFixed(1)}` : " Sem avaliação"}
      </Typography>
    </Box>
  );
}

const compareAttendants = (a, b) => {
  const ratingA = Number(a.averageRating) || 0;
  const ratingB = Number(b.averageRating) || 0;
  const ticketsA = Number(a.totalTickets) || 0;
  const ticketsB = Number(b.totalTickets) || 0;
  const closedA = Number(a.closedTickets) || 0;
  const closedB = Number(b.closedTickets) || 0;

  return (
    ratingB - ratingA ||
    ticketsB - ticketsA ||
    closedB - closedA ||
    String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
  );
};

export default function TableAttendantsStatus(props) {
  const { loading, attendants: loadedAttendants } = props;
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const [attendants, setAttendants] = useState(loadedAttendants || []);

  const updateStatus = data => {
    const { userId, online } = data;
    setAttendants(prevAttendants =>
      prevAttendants.map(attendant =>
        attendant.id === userId ? { ...attendant, online } : attendant
      )
    );
  };

  useEffect(() => {
    if (loadedAttendants) {
      setAttendants(loadedAttendants);
    }
  }, [loadedAttendants]);

  useEffect(() => {
    const socket = socketManager.GetSocket();
    socket.on("userOnlineChange", updateStatus);

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const rankings = useMemo(() => {
    const grouped = new Map();

    attendants.forEach(attendant => {
      const companyId = attendant.companyId || "unknown";
      const companyName = attendant.companyName || "Empresa não identificada";
      const group = grouped.get(companyId) || {
        companyId,
        companyName,
        users: []
      };
      group.users.push(attendant);
      grouped.set(companyId, group);
    });

    return Array.from(grouped.values())
      .map(group => ({
        ...group,
        users: [...group.users].sort(compareAttendants).slice(0, 5)
      }))
      .sort((a, b) => a.companyName.localeCompare(b.companyName, "pt-BR"));
  }, [attendants]);

  if (loading) {
    return <Skeleton variant="rect" height={220} />;
  }

  if (!rankings.length) {
    return (
      <Typography className={classes.empty}>
        Nenhum atendimento encontrado no período selecionado.
      </Typography>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Ranking de atendentes por empresa
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Ordenado por avaliação média e, em caso de empate, pelo total de
        atendimentos.
      </Typography>

      {rankings.map(group => (
        <Paper
          key={group.companyId}
          className={classes.rankingWrapper}
          elevation={0}
        >
          <Typography className={classes.companyTitle} variant="subtitle1">
            <EmojiEventsIcon color="primary" />
            {group.companyName}
            <Chip size="small" label={`Top ${group.users.length}`} />
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">#</TableCell>
                  <TableCell>{i18n.t("common.user")}</TableCell>
                  <TableCell align="center">
                    {i18n.t("common.rating")}
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("dashboard.totalTickets")}
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("dashboard.ticketsDone")}
                  </TableCell>
                  <TableCell align="center">
                    {i18n.t("dashboard.userCurrentStatus")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.users.map((attendant, index) => (
                  <TableRow key={attendant.id}>
                    <TableCell
                      align="center"
                      className={index < 3 ? classes.podium : undefined}
                    >
                      {index + 1}º
                    </TableCell>
                    <TableCell>{attendant.name}</TableCell>
                    <TableCell align="center">
                      <RatingBox rating={attendant.averageRating} />
                    </TableCell>
                    <TableCell align="center">
                      {Number(attendant.totalTickets) || 0}
                    </TableCell>
                    <TableCell align="center">
                      {Number(attendant.closedTickets) || 0}
                    </TableCell>
                    <TableCell align="center">
                      {attendant.online ? (
                        <CheckCircleIcon className={classes.on} />
                      ) : (
                        <ErrorIcon className={classes.off} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}
    </Box>
  );
}
