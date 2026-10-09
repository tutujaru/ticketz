import { useContext, useEffect, useRef, useState } from "react";

import { useParams, useHistory } from "react-router-dom";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  makeStyles,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";
import ChatList from "./ChatList";
import ChatMessages from "./ChatMessages";
import { UsersFilter } from "../../components/UsersFilter";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

import { has, isObject } from "lodash";

import { AuthContext } from "../../context/Auth/AuthContext";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";

import { i18n } from "../../translate/i18n";
import Title from "../../components/Title";

const useStyles = makeStyles(theme => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    height: `calc(100% - 48px)`,
    overflowY: "hidden",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9"
  },
  gridContainer: {
    flex: 1,
    height: "100%",
    backgroundColor: "inherit",
    overflow: "hidden"
  },
  gridItem: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflowY: "hidden"
  },
  gridItemTab: {
    height: "92%",
    width: "100%",
    overflowY: "hidden"
  },
  // Wrapper lateral esquerdo (lista de chats)
  sideWrapper: {
    borderRight: "1px solid #f1f5f9",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "hidden"
  },
  // Wrapper lateral direito (mensagens)
  messagesWrapper: {
    backgroundColor: "#fafbfc",
    height: "100%",
    overflowY: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  // Container do botão "Nova"
  btnContainer: {
    padding: theme.spacing(2),
    display: "flex",
    justifyContent: "flex-end",
    borderBottom: "1px solid #f1f5f9"
  },
  // Botão "Nova Conversa" moderno
  newChatButton: {
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
  // Tabs modernas
  tabsWrapper: {
    padding: theme.spacing(0, 2),
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #f1f5f9"
  },
  modernTab: {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    letterSpacing: "0.02em",
    minWidth: "100px",
    color: "#64748b",
    "&.Mui-selected": {
      color: "#3b82f6"
    }
  },
  // Dialog moderno
  dialogPaper: {
    borderRadius: "16px",
    padding: theme.spacing(1)
  },
  dialogTitle: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "1.25rem"
  },
  dialogContent: {
    paddingTop: theme.spacing(2)
  },
  // Botões do dialog
  cancelButton: {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 600,
    color: "#64748b"
  },
  saveButton: {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 600,
    boxShadow: "0px 4px 12px rgba(59, 130, 246, 0.25)"
  },
  // Estado vazio do chat
  emptyChatState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    padding: theme.spacing(4)
  },
  emptyChatIcon: {
    fontSize: "4rem",
    color: "#cbd5e1",
    marginBottom: theme.spacing(2)
  },
  emptyChatText: {
    color: "#64748b",
    fontWeight: 500
  }
}));

