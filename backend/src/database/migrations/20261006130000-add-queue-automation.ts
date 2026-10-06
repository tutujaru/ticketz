import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        "Queues",
        "automationType",
        {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: "none"
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Queues",
        "automationUrl",
        { type: DataTypes.TEXT, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "Queues",
        "automationBotId",
        { type: DataTypes.STRING, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "Queues",
        "automationToken",
        { type: DataTypes.TEXT, allowNull: true },
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn("Queues", "automationToken", {
        transaction
      });
      await queryInterface.removeColumn("Queues", "automationBotId", {
        transaction
      });
      await queryInterface.removeColumn("Queues", "automationUrl", {
        transaction
      });
      await queryInterface.removeColumn("Queues", "automationType", {
        transaction
      });
    });
  }
};
