import React, { useState, useEffect } from "react";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import {
  makeStyles,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Box,
  Typography
} from "@material-ui/core";

import TabPanel from "../../components/TabPanel";

import SchedulesForm from "../../components/SchedulesForm";
import CompaniesManager from "../../components/CompaniesManager";
import PlansManager from "../../components/PlansManager";
import HelpsManager from "../../components/HelpsManager";
import ContainersManager from "../../components/ContainersManager";
import Options from "../../components/Settings/Options";
import Whitelabel from "../../components/Settings/Whitelabel";
import PaymentGateway from "../../components/Settings/PaymentGateway";
import I18nSettings from "../../components/Settings/I18nSettings";

import { i18n } from "../../translate/i18n.js";
import { toast } from "react-toastify";

import useCompanies from "../../hooks/useCompanies";
import useAuth from "../../hooks/useAuth.js";
import useSettings from "../../hooks/useSettings";
import config from "../../services/config.js";

import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import OpenHoursEditor from "../../components/OpenHoursEditor";
import WarningIcon from "@material-ui/icons/Warning";

// Helper to check if value is OpenHours format or empty
const isOpenHoursFormat = schedules => {
  if (!schedules || Object.keys(schedules).length === 0) return true;
  return (
    typeof schedules === "object" &&
    Array.isArray(schedules.weeklyRules) &&
    Array.isArray(schedules.overrides)
  );
};

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1
  },
  mainPaper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9",
    overflow: "hidden"
  },
  // Tabs modernizadas
  tabsWrapper: {
    padding: theme.spacing(0, 2),
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#ffffff"
  },
  tab: {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    letterSpacing: "0.02em",
    minHeight: "52px",
    minWidth: "auto",
    padding: theme.spacing(1.5, 2),
    color: "#64748b",
    transition: "all 0.2s ease",
    "&:hover": {
      color: "#3b82f6",
      backgroundColor: "#f8fafc"
    },
    "&.Mui-selected": {
      color: "#3b82f6",
      fontWeight: 700
    }
  },
  tabIndicator: {
    height: 3,
    borderRadius: "3px 3px 0 0",
    backgroundColor: "#3b82f6"
  },
  // Área de conteúdo
  contentArea: {
    flex: 1,
    padding: theme.spacing(3),
    overflowY: "auto",
    backgroundColor: "#ffffff",
    ...theme.scrollbarStyles
  },
  container: {
    width: "100%",
    maxHeight: "100%"
  },
  control: {
    padding: theme.spacing(1)
  },
  textfield: {
    width: "100%"
  },
  // Botão de salvar moderno
  saveButton: {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 600,
    padding: theme.spacing(1.2, 4),
    boxShadow: "0px 4px 12px rgba(59, 130, 246, 0.25)",
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: "0px 6px 16px rgba(59, 130, 246, 0.35)",
      transform: "translateY(-1px)"
    }
  },
  // Caixa de alerta para migração de formato
  migrationAlert: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "12px",
    marginBottom: theme.spacing(3)
  },
  migrationIcon: {
    color: "#f59e0b",
    fontSize: "2rem",
    flexShrink: 0
  },
  migrationContent: {
    flex: 1
  },
  migrationTitle: {
    fontWeight: 700,
    color: "#92400e",
    fontSize: "0.95rem",
    marginBottom: theme.spacing(0.5)
  },
  migrationText: {
    color: "#78350f",
    fontSize: "0.875rem",
    lineHeight: 1.6,
    marginBottom: theme.spacing(2)
  },
  migrationButton: {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 600,
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    padding: theme.spacing(1, 3),
    boxShadow: "0px 4px 12px rgba(245, 158, 11, 0.25)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#d97706",
      boxShadow: "0px 6px 16px rgba(245, 158, 11, 0.35)",
      transform: "translateY(-1px)"
    }
  },
  // Wrapper do botão salvar
  saveWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: "1px solid #f1f5f9"
  }
}));

