import React, { useState } from "react";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";
import {
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Box,
  Chip
} from "@material-ui/core";
import { Field, Form, Formik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { getBackendURL } from "../../services/config";
import SendIcon from "@material-ui/icons/Send";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";

const useStyles = makeStyles(theme => ({
  container: {
    paddingBottom: theme.spacing(4)
  },
  mainPaper: {
    flex: 1,
    padding: theme.spacing(4),
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.04)",
    border: "1px solid #f1f5f9"
  },
  // Cabeçalho da página
  pageTitle: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "1.75rem",
    marginBottom: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5)
  },
  pageSubtitle: {
    color: "#64748b",
    fontSize: "0.95rem",
    marginBottom: theme.spacing(4)
  },
  titleIcon: {
    color: "#3b82f6",
    fontSize: "2rem"
  },
  // Título de seção
  sectionTitle: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "1.15rem",
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(4),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5)
  },
  sectionBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    fontWeight: 700,
    fontSize: "0.875rem"
  },
  // Aviso
  warningBox: {
    padding: theme.spacing(2.5),
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "12px",
    marginBottom: theme.spacing(2),
    "& b": {
      color: "#92400e"
    },
    "& ul": {
      margin: theme.spacing(1, 0, 0, 0),
      paddingLeft: theme.spacing(2.5),
      color: "#78350f",
      fontSize: "0.9rem",
      lineHeight: 1.7
    },
    "& ul ul": {
      marginTop: theme.spacing(0.5)
    }
  },
  // Bloco de código
  codeBlock: {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    padding: theme.spacing(2),
    borderRadius: "12px",
    fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
    fontSize: "0.8rem",
    lineHeight: 1.6,
    overflowX: "auto",
    marginBottom: theme.spacing(2),
    "& b": {
      color: "#60a5fa",
      fontWeight: 600
    }
  },
  // Card do teste de envio
  testCard: {
    padding: theme.spacing(3),
    backgroundColor: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #f1f5f9",
    height: "100%"
  },
  testCardTitle: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "0.95rem",
    marginBottom: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    "& svg": {
      color: "#3b82f6",
      fontSize: "1.1rem"
    }
  },
  // Inputs
  textField: {
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
    },
    "& .MuiInputLabel-root": {
      color: "#64748b"
    }
  },
  // Botão de enviar
  sendButton: {
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
  textRight: {
    textAlign: "right"
  },
  // Upload de arquivo moderno
  fileUploadWrapper: {
    position: "relative",
    display: "block"
  },
  fileInput: {
    display: "none"
  },
  fileUploadLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(3),
    border: "2px dashed #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#64748b",
    fontSize: "0.875rem",
    fontWeight: 500,
    "&:hover": {
      borderColor: "#3b82f6",
      backgroundColor: "#eff6ff",
      color: "#3b82f6",
      "& svg": {
        color: "#3b82f6"
      }
    },
    "& svg": {
      fontSize: "1.5rem",
      color: "#94a3b8",
      transition: "color 0.2s ease"
    }
  },
  selectedFile: {
    marginTop: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
  },
  // Pílula de método HTTP
  methodChip: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontWeight: 700,
    fontSize: "0.7rem",
    height: "22px",
    borderRadius: "6px"
  }
}));

