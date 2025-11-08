
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import our components
import Header from './components/Header';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import ProductListPage from './components/ProductListPage';
import ProductDetailPage from './components/ProductDetailPage';

function App() {
  return (
    <Router>
      {/* The Header now appears on every page */}
      <Header />
      
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;