const SettingsCustom = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("options");
  const [schedules, setSchedules] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [settings, setSettings] = useState({});
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);

  const { getCurrentUserInfo } = useAuth();
  const { find, updateSchedules } = useCompanies();
  const { getAll: getAllSettings } = useSettings();

  useEffect(() => {
    async function findData() {
      setLoading(true);
      try {
        const companyId = localStorage.getItem("companyId");
        const company = await find(companyId);
        const settingList = await getAllSettings();
        setCompany(company);
        setSchedules(company.schedules);
        setSettings(settingList);

        if (Array.isArray(settingList)) {
          const scheduleType = settingList.find(d => d.key === "scheduleType");
          if (scheduleType) {
            setSchedulesEnabled(scheduleType.value === "company");
          }
        }

        const user = await getCurrentUserInfo();
        setCurrentUser(user);
      } catch (e) {
        toast.error(e);
      }
      setLoading(false);
    }
    findData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (event, newValue) => {
    async function findData() {
      setLoading(true);
      try {
        const companyId = localStorage.getItem("companyId");
        const company = await find(companyId);
        const settingList = await getAllSettings();
        setCompany(company);
        setSchedules(company.schedules);
        setSettings(settingList);

        if (Array.isArray(settingList)) {
          const scheduleType = settingList.find(d => d.key === "scheduleType");
          if (scheduleType) {
            setSchedulesEnabled(scheduleType.value === "company");
          }
        }

        const user = await getCurrentUserInfo();
        setCurrentUser(user);
      } catch (e) {
        toast.error(e);
      }
      setLoading(false);
    }
    findData();
    // eslint-disable-next-line react-hooks/exhaustive-deps

    setTab(newValue);
  };

  const handleSubmitSchedules = async data => {
    setLoading(true);
    try {
      setSchedules(data);
      await updateSchedules({ id: company.id, schedules: data });
      toast.success("Horários atualizados com sucesso.");
    } catch (e) {
      toast.error(e);
    }
    setLoading(false);
  };

  const isSuper = () => {
    return currentUser.super;
  };

  return (
    <MainContainer className={classes.root}>
      <MainHeader>
        <Title>{i18n.t("settings.title")}</Title>
      </MainHeader>

      <Paper className={classes.mainPaper} elevation={0}>
        {/* Tabs Modernizadas */}
        <div className={classes.tabsWrapper}>
          <Tabs
            value={tab}
            textColor="primary"
            scrollButtons="on"
            variant="scrollable"
            onChange={handleTabChange}
            TabIndicatorProps={{ className: classes.tabIndicator }}
          >
            <Tab
              label={i18n.t("settings.Options.title")}
              value={"options"}
              className={classes.tab}
            />
            {schedulesEnabled && (
              <Tab
                label={i18n.t("settings.schedules.title")}
                value={"schedules"}
                className={classes.tab}
              />
            )}
            {isSuper() && (
              <Tab
                label={i18n.t("settings.Companies.title")}
                value={"companies"}
                className={classes.tab}
              />
            )}
            {isSuper() && (
              <Tab
                label={i18n.t("settings.Plans.title")}
                value={"plans"}
                className={classes.tab}
              />
            )}
            {isSuper() && (
              <Tab
                label={i18n.t("settings.Help.title")}
                value={"helps"}
                className={classes.tab}
              />
            )}
            {isSuper() && (
              <Tab
                label={i18n.t("settings.Whitelabel.title")}
                value={"whitelabel"}
                className={classes.tab}
              />
            )}
            {isSuper() && (
              <Tab
                label={i18n.t("settings.PaymentGateways.title")}
                value={"paymentGateway"}
                className={classes.tab}
              />
            )}
            {isSuper() && (
              <Tab
                label={i18n.t("settings.i18nSettings.title")}
                value={"i18n"}
                className={classes.tab}
              />
            )}
            {isSuper() && config.TZAUTOINSTALLER === "1" && (
              <Tab
                label={i18n.t("settings.docker.title")}
                value={"containers"}
                className={classes.tab}
              />
            )}
          </Tabs>
        </div>

        {/* Área de Conteúdo */}
        <div className={classes.contentArea}>
          <TabPanel
            className={classes.container}
            value={tab}
            name={"schedules"}
          >
            {isOpenHoursFormat(schedules) ? (
              <>
                <OpenHoursEditor value={schedules} onChange={setSchedules} />
                <div className={classes.saveWrapper}>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.saveButton}
                    onClick={() => handleSubmitSchedules(schedules)}
                    disabled={loading}
                  >
                    {loading
                      ? i18n.t("settings.saving")
                      : i18n.t("common.save")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Box className={classes.migrationAlert}>
                  <WarningIcon className={classes.migrationIcon} />
                  <div className={classes.migrationContent}>
                    <Typography className={classes.migrationTitle}>
                      Formato antigo detectado
                    </Typography>
                    <Typography className={classes.migrationText}>
                      Os horários salvos estão em um formato antigo. Recomendamos
                      atualizar para o novo formato para aproveitar todos os
                      recursos disponíveis.
                    </Typography>
                    <Button
                      variant="contained"
                      className={classes.migrationButton}
                      onClick={() => setSchedules({})}
                      disabled={loading}
                    >
                      Atualizar para novo formato
                    </Button>
                  </div>
                </Box>
                <SchedulesForm
                  loading={loading}
                  onSubmit={handleSubmitSchedules}
                  initialValues={schedules}
                />
              </>
            )}
          </TabPanel>

          <OnlyForSuperUser
            user={currentUser}
            yes={() => (
              <>
                <TabPanel
                  className={classes.container}
                  value={tab}
                  name={"whitelabel"}
                >
                  <Whitelabel settings={settings} />
                </TabPanel>
                <TabPanel
                  className={classes.container}
                  value={tab}
                  name={"paymentGateway"}
                >
                  <PaymentGateway settings={settings} />
                </TabPanel>
                <TabPanel
                  className={classes.container}
                  value={tab}
                  name={"i18n"}
                >
                  <I18nSettings />
                </TabPanel>
                {config.TZAUTOINSTALLER === "1" && (
                  <TabPanel
                    className={classes.container}
                    value={tab}
                    name={"containers"}
                  >
                    <ContainersManager />
                  </TabPanel>
                )}
                <TabPanel
                  className={classes.container}
                  value={tab}
                  name={"companies"}
                >
                  <CompaniesManager />
                </TabPanel>
                <TabPanel
                  className={classes.container}
                  value={tab}
                  name={"plans"}
                >
                  <PlansManager />
                </TabPanel>
                <TabPanel
                  className={classes.container}
                  value={tab}
                  name={"helps"}
                >
                  <HelpsManager />
                </TabPanel>
              </>
            )}
          />

          <TabPanel
            className={classes.container}
            value={tab}
            name={"options"}
          >
            <Options
              settings={settings}
              scheduleTypeChanged={value =>
                setSchedulesEnabled(value === "company")
              }
            />
          </TabPanel>
        </div>
      </Paper>
    </MainContainer>
  );
};

export default SettingsCustom;
