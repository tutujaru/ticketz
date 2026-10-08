import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Users", "passwordResetToken", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Users", "passwordResetExpires", {
      type: DataTypes.DATE,
      allowNull: true
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Users", "passwordResetExpires");
    await queryInterface.removeColumn("Users", "passwordResetToken");
  }
};
