import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";

export default function (eleventyConfig) {
  eleventyConfig.addTransform("plantuml", async function (content) {
    const withPlantUmlImage = await processPlantUml(
      content,
      this.page.inputPath,
      eleventyConfig.dir.output || "_site",
    );
    return withPlantUmlImage;
  });
}

async function processPlantUml(content, inputPath, outputPath) {
  const umlBlocks = getUmlBlocks(content);
  let processedContent = content;
  if (!umlBlocks) {
    return processedContent;
  }
  for (const [index, umlBlockWithHtml] of umlBlocks.entries()) {
    if (!umlBlockWithHtml) {
      continue;
    }
    const umlCode = stripHtmlTags(umlBlockWithHtml);
    const replacement = await generateAndReplace(
      umlCode,
      index,
      inputPath,
      outputPath,
    );
    processedContent = processedContent.replace(umlBlockWithHtml, replacement);
  }
  return processedContent;
}

function getUmlBlocks(content) {
  // these are blocks which are directly in the markdown content
  const umlBlockRegex = /^<p>@startuml<\/p>\n(?:.*\n)+?^<p>@enduml<\/p>$/gm;
  // these are blocks enclosed in ```plantuml code blocks
  const codeBlockPlantumlRegex =
    /^<pre><code class="hljs">@startuml\n(?:.*\n)+?^@enduml\n<\/code><\/pre>$/gm;

  const umlBlocks = content.match(umlBlockRegex) || [];
  const codeBlocks = content.match(codeBlockPlantumlRegex) || [];
  const allPlantUmlBlocks = umlBlocks.concat(codeBlocks);
  if (allPlantUmlBlocks.length === 0) {
    return null;
  }
  return allPlantUmlBlocks;
}

async function generateAndReplace(umlCode, index, inputPath, outputPath) {
  const imagePath = await generatePngWithLocalPlantUml(
    umlCode,
    index,
    inputPath,
  );
  const imageOutputPath = path.join(outputPath, imagePath);
  try {
    await ensureDirectoryExists(path.dirname(imageOutputPath));
  } catch (error) {
    console.error(`Error ensuring directory exists:`, error);
    throw error;
  }
  await fs.copyFile(imagePath, imageOutputPath);

  const relativeImagePath = `/${imagePath}`;
  const generatedHtml = generateHtml(relativeImagePath, umlCode);
  return generatedHtml;
}

async function ensureDirectoryExists(directoryPath) {
  try {
    await fs.access(directoryPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        await fs.mkdir(directoryPath, { recursive: true });
      } catch (mkdirError) {
        console.error(
          `Error creating directory '${directoryPath}':`,
          mkdirError,
        );
        throw mkdirError; // Rethrow the error to be handled by the caller
      }
    } else {
      console.error(`Error accessing directory '${directoryPath}':`, error);
      throw error; // Rethrow other errors
    }
  }
}

async function generatePngWithLocalPlantUml(umlCode, index, imagePath) {
  const fileName = path.basename(imagePath, path.extname(imagePath));
  const formattedIndex = formatNumberWithLeadingZero(index);
  return new Promise((resolve, reject) => {
    const tempFile = path.join(
      path.dirname(imagePath),
      `${fileName}_${formattedIndex}.txt`,
    );

    fs.writeFile(tempFile, umlCode)
      .then(() => {
        exec(
          `java -jar ~/.plantuml/plantuml.jar -tpng -o "./" "${tempFile}"`,
          (error, stdout, stderr) => {
            fs.unlink(tempFile);
            if (error) {
              console.error(`exec error: ${error}`);
              reject(error);
              return;
            }
            resolve(tempFile.replace(".txt", ".png"));
          },
        );
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function formatNumberWithLeadingZero(number) {
  const formattedIndex = String(number + 1).padStart(3, "0");
  return formattedIndex;
}

function generateHtml(imagePath, umlCode) {
  const uniqueId = `plantuml-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return `
<div class="plantuml-container" id="${uniqueId}">
  <div class="tabs">
    <button class="tab-button active" data-tab="image-${uniqueId}">Image</button>
    <button class="tab-button" data-tab="code-${uniqueId}">Code</button>
  </div>
  <div class="tab-content" data-tab-content="image-${uniqueId}">
    <img src="${imagePath}" alt="PlantUML Diagram">
  </div>
  <div class="tab-content hidden" data-tab-content="code-${uniqueId}">
    <pre><code>${escapeHtml(umlCode)}</code></pre>
  </div>
</div>
<script>
  (function() {
    const container = document.getElementById('${uniqueId}');
    const buttons = container.querySelectorAll('.tab-button');
    const contents = container.querySelectorAll('.tab-content');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        buttons.forEach(btn => btn.classList.remove('active'));
        contents.forEach(content => content.classList.add('hidden'));
        button.classList.add('active');
        container.querySelector('.tab-content[data-tab-content="' + tab + '"]').classList.remove('hidden');
      });
    });
  })();
</script>
`;
}

function replaceEscapedCharacters(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function escapeHtml(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripHtmlTags(html) {
  const stripped = html.replace(/<[^>]*>/g, "");
  const withSymbols = replaceEscapedCharacters(stripped);
  return withSymbols;
}
