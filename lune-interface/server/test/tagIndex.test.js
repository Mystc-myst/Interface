const diaryStore = require('../diaryStore');
const { sequelize, Entry, Tag } = require('../db');
const Umzug = require('umzug');
const path = require('path');

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [
      sequelize.getQueryInterface(),
      sequelize.constructor
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

describe('tag index updates', () => {
  // Before each test, sync the database and clear all entries and tags.
  beforeEach(async () => {
    await umzug.up();
  });

  // After each test, clean up the database to ensure a clean state for the next test.
  afterEach(async () => {
    await umzug.down({ to: 0 });
  });

  test('add entries updates tag index', async () => {
    const entry1 = await diaryStore.add('First entry #foo');
    const entry2 = await diaryStore.add('Second entry #foo #bar');
    const tags = await diaryStore.getTags();
    expect(tags.foo).toEqual(expect.arrayContaining([entry1.id, entry2.id]));
    expect(tags.bar).toEqual([entry2.id]);
  });

  test('update and delete entry updates tag index', async () => {
    // Add initial entries
    const entry1 = await diaryStore.add('First entry #foo');
    const entry2 = await diaryStore.add('Second entry #foo #bar');

    // Update the first entry and check if tags are updated
    await diaryStore.updateText(entry1.id, 'Updated entry #baz');
    let tags = await diaryStore.getTags();
    expect(tags.foo).toEqual([entry2.id]);
    expect(tags.bar).toEqual([entry2.id]);
    expect(tags.baz).toEqual([entry1.id]);

    // Remove the second entry and check if tags are updated
    await diaryStore.remove(entry2.id);
    tags = await diaryStore.getTags();
    expect(tags).toEqual({ baz: [entry1.id] });
  });
});
