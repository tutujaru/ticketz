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
import Box from "@material-ui/core/Box";

// ICONS
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import TimerIcon from "@material-ui/icons/Timer";

import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";

import { isEmpty } from "lodash";
import moment from "moment";
import { i18n } from "../../translate/i18n";
import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import { loadJSON } from "../../helpers/loadJSON";

import { SmallPie } from "./SmallPie";
import { TicketCountersChart } from "./TicketCountersChart";
import { getTimezoneOffset } from "../../helpers/getTimezoneOffset.js";

import TicketzRegistry from "../../components/TicketzRegistry";
import ContainerUpdatesBanner from "../../components/Dashboard/ContainerUpdatesBanner";
import api from "../../services/api.js";
import config from "../../services/config.js";
import { SocketContext } from "../../context/Socket/SocketContext.js";
import { formatTimeInterval } from "../../helpers/formatTimeInterval.js";

const gitinfo = loadJSON("/gitinfo.json");

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    minHeight: "100vh",
    backgroundColor: "#f4f7f9" // Fundo moderno e suave
  },
  pageTitle: {
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: theme.spacing(3),
    fontSize: "1.75rem"
  },
  // Estilo base para todos os cards (substitui cardSolid e cardGray)
  modernCard: {
    padding: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
    height: "100%",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.08)"
    }
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: theme.spacing(1)
  },
  cardTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: 0
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0
  },
  cardIconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#eff6ff", // Azul bem claro
    color: "#3b82f6", // Azul vibrante
    "& svg": {
      fontSize: "24px"
    }
  },
  // Ajuste para o gráfico de rosca
  cardRingGraph: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing(2),
    height: "100px"
  },
  // Estilos dos Filtros
  filterContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: theme.spacing(2),
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9",
    marginBottom: theme.spacing(3)
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px"
    }
  },
  fullWidth: {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px"
    }
  },
  // Estilo para o container do gráfico principal
  chartPaper: {
    padding: theme.spacing(3),
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9",
    minHeight: "350px",
    display: "flex",
    flexDirection: "column"
  },
  // Estilo para o container da tabela
  tablePaper: {
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9",
    overflow: "hidden"
  }
}));

// Componente InfoCard reestilizado
const InfoCard = ({ title, value, icon }) => {
  const classes = useStyles();

  return (
    <Grid item xs={12} sm={6} md={3}>
      <Paper className={classes.modernCard} elevation={0}>
        <div className={classes.cardHeader}>
          <Typography className={classes.cardTitle}>{title}</Typography>
          <div className={classes.cardIconWrapper}>{icon}</div>
        </div>
        <Typography className={classes.cardValue}>{value}</Typography>
      </Paper>
    </Grid>
  );
};

// Componente InfoRingCard reestilizado
const InfoRingCard = ({ title, value, graph }) => {
  const classes = useStyles();
  return (
    <Grid item xs={12} sm={4}>
      <Paper className={classes.modernCard} elevation={0}>
        <div className={classes.cardHeader}>
          <Typography className={classes.cardTitle}>{title}</Typography>
        </div>
        <Typography className={classes.cardValue}>{value}</Typography>
        <div className={classes.cardRingGraph}>
          <div style={{ width: "100px", height: "100px" }}>{graph}</div>
        </div>
      </Paper>
    </Grid>
  );
};

