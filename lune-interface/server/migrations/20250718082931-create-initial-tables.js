'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Folders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.createTable('Entries', {
      id: {
        type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        text: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        timestamp: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW
        },
        FolderId: {
          type: Sequelize.UUID,
          references: {
            model: 'Folders',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
    await queryInterface.createTable('Tags', {
      name: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.createTable('EntryTag', {
      EntryId: {
        type: Sequelize.UUID,
        references: {
          model: 'Entries',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      },
      TagName: {
        type: Sequelize.STRING,
        references: {
          model: 'Tags',
          key: 'name'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EntryTag');
    await queryInterface.dropTable('Tags');
    await queryInterface.dropTable('Entries');
    await queryInterface.dropTable('Folders');
  }
};
