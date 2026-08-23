import fs from "node:fs";
import path from "node:path";

function parseFrontmatter(fileContent) {
  const frontmatterMatch = fileContent.match(/---\s*([\s\S]*?)\s*---/);

  if (!frontmatterMatch) {
    throw new Error("Content files must begin with frontmatter.");
  }

  const metadata = {};

  frontmatterMatch[1]
    .trim()
    .split("\n")
    .forEach((line) => {
      const separator = line.indexOf(":");

      if (separator === -1) return;

      const key = line.slice(0, separator).trim();
      const value = line
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      metadata[key] = value;
    });

  return {
    metadata,
    content: fileContent.replace(frontmatterMatch[0], "").trim(),
  };
}

function getMdxFiles(directory) {
  return fs.readdirSync(directory).filter((file) => path.extname(file) === ".mdx");
}

function readMdxFile(filePath) {
  return parseFrontmatter(fs.readFileSync(filePath, "utf-8"));
}

function getMdxData(directory) {
  return getMdxFiles(directory).map((file) => {
    const { metadata, content } = readMdxFile(path.join(directory, file));
    const slug = path.basename(file, path.extname(file));

    return { metadata, slug, content };
  });
}

export function getContentPosts() {
  return getMdxData(path.join(process.cwd(), "app", "content", "posts"));
}

export function formatDate(date, includeRelative = false) {
  const currentDate = new Date();
  const targetDate = new Date(`${date}T00:00:00`);
  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  const fullDate = targetDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) return fullDate;

  let relativeDate;

  if (yearsAgo > 0) {
    relativeDate = `${yearsAgo}y ago`;
  } else {
    const daysAgo = Math.floor(
      (currentDate.getTime() - targetDate.getTime()) / 86_400_000,
    );

    if (daysAgo > 30) relativeDate = `${Math.floor(daysAgo / 30)}mo ago`;
    else if (daysAgo > 0) relativeDate = `${daysAgo}d ago`;
    else relativeDate = "Today";
  }

  return `${fullDate} (${relativeDate})`;
}
