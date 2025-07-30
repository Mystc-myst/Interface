const diaryStore = require('../diaryStore');
const { sequelize, Entry, Tag } = require('../db');


describe('tag index updates', () => {
  let transaction;

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    transaction = await sequelize.transaction();
  });

  afterEach(async () => {
    if (transaction) {
      await transaction.rollback();
    }
    await sequelize.drop();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('add entries updates tag index', async () => {
    const entry1 = await diaryStore.add('First entry #foo', null, { transaction });
    const entry2 = await diaryStore.add('Second entry #foo #bar', null, { transaction });
    const tags = await diaryStore.getTags({ transaction });
    expect(tags.foo).toEqual(expect.arrayContaining([entry1.id, entry2.id]));
    expect(tags.bar).toEqual([entry2.id]);
  });

  test('update and delete entry updates tag index', async () => {
    // Add initial entries
    const entry1 = await diaryStore.add('First entry #foo', null, { transaction });
    const entry2 = await diaryStore.add('Second entry #foo #bar', null, { transaction });

    // Update the first entry and check if tags are updated
    await diaryStore.updateText(entry1.id, 'Updated entry #baz', null, { transaction });
    let tags = await diaryStore.getTags({ transaction });
    expect(tags.foo).toEqual([entry2.id]);
    expect(tags.bar).toEqual([entry2.id]);
    expect(tags.baz).toEqual([entry1.id]);

    // Remove the second entry and check if tags are updated
    await diaryStore.remove(entry2.id, { transaction });
    tags = await diaryStore.getTags({ transaction });
    expect(tags).toEqual({ baz: [entry1.id] });
  });
});
