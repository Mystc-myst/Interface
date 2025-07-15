const assert = require('assert');
const diaryStore = require('../diaryStore');

// This is a private function, so we need to test it indirectly.
// We can expose it for testing purposes, or test it via the public API.
// For this test, we'll add a temporary export to diaryStore.js.
// In a real-world scenario, you might use a library like `rewire` to access private functions.

// A better approach is to test the public methods that use parseHashtags.
describe('Hashtag Parsing', () => {
  it('should correctly parse a simple hashtag', async () => {
    const entry = await diaryStore.add('This is a #test entry.');
    assert.deepStrictEqual(entry.hashtags, ['#test']);
    await diaryStore.remove(entry.id);
  });

  it('should correctly parse a hashtag with a hyphen', async () => {
    const entry = await diaryStore.add('This is a #test-with-hyphen entry.');
    assert.deepStrictEqual(entry.hashtags, ['#test-with-hyphen']);
    await diaryStore.remove(entry.id);
  });

  it('should correctly parse a hashtag at the end of a sentence', async () => {
    const entry = await diaryStore.add('This is a test #end.');
    assert.deepStrictEqual(entry.hashtags, ['#end']);
    await diaryStore.remove(entry.id);
  });

  it('should correctly parse a hashtag with a comma', async () => {
    const entry = await diaryStore.add('This is a test #comma,');
    assert.deepStrictEqual(entry.hashtags, ['#comma']);
    await diaryStore.remove(entry.id);
  });

  it('should correctly parse multiple hashtags', async () => {
    const entry = await diaryStore.add('This has #multiple #hashtags-in-it.');
    assert.deepStrictEqual(entry.hashtags.sort(), ['#hashtags-in-it', '#multiple'].sort());
    await diaryStore.remove(entry.id);
  });

  it('should not parse a hashtag with a space', async () => {
    const entry = await diaryStore.add('This is #not a hashtag.');
    assert.deepStrictEqual(entry.hashtags, ['#not']);
    await diaryStore.remove(entry.id);
  });
});
