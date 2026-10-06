import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Plan from "../../models/Plan";

interface QueueData {
  name: string;
  color: string;
  companyId: number;
  greetingMessage?: string;
  outOfHoursMessage?: string;
  schedules?: unknown[];
  automationType?: "none" | "n8n" | "typebot";
  automationUrl?: string;
  automationBotId?: string;
  automationToken?: string;
}

const CreateQueueService = async (queueData: QueueData): Promise<Queue> => {
  const {
    color,
    name,
    companyId,
    automationType = "none",
    automationUrl,
    automationBotId,
    automationToken
  } = queueData;

  if (!["none", "n8n", "typebot"].includes(automationType)) {
    throw new AppError("Tipo de automação inválido");
  }

  if (automationType !== "none" && !automationUrl) {
    throw new AppError("URL da automação é obrigatória");
  }

  if (automationType === "typebot" && !automationBotId) {
    throw new AppError("ID do bot Typebot é obrigatório");
  }

  const company = await Company.findOne({
    where: {
      id: companyId
    },
    include: [{ model: Plan, as: "plan" }]
  });

  if (company !== null) {
    const queuesCount = await Queue.count({
      where: {
        companyId
      }
    });

    if (queuesCount >= company.plan.queues) {
      throw new AppError(`Número máximo de filas já alcançado: ${queuesCount}`);
    }
  }

  const queueSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_QUEUE_INVALID_NAME")
      .required("ERR_QUEUE_INVALID_NAME")
      .test(
        "Check-unique-name",
        "ERR_QUEUE_NAME_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameName = await Queue.findOne({
              where: { name: value, companyId }
            });

            return !queueWithSameName;
          }
          return false;
        }
      ),
    color: Yup.string()
      .required("ERR_QUEUE_INVALID_COLOR")
      .test("Check-color", "ERR_QUEUE_INVALID_COLOR", async value => {
        if (value) {
          const colorTestRegex = /^#[0-9a-f]{3,6}$/i;
          return colorTestRegex.test(value);
        }
        return false;
      })
      .test(
        "Check-color-exists",
        "ERR_QUEUE_COLOR_ALREADY_EXISTS",
        async value => {
          if (value) {
            const queueWithSameColor = await Queue.findOne({
              where: { color: value, companyId }
            });
            return !queueWithSameColor;
          }
          return false;
        }
      )
  });

  try {
    await queueSchema.validate({ color, name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const queue = await Queue.create({
    ...queueData,
    automationType,
    automationUrl: automationType === "none" ? null : automationUrl,
    automationBotId: automationType === "typebot" ? automationBotId : null,
    automationToken: automationType === "none" ? null : automationToken
  });

  return queue;
};

export default CreateQueueService;
