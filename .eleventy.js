// この1行をファイルの先頭に追加します
require('dotenv').config();

module.exports = function(eleventyConfig) {
  // Nunjucksで日付をフォーマットするためのフィルターを追加
  eleventyConfig.addFilter("date", function(dateObj, format) {
    // luxon はこのフィルターの中で呼び出します
    const { DateTime } = require("luxon");
    // .setLocale('ja') を追加して、曜日などを日本語で表示します
    return DateTime.fromJSDate(new Date(dateObj)).setZone('Asia/Tokyo').setLocale('ja').toFormat(format);
  });

  return {
    // .md ファイルを Nunjucks エンジンで処理するように設定します
    markdownTemplateEngine: "njk",
    
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
