import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex(
      "Tickets",
      ["companyId", "status", "updatedAt", "id"],
      { name: "idx_tickets_company_status_updated_id" }
    );
    await queryInterface.addIndex(
      "Tickets",
      ["companyId", "queueId", "status", "updatedAt"],
      { name: "idx_tickets_company_queue_status_updated" }
    );
    await queryInterface.addIndex(
      "Tickets",
      ["companyId", "userId", "status", "updatedAt"],
      { name: "idx_tickets_company_user_status_updated" }
    );
    await queryInterface.addIndex("TicketTags", ["tagId", "ticketId"], {
      name: "idx_tickettags_tag_ticket"
    });
    await queryInterface.addIndex("TicketTags", ["ticketId", "tagId"], {
      name: "idx_tickettags_ticket_tag"
    });
    await queryInterface.addIndex("ContactTags", ["tagId", "contactId"], {
      name: "idx_contacttags_tag_contact"
    });
    await queryInterface.addIndex("ContactTags", ["contactId", "tagId"], {
      name: "idx_contacttags_contact_tag"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "ContactTags",
      "idx_contacttags_contact_tag"
    );
    await queryInterface.removeIndex("ContactTags", "idx_contacttags_tag_contact");
    await queryInterface.removeIndex("TicketTags", "idx_tickettags_ticket_tag");
    await queryInterface.removeIndex("TicketTags", "idx_tickettags_tag_ticket");
    await queryInterface.removeIndex(
      "Tickets",
      "idx_tickets_company_user_status_updated"
    );
    await queryInterface.removeIndex(
      "Tickets",
      "idx_tickets_company_queue_status_updated"
    );
    await queryInterface.removeIndex(
      "Tickets",
      "idx_tickets_company_status_updated_id"
    );
  }
};
