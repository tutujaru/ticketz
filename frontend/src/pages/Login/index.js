import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Popover from "@material-ui/core/Popover";
import Fade from "@material-ui/core/Fade";
import Paper from "@material-ui/core/Paper";
import MenuList from "@material-ui/core/MenuList";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import LanguageIcon from "@material-ui/icons/Translate";
import Typography from "@material-ui/core/Typography";
import EmailIcon from "@material-ui/icons/Email";
import LockIcon from "@material-ui/icons/Lock";
import Divider from "@material-ui/core/Divider";
import Avatar from "@material-ui/core/Avatar";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";
import { messages } from "../../translate/languages";

import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";
import { getBackendURL } from "../../services/config";
import ColorModeContext from "../../layout/themeContext";
import { loadJSON } from "../../helpers/loadJSON";

const gitinfo = loadJSON("/gitinfo.json");

const parseLoginLinks = value => {
  if (!value) return [];
  try {
    const parsedValue = JSON.parse(value);
    if (!Array.isArray(parsedValue)) return [];
    return parsedValue.filter(
      link => typeof link?.title === "string" && typeof link?.url === "string"
    );
  } catch {
    return [];
  }
};

const isVideoFile = (filename = "") => /\.(mp4|webm|ogg)$/i.test(filename);

const getPublicAssetUrl = filename => {
  if (!filename) return "";
  return `${getBackendURL()}/public/${filename}`;
};

