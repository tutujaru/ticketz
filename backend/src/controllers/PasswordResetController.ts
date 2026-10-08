import { Request, Response } from "express";
import * as Yup from "yup";
import {
  requestPasswordReset,
  resetPassword
} from "../services/UserServices/PasswordResetService";

export const request = async (req: Request, res: Response) => {
  const { email } = await Yup.object({
    email: Yup.string().email().required()
  }).validate(req.body);
  try {
    await requestPasswordReset(email);
  } catch (error) {
    // Keep the public response generic, including SMTP failures.
    console.error("Password reset request failed", error);
  }
  return res.status(200).json({
    message:
      "Se o e-mail estiver cadastrado, enviaremos um link de redefinição."
  });
};

export const confirm = async (req: Request, res: Response) => {
  const { token, password } = await Yup.object({
    token: Yup.string().length(64).required(),
    password: Yup.string().min(6).required()
  }).validate({ ...req.body, token: req.params.token });
  await resetPassword(token, password);
  return res.status(200).json({ message: "Senha redefinida com sucesso." });
};
