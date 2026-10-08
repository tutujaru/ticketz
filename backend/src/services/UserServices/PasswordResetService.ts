import crypto from "crypto";
import nodemailer from "nodemailer";
import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import User from "../../models/User";

const tokenHash = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const mailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);

const sendResetEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password/${token}`;
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Password reset URL for ${email}: ${resetUrl}`);
      return;
    }
    throw new AppError("ERR_PASSWORD_RESET_EMAIL_NOT_CONFIGURED", 503);
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Redefinição de senha",
    text: `Use este link para redefinir sua senha: ${resetUrl}\n\nO link expira em 1 hora.`,
    html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}">Redefinir minha senha</a></p><p>Este link expira em 1 hora.</p>`
  });
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await User.findOne({
    where: { email: email.trim().toLowerCase() }
  });
  if (!user) return;
  const token = crypto.randomBytes(32).toString("hex");
  await user.update({
    passwordResetToken: tokenHash(token),
    passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000)
  });
  await sendResetEmail(user.email, token);
};

export const resetPassword = async (
  token: string,
  password: string
): Promise<void> => {
  const user = await User.findOne({
    where: {
      passwordResetToken: tokenHash(token),
      passwordResetExpires: { [Op.gt]: new Date() }
    }
  });
  if (!user) throw new AppError("ERR_INVALID_PASSWORD_RESET_TOKEN", 400);
  await user.update({
    password,
    passwordResetToken: null,
    passwordResetExpires: null,
    tokenVersion: user.tokenVersion + 1
  });
};
