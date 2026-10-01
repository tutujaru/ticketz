import {
  Table,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Ticket from "./Ticket";
import User from "./User";
import Company from "./Company";
import Whatsapp from "./Whatsapp";
import Queue from "./Queue";

@Table({ tableName: "TicketTransferLogs" })
class TicketTransferLog extends Model<TicketTransferLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Company)
  @Column
  sourceCompanyId: number;

  @BelongsTo(() => Company, "sourceCompanyId")
  sourceCompany: Company;

  @ForeignKey(() => Company)
  @Column
  targetCompanyId: number;

  @BelongsTo(() => Company, "targetCompanyId")
  targetCompany: Company;

  @ForeignKey(() => Whatsapp)
  @Column
  sourceWhatsappId: number;

  @ForeignKey(() => Whatsapp)
  @Column
  targetWhatsappId: number;

  @ForeignKey(() => Queue)
  @Column
  sourceQueueId: number;

  @ForeignKey(() => Queue)
  @Column
  targetQueueId: number;

  @Column
  transferType: string;

  @CreatedAt
  createdAt: Date;
}

export default TicketTransferLog;
