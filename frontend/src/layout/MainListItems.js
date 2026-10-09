import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import CalendarToday from "@material-ui/icons/CalendarToday";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import EventIcon from "@material-ui/icons/Event";
import InfoIcon from "@material-ui/icons/Info";
import DarkMode from "../components/DarkMode";

import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import LoyaltyRoundedIcon from "@material-ui/icons/LoyaltyRounded";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import RotateRight from "@material-ui/icons/RotateRight";
import { i18n } from "../translate/i18n";
import BorderColorIcon from "@material-ui/icons/BorderColor";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { loadJSON } from "../helpers/loadJSON";

const gitinfo = loadJSON("/gitinfo.json");

const useStyles = makeStyles(theme => ({
  // Cabeçalho de seção moderno
  sectionHeader: {
    position: "relative",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#94a3b8",
    padding: theme.spacing(2, 3, 0.5, 3),
    lineHeight: 1.2,
    marginTop: 0,
    marginBottom: 0
  },

  // Estilo base dos itens de menu
  listItem: {
    margin: theme.spacing(0.25, 1.5),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: "10px",
    width: "calc(100% - 24px)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "#f1f5f9",
      transform: "translateX(2px)",
      "& $listItemIcon": {
        color: "#3b82f6" // Azul moderno
      },
      "& $listItemText": {
        color: "#0f172a"
      }
    }
  },

  // Ícone do item
  listItemIcon: {
    minWidth: "40px",
    color: "#64748b", // Cinza suave
    transition: "color 0.2s ease",
    "& svg": {
      fontSize: "20px"
    }
  },

  // Texto do item
  listItemText: {
    "& span": {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#475569",
      transition: "color 0.2s ease"
    }
  },

  // Divisória sutil
  divider: {
    margin: theme.spacing(1.5, 2),
    backgroundColor: "#f1f5f9",
    height: "1px"
  },

  // Submenu colapsável
  submenuItem: {
    margin: theme.spacing(0.25, 1.5),
    padding: theme.spacing(0.5, 1.5, 0.5, 4),
    borderRadius: "10px",
    width: "calc(100% - 24px)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "#f1f5f9",
      "& $listItemIcon": {
        color: "#3b82f6"
      }
    }
  },

  submenuCollapse: {
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      left: "32px",
      top: "0",
      bottom: "8px",
      width: "1px",
      backgroundColor: "#e2e8f0"
    }
  },

  // Badge moderno
  modernBadge: {
    "& .MuiBadge-badge": {
      backgroundColor: "#ef4444",
      color: "#ffffff",
      boxShadow: "0 0 0 2px #ffffff",
      fontSize: "0.6rem",
      fontWeight: 700,
      minWidth: "8px",
      height: "8px",
      padding: 0,
      borderRadius: "50%"
    }
  },

  // Rodapé de versão
  versionPill: {
    display: "inline-block",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "#94a3b8",
    backgroundColor: "#f8fafc",
    padding: theme.spacing(0.5, 1.5),
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
    margin: theme.spacing(1, 2),
    textAlign: "center",
    letterSpacing: "0.02em"
  },

  versionWrapper: {
    textAlign: "center",
    padding: theme.spacing(1, 0, 2, 0)
  }
}));