export function ChatModal({
  open,
  chat,
  type,
  handleClose,
  handleLoadNewChat,
  user
}) {
  const classes = useStyles();
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle("");
    setUsers([]);
    if (type === "edit" && chat?.users) {
      const userList = chat.users.map(u => ({
        id: u.user.id,
        name: u.user.name
      }));
      setUsers(userList);
      setTitle(chat.title);
    }
  }, [chat, open, type]);

  const handleSave = async () => {
    try {
      if (!title) {
        alert("Por favor, preencha o título da conversa.");
        return;
      }

      if (!users || users.length === 0) {
        alert("Por favor, selecione pelo menos um usuário.");
        return;
      }

      if (type === "edit") {
        await api.put(`/chats/${chat.id}`, {
          users,
          title
        });
      } else {
        const { data } = await api.post("/chats", {
          users,
          title
        });
        handleLoadNewChat(data);
      }
      handleClose();
    } catch (err) {}
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      classes={{ paper: classes.dialogPaper }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="alert-dialog-title" className={classes.dialogTitle}>
        {type === "edit" ? "Editar Conversa" : "Nova Conversa"}
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Grid spacing={2} container>
          <Grid xs={12} item>
            <TextField
              label="Título"
              placeholder="Digite o título da conversa"
              value={title}
              onChange={e => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              style={{ marginBottom: 16 }}
            />
          </Grid>
          <Grid xs={12} item>
            <UsersFilter
              multiple
              onFiltered={users => setUsers(users)}
              initialUsers={users}
              excludeId={user.id}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions style={{ padding: 16 }}>
        <Button
          onClick={handleClose}
          className={classes.cancelButton}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          className={classes.saveButton}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Chat(props) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const history = useHistory();

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState("new");
  const [currentChat, setCurrentChat] = useState({});
  const [chats, setChats] = useState([]);
  const [chatsPageInfo, setChatsPageInfo] = useState({ hasMore: false });
  const [messages, setMessages] = useState([]);
  const [messagesPageInfo, setMessagesPageInfo] = useState({ hasMore: false });
  const [messagesPage, setMessagesPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const isMounted = useRef(true);
  const scrollToBottomRef = useRef();
  const { id } = useParams();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      findChats().then(data => {
        const { records } = data;
        if (records.length > 0) {
          setChats(records);
          setChatsPageInfo(data);

          if (id && records.length) {
            const chat = records.find(r => r.uuid === id);
            selectChat(chat);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isObject(currentChat) && has(currentChat, "id")) {
      findMessages(currentChat.id).then(() => {
        if (typeof scrollToBottomRef.current === "function") {
          setTimeout(() => {
            scrollToBottomRef.current();
          }, 300);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onChatUser = data => {
      if (data.action === "create") {
        setChats(prev => [data.record, ...prev]);
      }
      if (data.action === "update") {
        const changedChats = chats.map(chat => {
          if (chat.id === data.record.id) {
            setCurrentChat(data.record);
            return {
              ...data.record
            };
          }
          return chat;
        });
        setChats(changedChats);
      }
    };

    const onChat = data => {
      if (data.action === "delete") {
        const filteredChats = chats.filter(c => c.id !== +data.id);
        setChats(filteredChats);
        setMessages([]);
        setMessagesPage(1);
        setMessagesPageInfo({ hasMore: false });
        setCurrentChat({});
        history.push("/chats");
      }
    };

    const onCurrentChat = data => {
      if (data.action === "new-message") {
        setMessages(prev => [...prev, data.newMessage]);
        const changedChats = chats.map(chat => {
          if (chat.id === data.newMessage.chatId) {
            return {
              ...data.chat
            };
          }
          return chat;
        });
        setChats(changedChats);
        scrollToBottomRef.current();
      }

      if (data.action === "update") {
        const changedChats = chats.map(chat => {
          if (chat.id === data.chat.id) {
            return {
              ...data.chat
            };
          }
          return chat;
        });
        setChats(changedChats);
        scrollToBottomRef.current();
      }
    };

    socket.on(`company-${companyId}-chat-user-${user.id}`, onChatUser);
    socket.on(`company-${companyId}-chat`, onChat);
    if (isObject(currentChat) && has(currentChat, "id")) {
      socket.on(`company-${companyId}-chat-${currentChat.id}`, onCurrentChat);
    }

    return () => {
      socket.disconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat, socketManager]);

  const selectChat = chat => {
    try {
      setMessages([]);
      setMessagesPage(1);
      setCurrentChat(chat);
      setTab(1);
    } catch (err) {}
  };

  const sendMessage = async contentMessage => {
    setLoading(true);
    try {
      await api.post(`/chats/${currentChat.id}/messages`, {
        message: contentMessage
      });
    } catch (err) {}
    setLoading(false);
  };

  const deleteChat = async chat => {
    try {
      await api.delete(`/chats/${chat.id}`);
    } catch (err) {}
  };

  const findMessages = async chatId => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/chats/${chatId}/messages?pageNumber=${messagesPage}`
      );
      setMessagesPage(prev => prev + 1);
      setMessagesPageInfo(data);
      setMessages(prev => [...data.records, ...prev]);
    } catch (err) {}
    setLoading(false);
  };

  const loadMoreMessages = async () => {
    if (!loading) {
      findMessages(currentChat.id);
    }
  };

  const findChats = async () => {
    try {
      const { data } = await api.get("/chats");
      return data;
    } catch (err) {
      console.log(err);
    }
  };

  // Estado vazio para quando nenhum chat está selecionado (Desktop)
  const renderEmptyChat = () => (
    <div className={classes.emptyChatState}>
      <ForumOutlinedIcon className={classes.emptyChatIcon} />
      <Typography variant="h6" className={classes.emptyChatText}>
        Selecione uma conversa
      </Typography>
      <Typography
        variant="body2"
        style={{ color: "#94a3b8", marginTop: 8 }}
      >
        Escolha uma conversa na lista à esquerda para começar.
      </Typography>
    </div>
  );

  const renderGrid = () => {
    return (
      <>
        <Grid className={classes.gridContainer} container>
          {/* Coluna Esquerda - Lista de Chats */}
          <Grid className={`${classes.gridItem} ${classes.sideWrapper}`} md={3} item>
            <div className={classes.btnContainer}>
              <Button
                onClick={() => {
                  setDialogType("new");
                  setShowDialog(true);
                }}
                color="primary"
                variant="contained"
                className={classes.newChatButton}
                startIcon={<AddIcon />}
              >
                Nova
              </Button>
            </div>

            <ChatList
              chats={chats}
              pageInfo={chatsPageInfo}
              loading={loading}
              handleSelectChat={chat => selectChat(chat)}
              handleDeleteChat={chat => deleteChat(chat)}
              handleEditChat={() => {
                setDialogType("edit");
                setShowDialog(true);
              }}
            />
          </Grid>

          {/* Coluna Direita - Mensagens */}
          <Grid className={`${classes.gridItem} ${classes.messagesWrapper}`} md={9} item>
            {isObject(currentChat) && has(currentChat, "id") ? (
              <ChatMessages
                chat={currentChat}
                scrollToBottomRef={scrollToBottomRef}
                pageInfo={messagesPageInfo}
                messages={messages}
                loading={loading}
                handleSendMessage={sendMessage}
                handleLoadMore={loadMoreMessages}
              />
            ) : (
              renderEmptyChat()
            )}
          </Grid>
        </Grid>
      </>
    );
  };

  const renderTab = () => {
    return (
      <Grid className={classes.gridContainer} container>
        <Grid md={12} item className={classes.tabsWrapper}>
          <Tabs
            value={tab}
            indicatorColor="primary"
            textColor="primary"
            onChange={(e, v) => setTab(v)}
            variant="fullWidth"
            TabIndicatorProps={{
              style: { height: 3, borderRadius: "3px 3px 0 0" }
            }}
          >
            <Tab label="Conversas" className={classes.modernTab} />
            <Tab label="Mensagens" className={classes.modernTab} />
          </Tabs>
        </Grid>
        {tab === 0 && (
          <Grid className={classes.gridItemTab} md={12} item>
            <div className={classes.btnContainer}>
              <Button
                onClick={() => {
                  setDialogType("new");
                  setShowDialog(true);
                }}
                color="primary"
                variant="contained"
                className={classes.newChatButton}
                startIcon={<AddIcon />}
              >
                Nova
              </Button>
            </div>
            <ChatList
              chats={chats}
              pageInfo={chatsPageInfo}
              loading={loading}
              handleSelectChat={chat => selectChat(chat)}
              handleDeleteChat={chat => deleteChat(chat)}
            />
          </Grid>
        )}
        {tab === 1 && (
          <Grid className={classes.gridItemTab} md={12} item>
            {isObject(currentChat) && has(currentChat, "id") ? (
              <ChatMessages
                chat={currentChat}
                scrollToBottomRef={scrollToBottomRef}
                pageInfo={messagesPageInfo}
                messages={messages}
                loading={loading}
                handleSendMessage={sendMessage}
                handleLoadMore={loadMoreMessages}
              />
            ) : (
              renderEmptyChat()
            )}
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <>
      <ChatModal
        type={dialogType}
        open={showDialog}
        chat={currentChat}
        handleLoadNewChat={data => {
          setMessages([]);
          setMessagesPage(1);
          setCurrentChat(data);
          setTab(1);
          history.push(`/chats/${data.uuid}`);
        }}
        handleClose={() => setShowDialog(false)}
        user={user}
      />
      <Title>{i18n.t("internalChat.title")}</Title>
      <Paper className={classes.mainContainer} elevation={0}>
        {isWidthUp("md", props.width) ? renderGrid() : renderTab()}
      </Paper>
    </>
  );
}

export default withWidth()(Chat);