const Dashboard = () => {
  const classes = useStyles();
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
            color: "#10b981" // Verde moderno
          },
          {
            name: "Offline",
            value: usersOfflineTotal,
            color: "#ef4444" // Vermelho moderno
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
      <Grid item xs={12}>
        <Paper className={classes.filterContainer} elevation={0}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl
                variant="outlined"
                className={classes.selectContainer}
              >
                <InputLabel id="period-selector-label">
                  {i18n.t("dashboard.filter.period")}
                </InputLabel>
                <Select
                  labelId="period-selector-label"
                  id="period-selector"
                  value={period}
                  onChange={e => handleChangePeriod(e.target.value)}
                  label={i18n.t("dashboard.filter.period")}
                >
                  <MenuItem value={0}>
                    {i18n.t("dashboard.filter.custom")}
                  </MenuItem>
                  <MenuItem value={3}>
                    {i18n.t("dashboard.filter.last3days")}
                  </MenuItem>
                  <MenuItem value={7}>
                    {i18n.t("dashboard.filter.last7days")}
                  </MenuItem>
                  <MenuItem value={15}>
                    {i18n.t("dashboard.filter.last14days")}
                  </MenuItem>
                  <MenuItem value={30}>
                    {i18n.t("dashboard.filter.last30days")}
                  </MenuItem>
                  <MenuItem value={90}>
                    {i18n.t("dashboard.filter.last90days")}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {!period && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    variant="outlined"
                    label={i18n.t("dashboard.date.start")}
                    type="datetime-local"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    onBlur={fetchData}
                    className={classes.fullWidth}
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    variant="outlined"
                    label={i18n.t("dashboard.date.end")}
                    type="datetime-local"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    onBlur={fetchData}
                    className={classes.fullWidth}
                    InputLabelProps={{
                      shrink: true
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
      </Grid>
    );
  }

  if (currentUser?.profile !== "admin") {
    return <div></div>;
  }

  return (
    <div className={classes.container}>
      <Container maxWidth="lg">
        <Typography className={classes.pageTitle}>
          Visão Geral do Dashboard
        </Typography>

        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <>
              <Grid container spacing={3} justifyContent="flex-start">
                {config.TZAUTOINSTALLER === "1" && <ContainerUpdatesBanner />}
                {!localStorage.getItem("hideAds") && (
                  <>
                    <Grid item xs={12}>
                      {!registered && (
                        <Paper
                          className={classes.modernCard}
                          style={{ marginBottom: "1.5rem" }}
                          elevation={0}
                        >
                          <TicketzRegistry onRegister={setRegistered} />
                        </Paper>
                      )}
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}
        />

        <Grid container spacing={3} justifyContent="flex-start">
          {/* USUARIOS ONLINE */}
          <InfoRingCard
            title={i18n.t("dashboard.usersOnline")}
            value={`${usersOnlineTotal}/${usersOnlineTotal + usersOfflineTotal}`}
            graph={<SmallPie chartData={usersStatusChartData} />}
          />

          {/* ATENDIMENTOS PENDENTES */}
          <InfoRingCard
            title={i18n.t("dashboard.ticketsWaiting")}
            value={pendingTotal}
            graph={<SmallPie chartData={pendingChartData} />}
          />

          {/* ATENDIMENTOS ACONTECENDO */}
          <InfoRingCard
            title={i18n.t("dashboard.ticketsOpen")}
            value={openedTotal}
            graph={<SmallPie chartData={openedChartData} />}
          />

          {/* FILTROS */}
          {renderFilters()}

          {/* ATENDIMENTOS REALIZADOS */}
          <InfoCard
            title={i18n.t("dashboard.ticketsDone")}
            value={ticketsData.ticketStatistics?.totalClosed || 0}
            icon={<CheckCircleIcon />}
          />

          {/* NOVOS CONTATOS */}
          <InfoCard
            title={i18n.t("dashboard.newContacts")}
            value={ticketsData.ticketStatistics?.newContacts || 0}
            icon={<GroupAddIcon />}
          />

          {/* T.M. DE ATENDIMENTO */}
          <InfoCard
            title={i18n.t("dashboard.avgServiceTime")}
            value={formatTimeInterval(
              ticketsData.ticketStatistics?.avgServiceTime
            )}
            icon={<TimerIcon />}
          />

          {/* T.M. DE ESPERA */}
          <InfoCard
            title={i18n.t("dashboard.avgWaitTime")}
            value={formatTimeInterval(
              ticketsData.ticketStatistics?.avgWaitTime
            )}
            icon={<HourglassEmptyIcon />}
          />

          {/* DASHBOARD ATENDIMENTOS NO PERÍODO */}
          <Grid item xs={12}>
            <Paper className={classes.chartPaper} elevation={0}>
              <Typography className={classes.cardTitle} style={{ marginBottom: 16 }}>
                Atendimentos no Período
              </Typography>
              <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                <TicketCountersChart
                  ticketCounters={ticketsData.ticketCounters}
                />
              </Box>
            </Paper>
          </Grid>

          {/* USER REPORT */}
          <Grid item xs={12}>
            {usersData.userReport?.length ? (
              <Paper className={classes.tablePaper} elevation={0}>
                <TableAttendantsStatus
                  attendants={usersData.userReport}
                  loading={loadingUsers}
                />
              </Paper>
            ) : null}
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;