const useStyles = makeStyles(theme => ({
  root: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: theme.palette.type === "light" 
      ? "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)"
      : "linear-gradient(135deg, #0a0e1a 0%, #141a2e 100%)"
  },
  backgroundOverlay: {
    position: "absolute",
    inset: 0,
    background: theme.palette.type === "light"
      ? "radial-gradient(ellipse at 20% 50%, rgba(56, 211, 159, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(56, 211, 159, 0.05) 0%, transparent 50%)"
      : "radial-gradient(ellipse at 20% 50%, rgba(56, 211, 159, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(56, 211, 159, 0.04) 0%, transparent 50%)",
    zIndex: 0
  },
  backgroundMedia: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
    opacity: 0.3
  },
  content: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    overflowY: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(1.5)
    }
  },
  toolbar: {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 2,
    display: "flex",
    gap: theme.spacing(1),
    [theme.breakpoints.down("xs")]: {
      top: theme.spacing(1),
      right: theme.spacing(1)
    }
  },
  toolbarButton: {
    color: theme.palette.type === "light" ? "#1a2332" : "#ffffff",
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.7)"
      : "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    border: theme.palette.type === "light"
      ? "1px solid rgba(255,255,255,0.6)"
      : "1px solid rgba(255,255,255,0.12)",
    transition: "all 0.25s ease",
    "&:hover": {
      background: theme.palette.type === "light"
        ? "rgba(255,255,255,0.9)"
        : "rgba(255,255,255,0.15)",
      transform: "scale(1.05)"
    }
  },
  langMenu: {
    zIndex: 3
  },
  langMenuPaper: {
    minWidth: 160,
    borderRadius: theme.spacing(1.5),
    overflow: "hidden",
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.92)"
      : "rgba(20, 26, 46, 0.92)",
    backdropFilter: "blur(16px)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`
  },
  layout: {
    width: "100%",
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2.5)
  },
  loginCard: {
    width: "100%",
    borderRadius: 32,
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.72)"
      : "rgba(20, 26, 46, 0.7)",
    backdropFilter: "blur(24px)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)"}`,
    boxShadow: theme.palette.type === "light"
      ? "0 24px 80px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.04)"
      : "0 24px 80px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.2)",
    padding: theme.spacing(4),
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(3, 2)
    },
    [theme.breakpoints.down("sm")]: {
      borderRadius: 24
    }
  },
  avatar: {
    width: 64,
    height: 64,
    margin: "0 auto 16px",
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    boxShadow: "0 8px 24px rgba(56, 211, 159, 0.3)"
  },
  logo: {
    display: "block",
    height: 48,
    margin: "0 auto 8px",
    objectFit: "contain",
    content: `url("${theme.calculatedLogo()}")`
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    textAlign: "center",
    color: theme.palette.type === "light" ? "#1a2332" : "#ffffff",
    marginBottom: theme.spacing(0.5)
  },
  subtitle: {
    fontSize: "0.9rem",
    textAlign: "center",
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.6)" : "rgba(255,255,255,0.5)",
    marginBottom: theme.spacing(2)
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1)
  },
  inputField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 14,
      background: theme.palette.type === "light"
        ? "rgba(255,255,255,0.6)"
        : "rgba(255,255,255,0.04)",
      backdropFilter: "blur(4px)",
      transition: "all 0.25s ease",
      "& fieldset": {
        borderColor: theme.palette.type === "light"
          ? "rgba(0,0,0,0.08)"
          : "rgba(255,255,255,0.08)"
      },
      "&:hover fieldset": {
        borderColor: theme.palette.type === "light"
          ? "rgba(56,211,159,0.4)"
          : "rgba(56,211,159,0.3)"
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
        borderWidth: 2
      }
    },
    "& .MuiInputLabel-root": {
      color: theme.palette.type === "light" ? "rgba(26,35,50,0.6)" : "rgba(255,255,255,0.5)",
      "&.Mui-focused": {
        color: theme.palette.primary.main
      }
    },
    "& .MuiInputBase-input": {
      color: theme.palette.type === "light" ? "#1a2332" : "#ffffff",
      "&::placeholder": {
        color: theme.palette.type === "light" ? "rgba(26,35,50,0.4)" : "rgba(255,255,255,0.3)"
      }
    }
  },
  inputIcon: {
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.3)" : "rgba(255,255,255,0.2)",
    marginRight: theme.spacing(1)
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    fontSize: "1rem",
    fontWeight: 600,
    textTransform: "none",
    letterSpacing: 0.3,
    marginTop: theme.spacing(2),
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, #2ba07a)`,
    boxShadow: "0 8px 24px rgba(56, 211, 159, 0.35)",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 12px 32px rgba(56, 211, 159, 0.45)",
      background: `linear-gradient(135deg, #2ba07a, ${theme.palette.primary.main})`
    },
    "&:active": {
      transform: "scale(0.98)"
    }
  },
  divider: {
    margin: theme.spacing(2, 0),
    "&::before, &::after": {
      borderColor: theme.palette.type === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"
    }
  },
  signupLink: {
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing(0.5),
    fontSize: "0.9rem",
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.6)" : "rgba(255,255,255,0.5)",
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 600,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline"
      }
    }
  },
  linksContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing(1)
  },
  footerLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: theme.spacing(1, 2.5),
    borderRadius: 999,
    textDecoration: "none",
    fontSize: "0.8rem",
    fontWeight: 500,
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.7)" : "rgba(255,255,255,0.7)",
    background: theme.palette.type === "light"
      ? "rgba(255,255,255,0.5)"
      : "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    border: `1px solid ${theme.palette.type === "light" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)"}`,
    transition: "all 0.25s ease",
    "&:hover": {
      transform: "translateY(-1px)",
      background: theme.palette.type === "light"
        ? "rgba(255,255,255,0.7)"
        : "rgba(255,255,255,0.08)",
      color: theme.palette.type === "light" ? "#1a2332" : "#ffffff"
    }
  },
  versionInfo: {
    position: "absolute",
    right: theme.spacing(2.5),
    bottom: theme.spacing(2),
    zIndex: 2,
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: 0.3,
    color: theme.palette.type === "light" ? "rgba(26,35,50,0.35)" : "rgba(255,255,255,0.25)",
    [theme.breakpoints.down("xs")]: {
      right: theme.spacing(1.5),
      bottom: theme.spacing(1.5),
      fontSize: "10px"
    }
  }
}));

const Login = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { getPublicSetting } = useSettings();
  const { colorMode } = useContext(ColorModeContext);

  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  const currentLanguage = localStorage.getItem("language") || i18n.language || "en";

  const handleChooseLanguage = lang => {
    setLangMenuAnchor(null);
    localStorage.setItem("language", lang);
    window.location.reload(false);
  };

  const [user, setUser] = useState({ email: "", password: "" });
  const [allowSignup, setAllowSignup] = useState(false);
  const [loginLinks, setLoginLinks] = useState([]);
  const [sidePanelImage, setSidePanelImage] = useState("");
  const [backgroundContent, setBackgroundContent] = useState("");
  const [loading, setLoading] = useState(false);

  const { handleLogin } = useContext(AuthContext);

  const handleChangeInput = event => {
    setUser(prev => ({
      ...prev,
      [event.target.name]: event.target.value.trim()
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      await handleLogin(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getPublicSetting("allowSignup"),
      getPublicSetting("loginPageLinks"),
      getPublicSetting("loginSidePanelImage"),
      getPublicSetting("loginBackgroundContent")
    ])
      .then(([allowSignupValue, loginLinksValue, sidePanelImageValue, backgroundContentValue]) => {
        setAllowSignup(allowSignupValue === "enabled");
        setLoginLinks(parseLoginLinks(loginLinksValue));
        setSidePanelImage(sidePanelImageValue || "");
        setBackgroundContent(backgroundContentValue || "");
      })
      .catch(error => console.log("Error reading setting", error));
  }, []);

  const backgroundAssetUrl = getPublicAssetUrl(backgroundContent);
  const shouldRenderBackgroundVideo = isVideoFile(backgroundContent);
  const isLightMode = theme.palette.type === "light";

  return (
    <div className={classes.root}>
      <CssBaseline />
      
      {/* Background */}
      <div className={classes.backgroundOverlay} />
      {shouldRenderBackgroundVideo ? (
        <video className={classes.backgroundMedia} autoPlay loop muted playsInline>
          <source src={backgroundAssetUrl} />
        </video>
      ) : backgroundAssetUrl && (
        <div 
          className={classes.backgroundMedia}
          style={{ background: `url("${backgroundAssetUrl}") center/cover no-repeat` }}
        />
      )}

      {/* Toolbar */}
      <div className={classes.toolbar}>
        <IconButton
          className={classes.toolbarButton}
          onClick={event => setLangMenuAnchor(event.currentTarget)}
          aria-label={i18n.t("mainDrawer.appBar.i18n.language")}
          size="small"
        >
          <LanguageIcon fontSize="small" />
        </IconButton>
        <IconButton
          className={classes.toolbarButton}
          onClick={colorMode.toggleColorMode}
          aria-label={isLightMode ? "Switch to dark mode" : "Switch to light mode"}
          size="small"
        >
          {isLightMode ? <Brightness4Icon fontSize="small" /> : <Brightness7Icon fontSize="small" />}
        </IconButton>
      </div>

      {/* Language Menu */}
      <Popover
        className={classes.langMenu}
        open={Boolean(langMenuAnchor)}
        anchorEl={langMenuAnchor}
        onClose={() => setLangMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 180 }}
        PaperProps={{
          style: {
            marginTop: 8,
            background: "transparent",
            boxShadow: "none"
          }
        }}
        disableScrollLock
      >
        <Paper className={classes.langMenuPaper} elevation={4}>
          <MenuList>
            {Object.keys(messages).map(lang => (
              <MenuItem
                key={lang}
                onClick={() => handleChooseLanguage(lang)}
                selected={currentLanguage === lang}
                style={{
                  fontWeight: currentLanguage === lang ? 600 : 400,
                  color: currentLanguage === lang ? theme.palette.primary.main : "inherit"
                }}
              >
                {messages[lang].translations.mainDrawer.appBar.i18n.language}
                {currentLanguage === lang && " ✓"}
              </MenuItem>
            ))}
          </MenuList>
        </Paper>
      </Popover>

      {/* Content */}
      <div className={classes.content}>
        <div className={classes.layout}>
          <div className={classes.loginCard}>
            <img
              className={classes.logo}
              alt={i18n.t("login.title")}
            />
            
            <Typography className={classes.title}>
              {i18n.t("login.title") || "Welcome Back"}
            </Typography>
            <Typography className={classes.subtitle}>
              {i18n.t("login.subtitle") || "Sign in to continue to your account"}
            </Typography>

            <form className={classes.form} noValidate onSubmit={handleSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label={i18n.t("login.form.email")}
                name="email"
                value={user.email}
                onChange={handleChangeInput}
                autoComplete="email"
                autoFocus
                className={classes.inputField}
                InputProps={{
                  startAdornment: <EmailIcon className={classes.inputIcon} fontSize="small" />
                }}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label={i18n.t("login.form.password")}
                type="password"
                id="password"
                value={user.password}
                onChange={handleChangeInput}
                autoComplete="current-password"
                className={classes.inputField}
                InputProps={{
                  startAdornment: <LockIcon className={classes.inputIcon} fontSize="small" />
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  i18n.t("login.buttons.submit") || "Sign In"
                )}
              </Button>

              {allowSignup && (
                <>
                  <Divider className={classes.divider} />
                  <div className={classes.signupLink}>
                    {i18n.t("login.buttons.dontHaveAccount") || "Don't have an account?"}
                    <Link component={RouterLink} to="/signup">
                      {i18n.t("login.buttons.register") || "Sign Up"}
                    </Link>
                  </div>
                </>
              )}
            </form>
          </div>

          {loginLinks.length > 0 && (
            <div className={classes.linksContainer}>
              {loginLinks.map((link, index) => (
                <a
                  className={classes.footerLink}
                  href={link.url}
                  key={`${link.url}-${index}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <Typography className={classes.versionInfo}>
        {`${gitinfo.tagName || `${gitinfo.branchName || "N/A"} ${gitinfo.commitHash || "N/A"}`}`}
        {" / "}
        {`${gitinfo.buildTimestamp || "N/A"}`}
      </Typography>
    </div>
  );
};

export default Login;
