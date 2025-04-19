import { DateTime } from "luxon";
import markdownit from "markdown-it";
import hljs from "highlight.js"; 
import plantUmlPlugin from "./_11ty/plantuml.js";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css/output.css");
  eleventyConfig.addPassthroughCopy("assets/favicon");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("posts/*.png", {
    filter: (file) => {
      if (file) {
        return file.inputPath.includes("_0");
      }
    }
  });

  eleventyConfig.addFilter("formatDate", function (dateString, format) {
    const dateObj = DateTime.fromJSDate(new Date(dateString));
    if (!dateObj.isValid) {
      return "";
    }
    return dateObj.toFormat(format);
  });

  // Actual default values
  const md = markdownit({
    html: true, // Allow HTML tags in Markdown
    linkify: true, // Autoconvert URLs to links
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return (
            '<pre><code class="hljs">' +
            hljs.highlight(str, { language: lang, ignoreIllegals: true })
              .value +
            "</code></pre>"
          );
        } catch (__) {}
      }

      return (
        '<pre><code class="hljs">' + md.utils.escapeHtml(str) + "</code></pre>"
      );
    },
  });

  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPlugin(eleventyImageTransformPlugin);

  if (process.env.ELEVENTY_RUN_MODE === "build") {
    eleventyConfig.addPlugin(plantUmlPlugin);
  }

  eleventyConfig.addPairedShortcode("tldr", function(content) {
    return `<div class="border-l rounded-lg my-4">
      <div class="px-2 py-1 text-sm font-bold">tldr;</div>
      <div class="p-2 text-gray-800">${content}</div>
    </div>`;
  });
}
