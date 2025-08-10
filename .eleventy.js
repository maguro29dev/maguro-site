// .eleventy.js

const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');
const { DateTime } = require('luxon');
const markdownIt = require('markdown-it');

module.exports = function (eleventyConfig) {
  // .envファイルから環境変数を読み込む
  require('dotenv').config();

  // MarkdownをHTMLに変換するための設定
  const md = new markdownIt({
    html: true, // HTMLタグの使用を許可
  });

  // MarkdownをHTMLに変換するフィルター
  eleventyConfig.addFilter("markdownToHtml", (content) => {
    if (!content) {
      return '';
    }
    return md.render(content);
  });

  // ContentfulのRich TextをHTMLに変換するフィルター
  eleventyConfig.addFilter("documentToHtml", (document) => {
    if (!document) {
      return '';
    }
    return documentToHtmlString(document);
  });

  // 日付をフォーマットするフィルター
  eleventyConfig.addFilter("formatDate", (dateObj) => {
    if (!dateObj) return '';
    return DateTime.fromISO(dateObj).setZone('Asia/Tokyo').toFormat('yyyy年MM月dd日');
  });
  
  // YouTubeの日付をフォーマットするフィルター
  eleventyConfig.addFilter("youtubeDate", (dateObj) => {
    if (!dateObj) return '';
    return DateTime.fromISO(dateObj).setZone('Asia/Tokyo').toFormat('M/d(EEE) HH:mm');
  });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['md', 'njk', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
  };
};
