// Dashboard.js - Com correções de idioma
import React, { useState, useEffect, useContext } from "react";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import LinearProgress from "@material-ui/core/LinearProgress";

// ICONS
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import TimerIcon from "@material-ui/icons/Timer";
import PeopleIcon from "@material-ui/icons/People";
import ChatIcon from "@material-ui/icons/Chat";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import InstagramIcon from "@material-ui/icons/Instagram";
import FacebookIcon from "@material-ui/icons/Facebook";
import MessageIcon from "@material-ui/icons/Message";
import TrendingUpIcon from "@material-ui/icons/TrendingUp";
import TrendingDownIcon from "@material-ui/icons/TrendingDown";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import AssessmentIcon from "@material-ui/icons/Assessment";
import TodayIcon from "@material-ui/icons/Today";
import DoneAllIcon from "@material-ui/icons/DoneAll";
import ScheduleIcon from "@material-ui/icons/Schedule";
import AttachMoneyIcon from "@material-ui/icons/AttachMoney";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";

import { isEmpty } from "lodash";
import moment from "moment";
import 'moment/locale/pt-br'; // <-- IMPORTANDO LOCALE PT-BR
import { i18n } from "../../translate/i18n";
import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import { loadJSON } from "../../helpers/loadJSON";

import { SmallPie } from "./SmallPie";
import { TicketCountersChart } from "./TicketCountersChart";
import { getTimezoneOffset } from "../../helpers/getTimezoneOffset.js";

import TicketzRegistry from "../../components/TicketzRegistry";
import api from "../../services/api.js";
import { SocketContext } from "../../context/Socket/SocketContext.js";
import { formatTimeInterval } from "../../helpers/formatTimeInterval.js";

const gitinfo = loadJSON("/gitinfo.json");

