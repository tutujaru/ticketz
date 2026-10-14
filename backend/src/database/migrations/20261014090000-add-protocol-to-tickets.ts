import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn("Tickets", "protocol", {
      type: "VARCHAR(32)",
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE "Tickets"
      SET "protocol" = TO_CHAR("createdAt", 'YYYYMMDD') || '-' || id
      WHERE "protocol" IS NULL
    `);

    await queryInterface.changeColumn("Tickets", "protocol", {
      type: "VARCHAR(32)",
      allowNull: false
    });

    await queryInterface.addIndex("Tickets", ["protocol"], {
      unique: true,
      name: "tickets_protocol_unique"
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex("Tickets", "tickets_protocol_unique");
    await queryInterface.removeColumn("Tickets", "protocol");
  }
};
