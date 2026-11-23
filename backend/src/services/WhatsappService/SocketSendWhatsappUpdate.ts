import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";
import Company from "../../models/Company";

export async function sendWhatsappUpdate(whatsapp: Whatsapp) {
  const { id, name, channel, status, qrcode, isDefault, updatedAt } = whatsapp;

  const io = getIO();
  io.to(`company-${whatsapp.companyId}-admin`).emit(
    `company-${whatsapp.companyId}-whatsapp`,
    {
      action: "update",
      whatsapp: {
        id,
        name,
        channel,
        status,
        qrcode,
        isDefault,
        updatedAt
      }
    }
  );

  const company =
    whatsapp.company ||
    (await Company.findByPk(whatsapp.companyId, {
      attributes: ["id", "name"]
    }));
  io.to("super").emit("superadmin-whatsapp", {
    action: "update",
    whatsapp: {
      id,
      name,
      channel,
      provider: whatsapp.provider,
      status,
      isDefault,
      updatedAt,
      companyId: whatsapp.companyId,
      company: company ? { id: company.id, name: company.name } : undefined
    }
  });
}

export function sendWhatsappDeleteUpdate(
  companyId: number,
  whatsappId: number
) {
  getIO().to("super").emit("superadmin-whatsapp", {
    action: "delete",
    whatsappId,
    companyId
  });
}
