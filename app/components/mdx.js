import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React from "react";

import PdfDocument from "./pdf-document";

function Table({ data }) {
  return (
    <table>
      <thead>
        <tr>
          {data.headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CustomLink({ href = "", ...props }) {
  if (href.startsWith("/")) return <Link href={href} {...props} />;
  if (href.startsWith("#")) return <a href={href} {...props} />;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
}

function Code({ children, ...props }) {
  const codeHtml = highlight(String(children));

  return <code dangerouslySetInnerHTML={{ __html: codeHtml }} {...props} />;
}

function RoundedImage(props) {
  return <Image className="prose-image" {...props} />;
}

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

function createHeading(level) {
  const Heading = ({ children }) => {
    const slug = slugify(children);

    return React.createElement(
      `h${level}`,
      { id: slug },
      children,
    );
  };

  Heading.displayName = `Heading${level}`;

  return Heading;
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  a: CustomLink,
  code: Code,
  Image: RoundedImage,
  PdfDocument,
  Table,
};

export default function CustomMdx({ source }) {
  return <MDXRemote source={source} components={components} />;
}
