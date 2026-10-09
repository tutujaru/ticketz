import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import Tooltip from "@material-ui/core/Tooltip";
import Box from "@material-ui/core/Box";

import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import UserModal from "../../components/UserModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";

const reducer = (state, action) => {
  if (action.type === "LOAD_USERS") {
    const users = action.payload;
    const newUsers = [];

    users.forEach(user => {
      const userIndex = state.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        state[userIndex] = user;
      } else {
        newUsers.push(user);
      }
    });

    return [...state, ...newUsers];
  }

  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const userIndex = state.findIndex(u => u.id === user.id);

    if (userIndex !== -1) {
      state[userIndex] = user;
      return [...state];
    } else {
      return [user, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const userId = action.payload;

    const userIndex = state.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      state.splice(userIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

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
  // Campo de busca moderno
  searchField: {
    marginRight: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "#ffffff",
      "& fieldset": {
        borderColor: "#e2e8f0"
      },
      "&:hover fieldset": {
        borderColor: "#cbd5e1"
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3b82f6",
        borderWidth: "2px"
      }
    }
  },
  searchIcon: {
    color: "#64748b"
  },
  // Botão Adicionar moderno
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
      backgroundColor: "#f8fafc"
    },
    "&:last-child td": {
      borderBottom: "none"
    }
  },
  // ID badge
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
  // Avatar do usuário
  userAvatar: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#8b5cf6",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.85rem",
    marginRight: theme.spacing(1.5),
    flexShrink: 0
  },
  // Wrapper do nome com avatar
  userCell: {
    display: "flex",
    alignItems: "center"
  },
  userName: {
    fontWeight: 600,
    color: "#0f172a",
    fontSize: "0.875rem"
  },
  // Email
  userEmail: {
    color: "#64748b",
    fontSize: "0.85rem"
  },
  // Chip de perfil
  profileChipAdmin: {
    backgroundColor: "#f3e8ff",
    color: "#6b21a8",
    fontWeight: 600,
    fontSize: "0.7rem",
    height: "24px",
    borderRadius: "8px",
    textTransform: "capitalize"
  },
  profileChipUser: {
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    fontWeight: 600,
    fontSize: "0.7rem",
    height: "24px",
    borderRadius: "8px",
    textTransform: "capitalize"
  },
  // Botões de ação
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
  // Empty state
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

// Helper para pegar as iniciais do nome
const getInitials = name => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
};

// Cores de avatar baseadas no id do usuário
const avatarColors = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ef4444",
  "#6366f1"
];

const getAvatarColor = id => {
  return avatarColors[id % avatarColors.length];
};

const Users = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [users, dispatch] = useReducer(reducer, []);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/", {
            params: { searchParam, pageNumber }
          });
          dispatch({ type: "LOAD_USERS", payload: data.users });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyUser = data => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_USERS", payload: data.user });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_USER", payload: +data.userId });
      }
    };

    socket.on(`company-${companyId}-user`, onCompanyUser);

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const handleOpenUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(false);
  };

  const handleSearch = event => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditUser = user => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async userId => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setPageNumber(prevState => prevState + 1);
  };

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const renderProfileChip = profile => {
    const isAdmin = profile === "admin";
    return (
      <Chip
        label={profile}
        className={
          isAdmin ? classes.profileChipAdmin : classes.profileChipUser
        }
        size="small"
      />
    );
  };

  const renderEmptyState = () => (
    <Box className={classes.emptyState}>
      <PeopleAltOutlinedIcon className={classes.emptyStateIcon} />
      <Typography variant="h6" className={classes.emptyStateText}>
        Nenhum usuário encontrado
      </Typography>
      <Typography
        variant="body2"
        style={{ color: "#94a3b8", marginTop: 8 }}
      >
        {searchParam
          ? "Tente ajustar sua busca ou limpar o filtro."
          : 'Clique em "Adicionar" para criar seu primeiro usuário.'}
      </Typography>
    </Box>
  );

  return (
    <MainContainer className={classes.container}>
      <ConfirmationModal
        title={
          deletingUser &&
          `${i18n.t("users.confirmationModal.deleteTitle")} ${
            deletingUser.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteUser(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <UserModal
        open={userModalOpen}
        onClose={handleCloseUserModal}
        aria-labelledby="form-dialog-title"
        userId={selectedUser && selectedUser.id}
      />
      <MainHeader>
        <Title>{i18n.t("users.title")}</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            className={classes.searchField}
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className={classes.searchIcon} />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            color="primary"
            className={classes.addButton}
            onClick={handleOpenUserModal}
            startIcon={<AddIcon />}
          >
            {i18n.t("users.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        elevation={0}
        onScroll={handleScroll}
      >
        {!loading && users.length === 0 ? (
          renderEmptyState()
        ) : (
          <Table size="small">
            <TableHead className={classes.tableHead}>
              <TableRow>
                <TableCell align="center">ID</TableCell>
                <TableCell align="left">
                  {i18n.t("users.table.name")}
                </TableCell>
                <TableCell align="left">
                  {i18n.t("users.table.email")}
                </TableCell>
                <TableCell align="center">
                  {i18n.t("users.table.profile")}
                </TableCell>
                <TableCell align="center">
                  {i18n.t("users.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <>
                {users.map(user => (
                  <TableRow key={user.id} className={classes.tableRow}>
                    <TableCell align="center">
                      <span className={classes.idBadge}>{user.id}</span>
                    </TableCell>
                    <TableCell align="left">
                      <div className={classes.userCell}>
                        <div
                          className={classes.userAvatar}
                          style={{ backgroundColor: getAvatarColor(user.id) }}
                        >
                          {getInitials(user.name)}
                        </div>
                        <span className={classes.userName}>
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell align="left">
                      <span className={classes.userEmail}>{user.email}</span>
                    </TableCell>
                    <TableCell align="center">
                      {renderProfileChip(user.profile)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar" arrow>
                        <IconButton
                          size="small"
                          className={`${classes.actionBtn} ${classes.editBtn}`}
                          onClick={() => handleEditUser(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir" arrow>
                        <IconButton
                          size="small"
                          className={`${classes.actionBtn} ${classes.deleteBtn}`}
                          onClick={e => {
                            setConfirmModalOpen(true);
                            setDeletingUser(user);
                          }}
                        >
                          <DeleteOutlineIcon />
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

export default Users;
