const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', '..', 'offline-diary', 'diary.json');
let diaryStore;
let originalData;

beforeAll(() => {
  originalData = fs.readFileSync(DATA_FILE, 'utf8');
  diaryStore = require('../diaryStore');
});

afterAll(() => {
  fs.writeFileSync(DATA_FILE, originalData);
});

describe('tag index updates', () => {
  let entry1; let entry2;

  test('add entries updates tag index', async () => {
    entry1 = await diaryStore.add('First entry #foo');
    entry2 = await diaryStore.add('Second entry #foo #bar');
    const tags = await diaryStore.getTags();
    expect(tags.foo).toEqual(expect.arrayContaining([entry1.id, entry2.id]));
    expect(tags.bar).toEqual([entry2.id]);
  });

  test('update and delete entry updates tag index', async () => {
    await diaryStore.updateText(entry1.id, 'Updated entry #baz');
    let tags = await diaryStore.getTags();
    expect(tags.foo).toEqual([entry2.id]);
    expect(tags.bar).toEqual([entry2.id]);
    expect(tags.baz).toEqual([entry1.id]);

    await diaryStore.remove(entry2.id);
    tags = await diaryStore.getTags();
    expect(tags).toEqual({ baz: [entry1.id] });
  });

  afterAll(async () => {
    await diaryStore.remove(entry1.id);
  });
});
