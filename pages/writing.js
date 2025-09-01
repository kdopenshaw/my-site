// pages/writing.js - Writing and Works page
import Navigation from "../components/Navigation";
import WritingCard from "../components/WritingCard";
import { getAllWritings } from "../lib/writings";

export default function Writing({ writings = [] }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navigation />

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem 10%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "3rem",
              color: "#2c5282",
              marginBottom: "1rem",
              fontWeight: "bold",
            }}
          >
            Research & Writing
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "#4a5568",
              marginBottom: "2rem",
            }}
          >
            A collection of my academic and professional writings
          </p>
        </div>

        {/* Writing Grid - Masonry Style */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gridAutoRows: "auto",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {writings && writings.length > 0 ? (
            writings.map((writing, index) => (
              <div
                key={writing.id}
                style={{
                  gridRow: `span ${index % 3 === 0 ? 2 : 1}`,
                  transform: `rotate(${((index % 5) - 2) * 0.5}deg)`,
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `rotate(0deg) scale(1.02)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${
                    ((index % 5) - 2) * 0.5
                  }deg) scale(1)`;
                }}
              >
                <WritingCard
                  id={writing.id}
                  title={writing.title}
                  description={writing.description}
                  image={writing.image}
                  year={writing.year}
                  pages={writing.pages}
                  category={writing.category}
                />
              </div>
            ))
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "#4a5568",
              }}
            >
              <p>Loading writings...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  try {
    const writings = getAllWritings();
    return {
      props: {
        writings,
      },
    };
  } catch (error) {
    console.error("Error loading writings:", error);
    return {
      props: {
        writings: [],
      },
    };
  }
}

// ?? Why does the async function run first if it is defined below? Shouldn't the main function not run until the async one is done because then writings in defined
