import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Button,
  Container,
  Paper,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
  root: { minHeight: "100vh", display: "flex", alignItems: "center" },
  paper: { padding: theme.spacing(4), maxWidth: 440, width: "100%" },
  button: { marginTop: theme.spacing(2) },
  link: { display: "block", marginTop: theme.spacing(2), textAlign: "center" }
}));

export default function ForgotPassword() {
  const classes = useStyles();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async event => {
    event.preventDefault();
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (error) {
      toast.error("Informe um e-mail válido para continuar.");
    }
  };
  return (
    <Container className={classes.root} maxWidth="sm">
      <Paper className={classes.paper} elevation={4}>
        <Typography variant="h5" gutterBottom>
          Redefinir senha
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Informe seu e-mail. Se ele estiver cadastrado, enviaremos um link para
          criar uma nova senha.
        </Typography>
        {sent ? (
          <Typography variant="body1" style={{ marginTop: 24 }}>
            Solicitação recebida. Verifique sua caixa de entrada e a pasta de
            spam.
          </Typography>
        ) : (
          <form onSubmit={submit}>
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              required
              autoFocus
              value={email}
              onChange={event => setEmail(event.target.value)}
              margin="normal"
            />
            <Button
              className={classes.button}
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
            >
              Enviar link
            </Button>
          </form>
        )}
        <Button className={classes.link} component={RouterLink} to="/login">
          Voltar para o login
        </Button>
      </Paper>
    </Container>
  );
}
