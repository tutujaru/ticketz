import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Whatsapps", "metaPhoneNumberId", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaVerifyToken", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "metaAppSecret", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "metaAppSecret");
    await queryInterface.removeColumn("Whatsapps", "metaVerifyToken");
    await queryInterface.removeColumn("Whatsapps", "metaPhoneNumberId");
  }
};