const MessagesAPI = () => {
  const classes = useStyles();

  const [formMessageTextData] = useState({ token: "", number: "", body: "" });
  const [formMessageMediaData] = useState({
    token: "",
    number: "",
    medias: ""
  });
  const [file, setFile] = useState({});

  const getEndpoint = () => {
    return getBackendURL() + "/api/messages/send";
  };

  const handleSendTextMessage = async values => {
    const { number, body } = values;
    const data = { number, body };
    var options = {
      method: "POST",
      url: `${getBackendURL()}/api/messages/send`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${values.token}`
      },
      data
    };

    axios
      .request(options)
      .then(function (response) {
        toast.success("Mensagem enviada com sucesso");
      })
      .catch(function (error) {
        toastError(error);
      });
  };

  const handleSendMediaMessage = async values => {
    try {
      const firstFile = file[0];
      const data = new FormData();
      data.append("number", values.number);
      data.append("body", firstFile.name);
      data.append("medias", firstFile);
      var options = {
        method: "POST",
        url: `${getBackendURL()}/api/messages/send`,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${values.token}`
        },
        data
      };

      axios
        .request(options)
        .then(function (response) {
          toast.success("Mensagem enviada com sucesso");
        })
        .catch(function (error) {
          toastError(error);
        });
    } catch (err) {
      toastError(err);
    }
  };

  const renderFormMessageText = () => {
    return (
      <Formik
        initialValues={formMessageTextData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendTextMessage(values);
            actions.setSubmitting(false);
            actions.resetForm();
          }, 400);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.number")}
                  name="number"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.textMessage.body")}
                  name="body"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  multiline
                  rows={3}
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.sendButton}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SendIcon />
                    )
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    );
  };

  const renderFormMessageMedia = () => {
    return (
      <Formik
        initialValues={formMessageMediaData}
        enableReinitialize={true}
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            await handleSendMediaMessage(values);
            actions.setSubmitting(false);
            actions.resetForm();
            document.getElementById("medias").files = null;
            document.getElementById("medias").value = null;
          }, 400);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.token")}
                  name="token"
                  autoFocus
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field
                  as={TextField}
                  label={i18n.t("messagesAPI.mediaMessage.number")}
                  name="number"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  className={classes.textField}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <div className={classes.fileUploadWrapper}>
                  <input
                    type="file"
                    name="medias"
                    id="medias"
                    required
                    className={classes.fileInput}
                    onChange={e => setFile(e.target.files)}
                  />
                  <label htmlFor="medias" className={classes.fileUploadLabel}>
                    <CloudUploadIcon />
                    <span>
                      {file[0]
                        ? file[0].name
                        : "Clique para selecionar um arquivo"}
                    </span>
                  </label>
                </div>
              </Grid>
              <Grid item xs={12} className={classes.textRight}>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.sendButton}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SendIcon />
                    )
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    );
  };

  return (
    <div className={classes.container}>
      <Paper className={classes.mainPaper} elevation={0}>
        {/* Cabeçalho */}
        <Typography className={classes.pageTitle}>
          <CodeRoundedIcon className={classes.titleIcon} />
          API de Mensagens
        </Typography>
        <Typography className={classes.pageSubtitle}>
          Documentação completa para envio de mensagens programáticas via API.
        </Typography>

        {/* Métodos de Envio */}
        <Typography
          className={classes.sectionTitle}
          style={{ marginTop: 0 }}
        >
          Métodos de Envio
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap" marginBottom={3}>
          <Chip
            label="1. Mensagens de Texto"
            className={classes.methodChip}
            style={{ backgroundColor: "#eff6ff", color: "#1e40af" }}
          />
          <Chip
            label="2. Mensagens de Mídia"
            className={classes.methodChip}
            style={{ backgroundColor: "#f3e8ff", color: "#6b21a8" }}
          />
        </Box>

        {/* Aviso Importante */}
        <Box className={classes.warningBox}>
          <Typography style={{ fontWeight: 700, marginBottom: 4 }}>
            ⚠️ Observações importantes
          </Typography>
          <ul>
            <li>
              Antes de enviar mensagens, é necessário o cadastro do token
              vinculado à conexão que enviará as mensagens. Para realizar o
              cadastro acesse o menu <b>"Conexões"</b>, clique no botão editar
              da conexão e insira o token no devido campo.
            </li>
            <li>
              O campo número aceita dois tipos de informação:
              <ul>
                <li>
                  <b>Número de Whatsapp:</b> Qualquer número de whatsapp
                  completo iniciando pelo código do país (BR=55).
                </li>
                <li>
                  <b>Whatsapp JID:</b> Qualquer identificador do Whatsapp, para
                  grupos ele é um número extenso seguido de @g.us.
                </li>
              </ul>
            </li>
          </ul>
        </Box>

        {/* SEÇÃO 1: Mensagens de Texto */}
        <Typography className={classes.sectionTitle}>
          <span className={classes.sectionBadge}>1</span>
          Mensagens de Texto
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography
              style={{
                color: "#64748b",
                fontSize: "0.9rem",
                marginBottom: 12
              }}
            >
              Informações necessárias para envio das mensagens de texto:
            </Typography>
            <div className={classes.codeBlock}>
              <div>
                <b>Endpoint:</b> {getEndpoint()}
              </div>
              <div>
                <b>Método:</b>{" "}
                <span className={classes.methodChip}>POST</span>
              </div>
              <div>
                <b>Headers:</b> Authorization ("Bearer " + token cadastrado) e
                Content-Type (application/json)
              </div>
              <div style={{ marginTop: 8 }}>
                <b>Body:</b>
              </div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{`{
  "number": "558599999999",
  "body": "Sua mensagem",
  "saveOnTicket": true,
  "linkPreview": true
}`}
              </pre>
            </div>
          </Grid>
          <Grid item xs={12} md={6}>
            <div className={classes.testCard}>
              <Typography className={classes.testCardTitle}>
                <SendIcon />
                Teste de Envio
              </Typography>
              {renderFormMessageText()}
            </div>
          </Grid>
        </Grid>

        {/* SEÇÃO 2: Mensagens de Mídia */}
        <Typography className={classes.sectionTitle}>
          <span className={classes.sectionBadge}>2</span>
          Mensagens de Mídia
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography
              style={{
                color: "#64748b",
                fontSize: "0.9rem",
                marginBottom: 12
              }}
            >
              Informações necessárias para envio das mensagens com mídia:
            </Typography>
            <div className={classes.codeBlock}>
              <div>
                <b>Endpoint:</b> {getEndpoint()}
              </div>
              <div>
                <b>Método:</b>{" "}
                <span className={classes.methodChip}>POST</span>
              </div>
              <div>
                <b>Headers:</b> Authorization ("Bearer " + token cadastrado) e
                Content-Type (multipart/form-data)
              </div>
              <div style={{ marginTop: 8 }}>
                <b>FormData:</b>
              </div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{`number: 558599999999
medias: <arquivo>
saveOnTicket: true`}
              </pre>
            </div>
          </Grid>
          <Grid item xs={12} md={6}>
            <div className={classes.testCard}>
              <Typography className={classes.testCardTitle}>
                <SendIcon />
                Teste de Envio
              </Typography>
              {renderFormMessageMedia()}
            </div>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default MessagesAPI;
