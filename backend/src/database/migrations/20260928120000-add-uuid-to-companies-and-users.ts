import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
        { transaction }
      );

      await queryInterface.addColumn(
        "Companies",
        "uuid",
        {
          type: DataTypes.UUID,
          defaultValue: queryInterface.sequelize.literal("gen_random_uuid()"),
          allowNull: false,
          unique: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "Users",
        "uuid",
        {
          type: DataTypes.UUID,
          defaultValue: queryInterface.sequelize.literal("gen_random_uuid()"),
          allowNull: false,
          unique: true
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn("Users", "uuid", { transaction });
      await queryInterface.removeColumn("Companies", "uuid", { transaction });
    });
  }
};
