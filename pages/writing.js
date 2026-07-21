// pages/writing.js - Writing and Works page
import Navigation from "../components/Navigation";
import Link from "next/link";

const writings = [
  {
    id: "sample-research-paper",
    title: "Sample Research Paper",
    description: "A comprehensive analysis of emerging technologies in computational science, exploring novel approaches to data processing and algorithm optimization.",
    year: "2024",
    category: "Research",
  },
  {
    id: "technical-report",
    title: "Technical Report on AI Applications",
    description: "Analysis of emerging artificial intelligence technologies and their practical applications in modern software development.",
    year: "2023",
    category: "Technical",
  },
  {
    id: "advanced-html-demo",
    title: "Advanced HTML Demo",
    description: "A comprehensive demonstration of HTML content with multiple interactive elements.",
    year: "2024",
    category: "Demo",
  },
  {
    id: "html-example",
    title: "HTML Example with PDF Lightbox",
    description: "A demonstration of how to embed HTML content with PDF lightboxes in the writing system.",
    year: "2024",
    category: "Demo",
  },
  {
    id: "titanic-ml-analysis",
    title: "Titanic Dataset Machine Learning Analysis",
    description: "A comprehensive machine learning analysis of the Titanic dataset using Python, pandas, and scikit-learn.",
    year: "2024",
    category: "Data Science",
  },
  {
    id: "titanic-direct",
    title: "Titanic Dataset Analysis (Direct HTML)",
    description: "Direct Quarto HTML output - no conversion needed!",
    year: "2024",
    category: "Data Science",
  }
];

export default function Writing() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navigation />

      <div style={{ maxWidth: "768px", margin: "0 auto", padding: "6rem 2rem" }}>
        <h1 style={{ fontSize: "2.75rem", color: "#0d1b2a", marginBottom: "1rem", fontFamily: "Lora, serif", fontWeight: 500, letterSpacing: "-0.02em" }}>
          Research & Writing
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#475569", marginBottom: "4rem", lineHeight: 1.8 }}>
          A collection of my academic and professional writings.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          {writings.map((writing) => (
            <article key={writing.id} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                {writing.year} — {writing.category}
              </span>
              <h2 style={{ fontSize: "1.75rem", margin: "0 0 1rem 0", fontFamily: "Lora, serif", fontWeight: 500, lineHeight: 1.3 }}>
                <Link href={`/writing/${writing.id}`} style={{ color: "#2c5282", textDecoration: "none" }}>
                  {writing.title}
                </Link>
              </h2>
              <p style={{ color: "#475569", margin: 0, lineHeight: 1.8 }}>{writing.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
