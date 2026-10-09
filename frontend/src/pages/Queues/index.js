import React, { useEffect, useReducer, useState, useContext } from "react";

import {
  Button,
  IconButton,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Box
} from "@material-ui/core";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import Title from "../../components/Title";
import { i18nToast } from "../../helpers/i18nToast";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import {
  DeleteOutline,
  Edit,
  Add,
  AccountTreeOutlined
} from "@material-ui/icons";
import QueueModal from "../../components/QueueModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles(theme => ({
  container: {
    paddingBottom: theme.spacing(2)
  },
  mainPaper: {
    flex: 1,
    padding: 0,
    overflowY: "auto",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9",
    ...theme.scrollbarStyles
  },
  // Cabeçalho da tabela moderno
  tableHead: {
    backgroundColor: "#f8fafc",
    "& th": {
      borderBottom: "1px solid #e2e8f0",
      fontSize: "0.7rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#64748b",
      padding: theme.spacing(2, 1.5),
      whiteSpace: "nowrap"
    }
  },
  // Linha da tabela moderna
  tableRow: {
    transition: "background-color 0.15s ease-in-out",
    "& td": {
      borderBottom: "1px solid #f1f5f9",
      padding: theme.spacing(1.5),
      fontSize: "0.875rem",
      color: "#334155"
    },
    "&:hover": {
      backgroundColor: "#f8fafc",
      "& $actionBtn": {
        opacity: 1
      }
    },
    "&:last-child td": {
      borderBottom: "none"
    }
  },
  // Pílula de cor moderna
  colorPill: {
    display: "inline-block",
    width: "60px",
    height: "20px",
    borderRadius: "10px",
    border: "2px solid #ffffff",
    boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.15)"
  },
  // Avatar/ID moderno
  idBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "32px",
    height: "32px",
    padding: "0 8px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    fontWeight: 700,
    fontSize: "0.75rem"
  },
  // Botões de ação modernos
  actionBtn: {
    padding: theme.spacing(0.75),
    margin: theme.spacing(0, 0.25),
    borderRadius: "10px",
    transition: "all 0.2s ease",
    "& svg": {
      fontSize: "18px"
    }
  },
  editBtn: {
    color: "#64748b",
    "&:hover": {
      backgroundColor: "#eff6ff",
      color: "#3b82f6"
    }
  },
  deleteBtn: {
    color: "#64748b",
    "&:hover": {
      backgroundColor: "#fef2f2",
      color: "#ef4444"
    }
  },
  // Botão de adicionar moderno
  addButton: {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 600,
    padding: theme.spacing(1, 3),
    boxShadow: "0px 4px 12px rgba(59, 130, 246, 0.25)",
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: "0px 6px 16px rgba(59, 130, 246, 0.35)",
      transform: "translateY(-1px)"
    }
  },
  // Texto da saudação
  greetingText: {
    maxWidth: "320px",
    color: "#64748b",
    fontSize: "0.85rem"
  },
  // Estado vazio
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(8, 2),
    textAlign: "center"
  },
  emptyStateIcon: {
    fontSize: "4rem",
    color: "#cbd5e1",
    marginBottom: theme.spacing(2)
  },
  emptyStateText: {
    color: "#64748b",
    fontWeight: 500
  }
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_QUEUES") {
    const queues = action.payload;
    const newQueues = [];

    queues.forEach(queue => {
      const queueIndex = state.findIndex(q => q.id === queue.id);
      if (queueIndex !== -1) {
        state[queueIndex] = queue;
      } else {
        newQueues.push(queue);
      }
    });

    return [...state, ...newQueues];
  }

  if (action.type === "UPDATE_QUEUES") {
    const queue = action.payload;
    const queueIndex = state.findIndex(u => u.id === queue.id);

    if (queueIndex !== -1) {
      state[queueIndex] = queue;
      return [...state];
    } else {
      return [queue, ...state];
    }
  }

  if (action.type === "DELETE_QUEUE") {
    const queueId = action.payload;
    const queueIndex = state.findIndex(q => q.id === queueId);
    if (queueIndex !== -1) {
      state.splice(queueIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Queues = () => {
  const classes = useStyles();

  const [queues, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);

  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/queue");
        dispatch({ type: "LOAD_QUEUES", payload: data });

        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onQueue = data => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUEUES", payload: data.queue });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUEUE", payload: data.queueId });
      }
    };

    socket.on(`company-${companyId}-queue`, onQueue);

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const handleOpenQueueModal = () => {
    setQueueModalOpen(true);
    setSelectedQueue(null);
  };

  const handleCloseQueueModal = () => {
    setQueueModalOpen(false);
    setSelectedQueue(null);
  };

  const handleEditQueue = queue => {
    setSelectedQueue(queue);
    setQueueModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async queueId => {
    try {
      await api.delete(`/queue/${queueId}`);
      i18nToast.success("queues.toasts.deleted");
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  return (
    <MainContainer className={classes.container}>
      <ConfirmationModal
        title={
          selectedQueue &&
          `${i18n.t("queues.confirmationModal.deleteTitle")} ${
            selectedQueue.name
          }?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        {i18n.t("queues.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <QueueModal
        open={queueModalOpen}
        onClose={handleCloseQueueModal}
        queueId={selectedQueue?.id}
      />
      <MainHeader>
        <Title>{i18n.t("queues.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            className={classes.addButton}
            onClick={handleOpenQueueModal}
            startIcon={<Add />}
          >
            {i18n.t("queues.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} elevation={0}>
        {!loading && queues.length === 0 ? (
          <Box className={classes.emptyState}>
            <AccountTreeOutlined className={classes.emptyStateIcon} />
            <Typography variant="h6" className={classes.emptyStateText}>
              Nenhuma fila cadastrada ainda
            </Typography>
            <Typography
              variant="body2"
              style={{ color: "#94a3b8", marginTop: 8 }}
            >
              Clique em "Adicionar" para criar sua primeira fila.
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead className={classes.tableHead}>
              <TableRow>
                <TableCell align="center">ID</TableCell>
                <TableCell align="left">
                  {i18n.t("queues.table.name")}
                </TableCell>
                <TableCell align="center">
                  {i18n.t("queues.table.color")}
                </TableCell>
                <TableCell align="left">
                  {i18n.t("queues.table.greeting")}
                </TableCell>
                <TableCell align="center">
                  {i18n.t("queues.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <>
                {queues.map(queue => (
                  <TableRow key={queue.id} className={classes.tableRow}>
                    <TableCell align="center">
                      <span className={classes.idBadge}>{queue.id}</span>
                    </TableCell>
                    <TableCell align="left">
                      <Typography style={{ fontWeight: 600, color: "#0f172a" }}>
                        {queue.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <span
                        className={classes.colorPill}
                        style={{ backgroundColor: queue.color }}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <Typography
                        className={classes.greetingText}
                        noWrap
                        variant="body2"
                      >
                        {queue.greetingMessage || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar" arrow>
                        <IconButton
                          size="small"
                          className={`${classes.actionBtn} ${classes.editBtn}`}
                          onClick={() => handleEditQueue(queue)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir" arrow>
                        <IconButton
                          size="small"
                          className={`${classes.actionBtn} ${classes.deleteBtn}`}
                          onClick={() => {
                            setSelectedQueue(queue);
                            setConfirmModalOpen(true);
                          }}
                        >
                          <DeleteOutline />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && <TableRowSkeleton columns={4} />}
              </>
            </TableBody>
          </Table>
        )}
      </Paper>
    </MainContainer>
  );
};

export default Queues;
