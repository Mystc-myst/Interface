const diaryStore = require('../diaryStore');

describe('diaryStore', () => {
  describe('parseHashtags', () => {
    it('should parse a single hashtag', () => {
      expect(diaryStore.parseHashtags('#foo')).toEqual(['foo']);
    });

    it('should parse multiple hashtags', () => {
      expect(diaryStore.parseHashtags('#foo #bar')).toEqual(['foo', 'bar']);
    });

    it('should handle mixed case and convert to lowercase', () => {
      expect(diaryStore.parseHashtags('#Foo #BAR')).toEqual(['foo', 'bar']);
    });

    it('should handle hyphens and underscores', () => {
      expect(diaryStore.parseHashtags('#foo-bar #baz_qux')).toEqual(['foo-bar', 'baz_qux']);
    });

    it('should handle hashtags with trailing punctuation', () => {
      expect(diaryStore.parseHashtags('#foo, #bar.')).toEqual(['foo', 'bar']);
    });

    it('should handle duplicate hashtags', () => {
      expect(diaryStore.parseHashtags('#foo #foo')).toEqual(['foo']);
    });

    it('should return an empty array for text with no hashtags', () => {
      expect(diaryStore.parseHashtags('this is some text')).toEqual([]);
    });

    it('should return an empty array for an empty string', () => {
      expect(diaryStore.parseHashtags('')).toEqual([]);
    });
  });
});
