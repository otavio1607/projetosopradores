import React from 'react';

const Landing = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to Our Company</h1>
        <p>Showcasing our values and commitment to excellence.</p>
      </section>

      {/* Values Cards Section */}
      <section className="values">
        <h2>Our Values</h2>
        <div className="value-cards">
          <div className="card">
            <h3>Integrity</h3>
            <p>We uphold the highest standards of integrity in all of our actions.</p>
          </div>
          <div className="card">
            <h3>Innovation</h3>
            <p>We pursue innovation to create exceptional solutions for our clients.</p>
          </div>
          <div className="card">
            <h3>Collaboration</h3>
            <p>We believe in teamwork and open communication to achieve our goals.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Our Features</h2>
        <ul>
          <li>Feature 1: High-quality products</li>
          <li>Feature 2: Excellent Customer Service</li>
          <li>Feature 3: Reliable Support</li>
        </ul>
      </section>

      {/* Call to Action Button */}
      <section className="cta">
        <h2>Join Us Today!</h2>
        <button>Get Started</button>
      </section>
    </div>
  );
};

export default Landing;