// Definir locale como pt-br
moment.locale('pt-br');

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(4),
    backgroundColor: theme.palette.type === "light" 
      ? "#f0f2f5" 
      : "#0a0e1a"
  },
  // Header CRM
  crmHeader: {
    padding: theme.spacing(3, 4),
    marginBottom: theme.spacing(3),
    borderRadius: 20,
    background: theme.palette.type === "light"
      ? "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
      : "linear-gradient(135deg, #141a2e 0%, #1a2240 100%)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"}`,
    boxShadow: theme.palette.type === "light"
      ? "0 2px 12px rgba(0,0,0,0.04)"
      : "0 2px 12px rgba(0,0,0,0.2)"
  },
  crmHeaderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(2)
  },
  crmTitle: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5)
  },
  crmTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff"
  },
  crmTitleText: {
    fontWeight: 700,
    fontSize: "1.5rem",
    color: theme.palette.type === "light" ? "#1a2332" : "#ffffff"
  },
  crmSubtitle: {
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.6)" : "rgba(255,255,255,0.5)",
    fontSize: "0.9rem"
  },
  crmStats: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      flexWrap: "wrap",
      gap: theme.spacing(1.5)
    }
  },
  crmStatItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: 12,
    background: theme.palette.type === "light"
      ? "rgba(0,0,0,0.03)"
      : "rgba(255,255,255,0.03)"
  },
  crmStatValue: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: theme.palette.type === "light" ? "#1a2332" : "#ffffff"
  },
  crmStatLabel: {
    fontSize: "0.8rem",
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.5)" : "rgba(255,255,255,0.4)"
  },
  crmStatDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block"
  },
  // Cards
  crmCard: {
    padding: theme.spacing(2.5),
    borderRadius: 16,
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.85)"
      : "rgba(20, 26, 46, 0.85)",
    backdropFilter: "blur(12px)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.04)"}`,
    boxShadow: theme.palette.type === "light"
      ? "0 2px 12px rgba(0,0,0,0.04)"
      : "0 2px 12px rgba(0,0,0,0.2)",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.palette.type === "light"
        ? "0 8px 24px rgba(0,0,0,0.06)"
        : "0 8px 24px rgba(0,0,0,0.3)"
    }
  },
  crmCardPrimary: {
    padding: theme.spacing(2.5),
    borderRadius: 16,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    color: "#fff",
    boxShadow: `0 8px 32px ${theme.palette.primary.main}30`,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `0 12px 40px ${theme.palette.primary.main}40`
    }
  },
  crmCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1.5)
  },
  crmCardLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.5)" : "rgba(255,255,255,0.4)"
  },
  crmCardLabelLight: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.6)"
  },
  crmCardValue: {
    fontSize: "2.2rem",
    fontWeight: 700,
    color: theme.palette.type === "light" ? "#1a2332" : "#ffffff",
    lineHeight: 1.2
  },
  crmCardValueLight: {
    fontSize: "2.2rem",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.2
  },
  crmCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme.palette.type === "light"
      ? "rgba(56, 211, 159, 0.08)"
      : "rgba(56, 211, 159, 0.12)",
    color: theme.palette.primary.main
  },
  crmCardIconLight: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.15)",
    color: "#fff"
  },
  crmCardChange: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: theme.spacing(0.25, 1),
    borderRadius: 20,
    background: theme.palette.type === "light"
      ? "rgba(0,0,0,0.04)"
      : "rgba(255,255,255,0.04)"
  },
  crmCardChangePositive: {
    color: "#22c55e"
  },
  crmCardChangeNegative: {
    color: "#ef4444"
  },
  // Channel Cards
  channelCard: {
    padding: theme.spacing(2),
    borderRadius: 12,
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.6)"
      : "rgba(20, 26, 46, 0.6)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.04)"}`,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2)
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  channelIconWhatsapp: {
    background: "#25D366",
    color: "#fff"
  },
  channelIconInstagram: {
    background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    color: "#fff"
  },
  channelIconFacebook: {
    background: "#1877f2",
    color: "#fff"
  },
  channelInfo: {
    flex: 1
  },
  channelName: {
    fontWeight: 600,
    fontSize: "0.9rem",
    color: theme.palette.type === "light" ? "#1a2332" : "#ffffff"
  },
  channelCount: {
    fontSize: "0.8rem",
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.5)" : "rgba(255,255,255,0.4)"
  },
  // Filter
  filterContainer: {
    padding: theme.spacing(2.5),
    borderRadius: 16,
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.6)"
      : "rgba(20, 26, 46, 0.6)",
    backdropFilter: "blur(8px)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.04)"}`
  },
  filterLabel: {
    fontWeight: 600,
    fontSize: "0.85rem",
    color: theme.palette.type === "light" ? "#1a2332" : "#ffffff",
    marginBottom: theme.spacing(1.5)
  },
  selectField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 12,
      background: theme.palette.type === "light"
        ? "rgba(255,255,255,0.6)"
        : "rgba(255,255,255,0.04)",
      backdropFilter: "blur(4px)"
    }
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 12,
      background: theme.palette.type === "light"
        ? "rgba(255,255,255,0.6)"
        : "rgba(255,255,255,0.04)",
      backdropFilter: "blur(4px)"
    }
  },
  // Charts
  chartPaper: {
    padding: theme.spacing(2.5),
    borderRadius: 16,
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.85)"
      : "rgba(20, 26, 46, 0.85)",
    backdropFilter: "blur(12px)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.04)"}`,
    boxShadow: theme.palette.type === "light"
      ? "0 2px 12px rgba(0,0,0,0.04)"
      : "0 2px 12px rgba(0,0,0,0.2)",
    height: 260,
    overflowY: "auto",
    ...theme.scrollbarStyles
  },
  ticketzRegistryPaper: {
    padding: theme.spacing(2.5),
    borderRadius: 16,
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.85)"
      : "rgba(20, 26, 46, 0.85)",
    backdropFilter: "blur(12px)",
    border: `2px solid ${theme.palette.primary.main}`,
    marginBottom: theme.spacing(2),
    boxShadow: theme.palette.type === "light"
      ? "0 4px 24px rgba(56, 211, 159, 0.08)"
      : "0 4px 24px rgba(56, 211, 159, 0.04)",
    ...theme.scrollbarStyles
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  progressBar: {
    height: 6,
    borderRadius: 4,
    marginTop: 12
  }
}));

const Dashboard = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [period, setPeriod] = useState(0);
  const [currentUser, setCurrentUser] = useState({});
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DDTHH") + ":00"
  );
  const [dateTo, setDateTo] = useState(
    moment().format("YYYY-MM-DDTHH") + ":59"
  );
  const { getCurrentUserInfo } = useAuth();

  const [registered, setRegistered] = useState(false);

  const [usersOnlineTotal, setUsersOnlineTotal] = useState(0);
  const [usersOfflineTotal, setUsersOfflineTotal] = useState(0);
  const [usersStatusChartData, setUsersStatusChartData] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingChartData, setPendingChartData] = useState([]);
  const [openedTotal, setOpenedTotal] = useState(0);
  const [openedChartData, setOpenedChartData] = useState([]);

  const [ticketsData, setTicketsData] = useState({});
  const [usersData, setUsersData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const socketManager = useContext(SocketContext);
  const companyId = localStorage.getItem("companyId");

  useEffect(() => {
    const socket = socketManager.GetSocket(companyId);

    socket.on("userOnlineChange", updateStatus);
    socket.on("counter", updateStatus);

    return () => {
      socket.disconnect();
    };
  }, [socketManager, companyId]);

  useEffect(() => {
    getCurrentUserInfo().then(user => {
      if (user?.profile !== "admin") {
        window.location.href = "/tickets";
      }
      setCurrentUser(user);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.get("/ticketz/registry").then(result => {
      const registry = result.data;
      setRegistered(registry?.disabled || !!registry?.whatsapp);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [period]);

  async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function updateStatus() {
    api
      .get("/dashboard/status")
      .then(result => {
        const { data } = result;

        if (!data) return;

        let usersOnlineTotal = 0;
        let usersOfflineTotal = 0;
        data.usersStatusSummary.forEach(item => {
          if (item.online) {
            usersOnlineTotal++;
          } else {
            usersOfflineTotal++;
          }
        });

        setUsersStatusChartData([
          {
            name: "Online",
            value: usersOnlineTotal,
            color: "#00ff00"
          },
          {
            name: "Offline",
            value: usersOfflineTotal,
            color: "#ff0000"
          }
        ]);

        setUsersOnlineTotal(usersOnlineTotal);
        setUsersOfflineTotal(usersOfflineTotal);

        let pendingTotal = 0;
        let openedTotal = 0;
        const pendingChartData = [];
        const openedChartData = [];
        data.ticketsStatusSummary.forEach(item => {
          if (item.status === "pending") {
            pendingTotal += Number(item.count);
            pendingChartData.push({
              name: item.queue?.name || i18n.t("common.noqueue"),
              value: Number(item.count),
              color: item.queue?.color || "#888"
            });
            return;
          }
          if (item.status === "open") {
            openedTotal += Number(item.count);
            openedChartData.push({
              name: item.queue?.name || i18n.t("common.noqueue"),
              value: Number(item.count),
              color: item.queue?.color || "#888"
            });
          }
        });
        setPendingTotal(pendingTotal);
        setPendingChartData(pendingChartData);
        setOpenedTotal(openedTotal);
        setOpenedChartData(openedChartData);
      })
      .catch(() => {});
  }

  async function fetchData() {
    let params = { tz: getTimezoneOffset() };

    const days = Number(period);

    if (days) {
      params = {
        date_from: moment().subtract(days, "days").format("YYYY-MM-DD"),
        date_to: moment().format("YYYY-MM-DD")
      };
    }

    if (!days && !isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = {
        ...params,
        date_from: moment(dateFrom).format("YYYY-MM-DD"),
        hour_from: moment(dateFrom).format("HH:mm:ss")
      };
    }

    if (!days && !isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = {
        ...params,
        date_to: moment(dateTo).format("YYYY-MM-DD"),
        hour_to: moment(dateTo).format("HH:mm:ss")
      };
    }

    if (Object.keys(params).length === 0) {
      toast.error(i18n.t("dashboard.filter.invalid"));
      return;
    }

    api
      .get("/dashboard/tickets", { params })
      .then(result => {
        if (result?.data) {
          setTicketsData(result.data);
        }
      })
      .catch(() => {});

    setLoadingUsers(true);
    api
      .get("/dashboard/users", { params })
      .then(result => {
        if (result?.data) {
          setUsersData(result.data);
          setLoadingUsers(false);
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    updateStatus();
  }, []);

  function renderFilters() {
    return (
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl className={classes.selectField} fullWidth>
            <InputLabel id="period-selector-label">
              {i18n.t("dashboard.filter.period")}
            </InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              value={period}
              onChange={e => handleChangePeriod(e.target.value)}
            >
              <MenuItem value={0}>{i18n.t("dashboard.filter.custom")}</MenuItem>
              <MenuItem value={3}>{i18n.t("dashboard.filter.last3days")}</MenuItem>
              <MenuItem value={7}>{i18n.t("dashboard.filter.last7days")}</MenuItem>
              <MenuItem value={15}>{i18n.t("dashboard.filter.last14days")}</MenuItem>
              <MenuItem value={30}>{i18n.t("dashboard.filter.last30days")}</MenuItem>
              <MenuItem value={90}>{i18n.t("dashboard.filter.last90days")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {!period && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label={i18n.t("dashboard.date.start")}
                type="datetime-local"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                onBlur={fetchData}
                className={classes.textField}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label={i18n.t("dashboard.date.end")}
                type="datetime-local"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                onBlur={fetchData}
                className={classes.textField}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        )}
        <Grid item xs={12} sm={6} md={period ? 9 : 3} />
      </Grid>
    );
  }

  if (currentUser?.profile !== "admin") {
    return <div></div>;
  }

  const totalTickets = (ticketsData.ticketStatistics?.totalClosed || 0) + pendingTotal + openedTotal;

  // Formatar data em português do Brasil
  const formattedDate = moment().format('dddd, DD [de] MMMM [de] YYYY');

  return (
    <div className={classes.container}>
      <Container maxWidth="lg">
        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <Grid container spacing={3}>
              {!localStorage.getItem("hideAds") && !registered && (
                <Grid item xs={12}>
                  <Paper className={classes.ticketzRegistryPaper}>
                    <TicketzRegistry onRegister={setRegistered} />
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        />

        {/* CRM HEADER */}
        <Paper className={classes.crmHeader} elevation={0}>
          <div className={classes.crmHeaderTop}>
            <div>
              <div className={classes.crmTitle}>
                <div className={classes.crmTitleIcon}>
                  <ChatIcon />
                </div>
                <div>
                  <Typography className={classes.crmTitleText}>
                    CRM - CNRO
                  </Typography>
                  <Typography className={classes.crmSubtitle}>
                    {formattedDate}
                  </Typography>
                </div>
              </div>
            </div>
            <div className={classes.crmStats}>
              <div className={classes.crmStatItem}>
                <span className={classes.crmStatDot} style={{ background: "#22c55e" }} />
                <span>
                  <span className={classes.crmStatValue}>{usersOnlineTotal}</span>
                  <span className={classes.crmStatLabel}> online</span>
                </span>
              </div>
              <div className={classes.crmStatItem}>
                <span className={classes.crmStatDot} style={{ background: "#f59e0b" }} />
                <span>
                  <span className={classes.crmStatValue}>{pendingTotal}</span>
                  <span className={classes.crmStatLabel}> espera</span>
                </span>
              </div>
              <div className={classes.crmStatItem}>
                <span className={classes.crmStatDot} style={{ background: "#3b82f6" }} />
                <span>
                  <span className={classes.crmStatValue}>{openedTotal}</span>
                  <span className={classes.crmStatLabel}> ativos</span>
                </span>
              </div>
            </div>
          </div>
        </Paper>

        {/* METRIC CARDS */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper className={classes.crmCardPrimary}>
              <div className={classes.crmCardHeader}>
                <Typography className={classes.crmCardLabelLight}>
                  Total de Conversas
                </Typography>
                <div className={classes.crmCardIconLight}>
                  <ChatIcon />
                </div>
              </div>
              <Typography className={classes.crmCardValueLight}>
                {totalTickets}
              </Typography>
              <Typography style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 4 }}>
                {i18n.t("dashboard.ticketsDone") || "Atendimentos realizados"}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper className={classes.crmCard}>
              <div className={classes.crmCardHeader}>
                <Typography className={classes.crmCardLabel}>
                  {i18n.t("dashboard.ticketsDone") || "Atendimentos Finalizados"}
                </Typography>
                <div className={classes.crmCardIcon}>
                  <DoneAllIcon />
                </div>
              </div>
              <Typography className={classes.crmCardValue}>
                {ticketsData.ticketStatistics?.totalClosed || 0}
              </Typography>
              <div className={classes.crmCardChange}>
                <TrendingUpIcon style={{ fontSize: 14, color: "#22c55e" }} />
                <span className={classes.crmCardChangePositive}>+12%</span>
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper className={classes.crmCard}>
              <div className={classes.crmCardHeader}>
                <Typography className={classes.crmCardLabel}>
                  {i18n.t("dashboard.avgServiceTime") || "T.M. Atendimento"}
                </Typography>
                <div className={classes.crmCardIcon}>
                  <TimerIcon />
                </div>
              </div>
              <Typography className={classes.crmCardValue}>
                {formatTimeInterval(ticketsData.ticketStatistics?.avgServiceTime) || "0min"}
              </Typography>
              <div className={classes.crmCardChange}>
                <TrendingDownIcon style={{ fontSize: 14, color: "#22c55e" }} />
                <span className={classes.crmCardChangePositive}>-8%</span>
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper className={classes.crmCard}>
              <div className={classes.crmCardHeader}>
                <Typography className={classes.crmCardLabel}>
                  {i18n.t("dashboard.newContacts") || "Novos Contatos"}
                </Typography>
                <div className={classes.crmCardIcon}>
                  <GroupAddIcon />
                </div>
              </div>
              <Typography className={classes.crmCardValue}>
                {ticketsData.ticketStatistics?.newContacts || 0}
              </Typography>
              <div className={classes.crmCardChange}>
                <TrendingUpIcon style={{ fontSize: 14, color: "#22c55e" }} />
                <span className={classes.crmCardChangePositive}>+5%</span>
              </div>
            </Paper>
          </Grid>
        </Grid>

        {/* FILTROS */}
        <Grid container spacing={3} style={{ marginTop: 4 }}>
          <Grid item xs={12}>
            <Paper className={classes.filterContainer}>
              <Typography className={classes.filterLabel}>
                <AccessTimeIcon style={{ verticalAlign: "middle", marginRight: 8, fontSize: 18 }} />
                {i18n.t("dashboard.filter.period") || "Filtrar por período"}
              </Typography>
              {renderFilters()}
            </Paper>
          </Grid>
        </Grid>

        {/* CHARTS ROW */}
        <Grid container spacing={3} style={{ marginTop: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper className={classes.chartPaper}>
              <TicketCountersChart ticketCounters={ticketsData.ticketCounters} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper className={classes.crmCard}>
                  <div className={classes.crmCardHeader}>
                    <Typography className={classes.crmCardLabel}>
                      {i18n.t("dashboard.ticketsWaiting") || "Fila de Espera"}
                    </Typography>
                  </div>
                  <Typography className={classes.crmCardValue} style={{ fontSize: "1.8rem" }}>
                    {pendingTotal}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={totalTickets > 0 ? (pendingTotal / totalTickets) * 100 : 0}
                    className={classes.progressBar}
                    style={{
                      backgroundColor: theme.palette.type === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <Typography variant="caption" style={{ opacity: 0.5 }}>
                      {i18n.t("dashboard.ticketsOpen") || "Em atendimento"}: {openedTotal}
                    </Typography>
                    <Typography variant="caption" style={{ opacity: 0.5 }}>
                      {Math.round(totalTickets > 0 ? (pendingTotal / totalTickets) * 100 : 0)}%
                    </Typography>
                  </div>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* USER REPORT */}
        <Grid container spacing={3} style={{ marginTop: 4 }}>
          <Grid item xs={12}>
            {usersData.userReport?.length ? (
              <TableAttendantsStatus
                attendants={usersData.userReport}
                loading={loadingUsers}
              />
            ) : null}
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;
