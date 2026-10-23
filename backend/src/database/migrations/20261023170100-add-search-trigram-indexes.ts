import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS pg_trgm"
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_messages_body_trgm" ON "Messages" USING gin (body gin_trgm_ops)'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_contacts_name_trgm" ON "Contacts" USING gin (name gin_trgm_ops)'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_contacts_number_trgm" ON "Contacts" USING gin (number gin_trgm_ops)'
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_contacts_number_trgm"'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_contacts_name_trgm"'
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_messages_body_trgm"'
    );
  }
};
