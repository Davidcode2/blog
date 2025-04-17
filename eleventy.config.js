import { DateTime } from "luxon";
import markdownit from "markdown-it";
import hljs from "highlight.js"; 
import plantUmlPlugin from "./_11ty/plantuml.js";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css/output.css");
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

  eleventyConfig.addPassthroughCopy("admin");

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

  //  eleventyConfig.addPlugin(plantUmlPlugin);
}
