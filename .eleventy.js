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
  
  // YouTubeの日付をフォーマットするフィルター (日本語対応)
  eleventyConfig.addFilter("youtubeDate", (dateObj) => {
    if (!dateObj) return '';
    // setLocale('ja-JP') を追加して、曜日を日本語で表示するようにします
    return DateTime.fromISO(dateObj).setZone('Asia/Tokyo').setLocale('ja-JP').toFormat('M/d(EEE) HH:mm');
  });

  // 数字をカンマ区切りにするフィルター (例: 12345 → 12,345)
  eleventyConfig.addFilter("commaNumber", (number) => {
    if (number === undefined || number === null) return '';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  });

  // Eleventyが監視するファイルを追加
  eleventyConfig.addWatchTarget("./src/css/");

  // パススルーコピーの設定
  eleventyConfig.addPassthroughCopy("src/images");

  // 日付でソートするためのカスタムフィルター
  eleventyConfig.addFilter("sortByDate", (values) => {
    if (!values || !Array.isArray(values)) {
      return values;
    }
    return values.slice().sort((a, b) => {
      // ▼▼▼【変更】'fields.date'から'sys.createdAt'に変更 ▼▼▼
      const dateA = new Date(a.sys.createdAt);
      const dateB = new Date(b.sys.createdAt);
      return dateB - dateA; // 新しい順
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};