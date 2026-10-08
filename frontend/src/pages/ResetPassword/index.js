import React, { useState } from "react";
import { Link as RouterLink, useHistory, useParams } from "react-router-dom";
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

export default function ResetPassword() {
  const classes = useStyles();
  const history = useHistory();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const submit = async event => {
    event.preventDefault();
    if (password.length < 6 || password !== confirmation) {
      toast.error("As senhas devem ter pelo menos 6 caracteres e ser iguais.");
      return;
    }
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success("Senha redefinida com sucesso.");
      history.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Link inválido ou expirado.");
    }
  };
  return (
    <Container className={classes.root} maxWidth="sm">
      <Paper className={classes.paper} elevation={4}>
        <Typography variant="h5" gutterBottom>
          Escolha uma nova senha
        </Typography>
        <form onSubmit={submit}>
          <TextField
            label="Nova senha"
            type="password"
            fullWidth
            required
            autoFocus
            value={password}
            onChange={event => setPassword(event.target.value)}
            margin="normal"
          />
          <TextField
            label="Confirmar senha"
            type="password"
            fullWidth
            required
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            margin="normal"
          />
          <Button
            className={classes.button}
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
          >
            Salvar nova senha
          </Button>
        </form>
        <Button className={classes.link} component={RouterLink} to="/login">
          Voltar para o login
        </Button>
      </Paper>
    </Container>
  );
}