function ListItemLink(props) {
  const { icon, primary, to, className } = props;
  const classes = useStyles();

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li style={{ listStyle: "none" }}>
      <ListItem
        button
        component={renderLink}
        className={className || classes.listItem}
      >
        {icon ? (
          <ListItemIcon className={classes.listItemIcon}>{icon}</ListItemIcon>
        ) : null}
        <ListItemText className={classes.listItemText} primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach(chat => {
        const chatIndex = state.findIndex(u => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex(u => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex(u => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map(chat => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = props => {
  const classes = useStyles();
  const { drawerClose, drawerOpen } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openKanbanSubmenu, setOpenKanbanSubmenu] = useState(false);

  const [showCampaigns, setShowCampaigns] = useState(false);
  const history = useHistory();
  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const [version, setVersion] = useState("v N/A");

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyChatMainListItems = data => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    };

    socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems);
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter(whats => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber }
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    handleLogout();
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform={"drawer-service-items:view"}
        style={{ overflowY: "scroll" }}
        no={() => (
          <>
            <ListSubheader
              hidden={!drawerOpen}
              className={classes.sectionHeader}
              inset
              color="inherit"
              disableSticky
            >
              {i18n.t("mainDrawer.listItems.service")}
            </ListSubheader>
            <>
              <ListItemLink
                to="/tickets"
                primary={i18n.t("mainDrawer.listItems.tickets")}
                icon={<WhatsAppIcon />}
              />
              <ListItemLink
                to="/todolist"
                primary={i18n.t("mainDrawer.listItems.tasks")}
                icon={<BorderColorIcon />}
              />
              <ListItemLink
                to="/quick-messages"
                primary={i18n.t("mainDrawer.listItems.quickMessages")}
                icon={<FlashOnIcon />}
              />
              <ListItemLink
                to="/contacts"
                primary={i18n.t("mainDrawer.listItems.contacts")}
                icon={<ContactPhoneOutlinedIcon />}
              />
              <ListItemLink
                to="/schedules"
                primary={i18n.t("mainDrawer.listItems.schedules")}
                icon={<EventIcon />}
              />
              <ListItemLink
                to="/tags"
                primary={i18n.t("mainDrawer.listItems.tags")}
                icon={<LocalOfferIcon />}
              />
              <ListItemLink
                to="/chats"
                primary={i18n.t("mainDrawer.listItems.chats")}
                icon={
                  <Badge
                    color="secondary"
                    variant="dot"
                    invisible={invisible}
                    className={classes.modernBadge}
                  >
                    <ForumIcon />
                  </Badge>
                }
              />
              <ListItemLink
                to="/helps"
                primary={i18n.t("mainDrawer.listItems.helps")}
                icon={<HelpOutlineIcon />}
              />
            </>
          </>
        )}
      />

      <Can
        role={user.profile}
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <Divider className={classes.divider} />
            <ListSubheader
              hidden={!drawerOpen}
              className={classes.sectionHeader}
              inset
              color="inherit"
              disableSticky
            >
              {i18n.t("mainDrawer.listItems.management")}
            </ListSubheader>
            <ListItemLink
              small
              to="/"
              primary="Dashboard"
              icon={<DashboardOutlinedIcon />}
            />
          </>
        )}
      />
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            <Divider className={classes.divider} />
            <ListSubheader
              hidden={!drawerOpen}
              className={classes.sectionHeader}
              inset
              color="inherit"
              disableSticky
            >
              {i18n.t("mainDrawer.listItems.administration")}
            </ListSubheader>

            {showCampaigns && (
              <>
                <ListItem
                  button
                  className={classes.listItem}
                  onClick={() => setOpenCampaignSubmenu(prev => !prev)}
                >
                  <ListItemIcon className={classes.listItemIcon}>
                    <EventAvailableIcon />
                  </ListItemIcon>
                  <ListItemText
                    className={classes.listItemText}
                    primary={i18n.t("mainDrawer.listItems.campaigns")}
                  />
                  {openCampaignSubmenu ? (
                    <ExpandLessIcon style={{ color: "#64748b", fontSize: 20 }} />
                  ) : (
                    <ExpandMoreIcon style={{ color: "#64748b", fontSize: 20 }} />
                  )}
                </ListItem>
                <Collapse
                  in={openCampaignSubmenu}
                  timeout="auto"
                  unmountOnExit
                  className={classes.submenuCollapse}
                >
                  <List component="div" disablePadding>
                    <ListItem
                      onClick={() => history.push("/campaigns")}
                      button
                      className={classes.submenuItem}
                    >
                      <ListItemIcon className={classes.listItemIcon}>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText
                        className={classes.listItemText}
                        primary="Listagem"
                      />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/contact-lists")}
                      button
                      className={classes.submenuItem}
                    >
                      <ListItemIcon className={classes.listItemIcon}>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText
                        className={classes.listItemText}
                        primary="Listas de Contatos"
                      />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/campaigns-config")}
                      button
                      className={classes.submenuItem}
                    >
                      <ListItemIcon className={classes.listItemIcon}>
                        <SettingsOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText
                        className={classes.listItemText}
                        primary="Configurações"
                      />
                    </ListItem>
                  </List>
                </Collapse>
              </>
            )}
            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={<AnnouncementIcon />}
              />
            )}
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge
                  badgeContent={connectionWarning ? "!" : 0}
                  color="error"
                  className={classes.modernBadge}
                >
                  <SyncAltIcon />
                </Badge>
              }
            />
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<AccountTreeOutlinedIcon />}
            />
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<PeopleAltOutlinedIcon />}
            />
            <ListItemLink
              to="/messages-api"
              primary={i18n.t("mainDrawer.listItems.messagesAPI")}
              icon={<CodeRoundedIcon />}
            />
            <ListItemLink
              to="/financeiro"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={<LocalAtmIcon />}
            />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<SettingsOutlinedIcon />}
            />

            {drawerOpen && (
              <>
                <Divider className={classes.divider} />
                <div className={classes.versionWrapper}>
                  <Typography className={classes.versionPill}>
                    {`${gitinfo.tagName || gitinfo.branchName + " " + gitinfo.commitHash}`}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: "0.6rem",
                      color: "#cbd5e1",
                      marginTop: "4px"
                    }}
                  >
                    {gitinfo.buildTimestamp}
                  </Typography>
                </div>
              </>
            )}
          </>
        )}
      />
      <Divider className={classes.divider} />
    </div>
  );
};

export default MainListItems;
