// pages/index.js - Your main portfolio page
import Navigation from "../components/Navigation";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navigation />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "1rem 10%",
        }}
      >
        {/* Left Content */}
        <div style={{ flex: 1, minWidth: "50%", padding: "0rem 1rem" }}>
          <h1
            style={{
              fontSize: "3rem",
              color: "#2c5282",
              marginBottom: "1rem",
              fontWeight: "bold",
            }}
          >
            Hi, I'm Keith!
          </h1>

          <p
            style={{
              fontSize: "1rem",
              color: "#4a5568",
              marginBottom: "1rem",
              lineHeight: "1.6",
            }}
          >
            I have a lot of interests.
          </p>

          <p
            style={{
              fontSize: "1rem",
              color: "#4a5568",
              marginBottom: "1rem",
              lineHeight: "1.6",
            }}
          >
            Some of them are on this site. Check it out!
          </p>

          {/* LinkedIn Button */}
          <a href="https://www.linkedin.com/in/keith-openshaw/">
            <img
              src="/linkedin.png"
              alt="linkedin"
              style={{ width: "30px", height: "30px" }}
            />
          </a>
        </div>

        {/* Right Content - Fractal Background */}
        <div style={{ flex: 1, padding: "0rem 1rem" }}>
          <img
            src="/julia_0.2841_notext.png"
            alt="fractal"
            style={{ width: "90%", height: "90%" }}
          />
        </div>
      </div>
    </div>
  );
}
