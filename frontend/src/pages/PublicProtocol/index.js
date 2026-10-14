import React, { useState } from "react";
import {
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import SearchIcon from "@material-ui/icons/Search";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import { openApi } from "../../services/api";

const useStyles = makeStyles(theme => ({
  page: {
    alignItems: "center",
    background: "linear-gradient(135deg, #eef6f2 0%, #f8fafc 100%)",
    display: "flex",
    justifyContent: "center",
    minHeight: "100vh",
    padding: theme.spacing(2)
  },
  card: {
    borderRadius: 16,
    maxWidth: 480,
    padding: theme.spacing(4),
    width: "100%"
  },
  icon: {
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: "50%",
    color: "#15803d",
    display: "flex",
    height: 56,
    justifyContent: "center",
    margin: "0 auto 16px",
    width: 56
  },
  title: {
    color: "#1f2937",
    fontWeight: 700,
    textAlign: "center"
  },
  subtitle: {
    color: "#6b7280",
    margin: "10px auto 24px",
    textAlign: "center"
  },
  field: {
    marginBottom: theme.spacing(2)
  },
  button: {
    marginTop: theme.spacing(1),
    minHeight: 44
  },
  notice: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    color: "#1e40af",
    fontSize: "0.86rem",
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5)
  },
  error: {
    color: "#b91c1c",
    fontSize: "0.86rem",
    marginTop: theme.spacing(1)
  },
  result: {
    borderTop: "1px solid #e5e7eb",
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2)
  },
  resultRow: {
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    gap: theme.spacing(2)
  },
  resultLabel: {
    color: "#6b7280",
    fontSize: "0.85rem"
  },
  resultValue: {
    color: "#1f2937",
    fontSize: "0.9rem",
    fontWeight: 600,
    textAlign: "right"
  },
  status: {
    color: "#15803d"
  }
}));

const formatDate = value =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      })
    : "-";

export default function PublicProtocol() {
  const classes = useStyles();
  const [protocol, setProtocol] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("protocol");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async event => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResult(null);
    setLoading(true);
    try {
      const response = await openApi.post("/public/protocol/request-code", {
        protocol: protocol.trim()
      });
      setMessage(response.data.message);
      setStep("code");
    } catch (err) {
      setError(
        err.response?.data?.message || "Não foi possível solicitar o código."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async event => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await openApi.post("/public/protocol/verify", {
        protocol: protocol.trim(),
        code: code.trim()
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setProtocol("");
    setCode("");
    setMessage("");
    setError("");
    setResult(null);
    setStep("protocol");
  };

  return (
    <div className={classes.page}>
      <Paper className={classes.card} elevation={3}>
        <div className={classes.icon}>
          {result ? <CheckCircleOutlineIcon /> : <LockOutlinedIcon />}
        </div>
        <Typography variant="h5" className={classes.title}>
          Consulta de protocolo
        </Typography>
        <Typography className={classes.subtitle}>
          Consulte o andamento do seu atendimento com segurança.
        </Typography>

        {!result && step === "protocol" && (
          <form onSubmit={requestCode}>
            <TextField
              className={classes.field}
              fullWidth
              label="Protocolo"
              placeholder="Ex.: 20261014-123"
              value={protocol}
              onChange={event => setProtocol(event.target.value)}
              required
              variant="outlined"
              inputProps={{ "aria-label": "Protocolo" }}
            />
            <Button
              className={classes.button}
              color="primary"
              disabled={loading}
              fullWidth
              startIcon={
                loading ? <CircularProgress size={18} /> : <SearchIcon />
              }
              type="submit"
              variant="contained"
            >
              Solicitar código pelo WhatsApp
            </Button>
          </form>
        )}

        {!result && step === "code" && (
          <form onSubmit={verifyCode}>
            <TextField
              className={classes.field}
              fullWidth
              label="Código de confirmação"
              placeholder="Digite os 6 números"
              value={code}
              onChange={event =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              variant="outlined"
              inputProps={{ inputMode: "numeric", maxLength: 6 }}
            />
            <Button
              className={classes.button}
              color="primary"
              disabled={loading || code.length !== 6}
              fullWidth
              startIcon={
                loading ? (
                  <CircularProgress size={18} />
                ) : (
                  <CheckCircleOutlineIcon />
                )
              }
              type="submit"
              variant="contained"
            >
              Consultar protocolo
            </Button>
            <Button color="default" fullWidth onClick={startOver}>
              Consultar outro protocolo
            </Button>
          </form>
        )}

        {message && !result && <div className={classes.notice}>{message}</div>}
        {error && <div className={classes.error}>{error}</div>}

        {result && (
          <div className={classes.result}>
            <div className={classes.resultRow}>
              <span className={classes.resultLabel}>Protocolo</span>
              <span className={classes.resultValue}>{result.protocol}</span>
            </div>
            <div className={classes.resultRow}>
              <span className={classes.resultLabel}>Status</span>
              <span className={`${classes.resultValue} ${classes.status}`}>
                {result.statusLabel}
              </span>
            </div>
            <div className={classes.resultRow}>
              <span className={classes.resultLabel}>Secretaria</span>
              <span className={classes.resultValue}>
                {result.company || "-"}
              </span>
            </div>
            <div className={classes.resultRow}>
              <span className={classes.resultLabel}>Fila</span>
              <span className={classes.resultValue}>{result.queue || "-"}</span>
            </div>
            <div className={classes.resultRow}>
              <span className={classes.resultLabel}>Aberto em</span>
              <span className={classes.resultValue}>
                {formatDate(result.openedAt)}
              </span>
            </div>
            <div className={classes.resultRow}>
              <span className={classes.resultLabel}>Última atualização</span>
              <span className={classes.resultValue}>
                {formatDate(result.updatedAt)}
              </span>
            </div>
            <Button
              className={classes.button}
              fullWidth
              onClick={startOver}
              variant="outlined"
            >
              Consultar outro protocolo
            </Button>
          </div>
        )}
      </Paper>
    </div>
  );
}
