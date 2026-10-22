import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn("Companies", "allowTributaryDividaAtiva", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("Companies", "allowTributaryIptu", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn("Companies", "allowTributaryIptu");
    await queryInterface.removeColumn("Companies", "allowTributaryDividaAtiva");
  }
};
