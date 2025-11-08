
import React from 'react';
import { Link, NavLink } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Cyber<span>Store</span>
        </Link>
        <ul className="nav-links">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/products">Products</NavLink>
          </li>
          <li>
            <NavLink to="/login" className="nav-link-button">
              Login
            </NavLink>
          </li>
        </ul>
      </div>
    </header>
  );
}

export default Header;