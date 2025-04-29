const keywordExtractor = require('keyword-extractor');

exports.extractKeywords = (text) => {
  return keywordExtractor.extract(text, {
    language: 'portuguese',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true
  });
};
