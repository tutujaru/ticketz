import React, { useState, useEffect } from "react";

import {
  Paper,
  Container,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  FormHelperText,
  Typography,
} from "@material-ui/core";

import {
  Call as CallIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  AccessAlarm as AccessAlarmIcon,
  Timer as TimerIcon,
} from "@material-ui/icons";

import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";
import moment from "moment";
import { isArray, isEmpty } from "lodash";
import clsx from "clsx";

import Chart from "./Chart";
import ButtonWithSpinner from "../../components/ButtonWithSpinner";
import CardCounter from "../../components/Dashboard/CardCounter";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import useDashboard from "../../hooks/useDashboard";
import useCompanies from "../../hooks/useCompanies";
import useAuth from "../../hooks/useAuth.js";
import { loadJSON } from "../../helpers/loadJSON";
import config from "../../services/config";
import api from "../../services/api.js";

const gitinfo = loadJSON('/gitinfo.json');

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  alignRight: {
    textAlign: "right",
  },
  card: (color) => ({
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    backgroundColor: color,
    color: "#eee",
  }),
}));

const Dashboard = () => {
  const classes = useStyles();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [companyDueDate, setCompanyDueDate] = useState();
  const [currentUser, setCurrentUser] = useState({});
  const [dateFrom, setDateFrom] = useState(moment("1", "D").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);

  const { find } = useDashboard();
  const { finding } = useCompanies();
  const { getCurrentUserInfo } = useAuth();

  useEffect(() => {
    getCurrentUserInfo().then((user) => {
      if (user?.profile !== "admin") {
        window.location.href = "/tickets";
      }
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData();
    };
    setTimeout(loadInitialData, 1000);
  }, []);

  useEffect(() => {
    loadCompanies();
  }, []);

  const companyId = localStorage.getItem("companyId");
  const loadCompanies = async () => {
    setLoading(true);
    try {
      const companiesList = await finding(companyId);
      setCompanyDueDate(moment(companiesList.dueDate).format("DD/MM/yyyy"));
    } catch (e) {
      console.error("Erro ao carregar empresas:", e);
    }
    setLoading(false);
  };

  const handleChangePeriod = (value) => setPeriod(value);
  const handleChangeFilterType = (value) => {
    setFilterType(value);
    if (value === 1) {
      setPeriod(0);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };

  const fetchData = async () => {
    setLoading(true);

    let params = {};
    if (period > 0) params.days = period;
    if (!isEmpty(dateFrom) && moment(dateFrom).isValid()) params.date_from = dateFrom;
    if (!isEmpty(dateTo) && moment(dateTo).isValid()) params.date_to = dateTo;

    if (Object.keys(params).length === 0) {
      toast.error("Parametrize o filtro");
      setLoading(false);
      return;
    }

    const data = await find(params);
    if (data) {
      setCounters(data.counters);
      setAttendants(isArray(data.attendants) ? data.attendants : []);
    }

    setLoading(false);
  };

  const renderFilters = () => {
    if (filterType === 1) {
      return (
        <>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Data Inicial"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Data Final"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </>
      );
    } else {
      return (
        <Grid item xs={12} sm={6} md={4}>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="period-selector-label">Período</InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              value={period}
              onChange={(e) => handleChangePeriod(e.target.value)}
            >
              <MenuItem value={0}>Nenhum selecionado</MenuItem>
              <MenuItem value={3}>Últimos 3 dias</MenuItem>
              <MenuItem value={7}>Últimos 7 dias</MenuItem>
              <MenuItem value={15}>Últimos 15 dias</MenuItem>
              <MenuItem value={30}>Últimos 30 dias</MenuItem>
              <MenuItem value={60}>Últimos 60 dias</MenuItem>
              <MenuItem value={90}>Últimos 90 dias</MenuItem>
            </Select>
            <FormHelperText>Selecione o período desejado</FormHelperText>
          </FormControl>
        </Grid>
      );
    }
  };

  if (currentUser?.profile !== "admin") return <></>;

  return (
    <Container maxWidth="lg" className={classes.container}>
      <Grid container spacing={3} justifyContent="flex-end">
        <Grid item xs={12}>
          <Paper className={classes.fixedHeightPaper}>
            <Chart />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="filter-type-label">Tipo de Filtro</InputLabel>
            <Select
              labelId="filter-type-label"
              value={filterType}
              onChange={(e) => handleChangeFilterType(e.target.value)}
            >
              <MenuItem value={1}>Filtro por Data</MenuItem>
              <MenuItem value={2}>Filtro por Período</MenuItem>
            </Select>
            <FormHelperText>Selecione o tipo de filtro</FormHelperText>
          </FormControl>
        </Grid>

        {renderFilters()}

        <Grid item xs={12} className={classes.alignRight}>
          <ButtonWithSpinner
            loading={loading}
            onClick={fetchData}
            variant="contained"
            color="primary"
          >
            Filtrar
          </ButtonWithSpinner>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper className={classes.card("#0094bb")} elevation={4}>
            <Typography component="h3" variant="h6" paragraph>
              Atd. Pendentes
            </Typography>
            <Typography component="h1" variant="h4">
              {counters.supportPending}
            </Typography>
            <CallIcon style={{ fontSize: 100, color: "#0b708c" }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper className={classes.card("#748e9d")} elevation={4}>
            <Typography component="h3" variant="h6" paragraph>
              Atd. Acontecendo
            </Typography>
            <Typography component="h1" variant="h4">
              {counters.supportHappening}
            </Typography>
            <HourglassEmptyIcon style={{ fontSize: 100, color: "#47606e" }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper className={classes.card("#7f78e6")} elevation={4}>
            <Typography component="h3" variant="h6" paragraph>
              Finalizados
            </Typography>
            <Typography component="h1" variant="h4">
              {counters.supportFinished}
            </Typography>
            <CheckCircleIcon style={{ fontSize: 100, color: "#4d3fa6" }} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
