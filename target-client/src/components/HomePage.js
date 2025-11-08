
import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="hero">
      <h1>Welcome to the CyberStore</h1>
      <p>The most advanced (and vulnerable lol) e-commerce site on the web.</p>
      <Link to="/products">
        <button>Browse All Products</button>
      </Link>
    </div>
  );
}

export default HomePage;