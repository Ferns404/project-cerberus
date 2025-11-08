
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ProductListPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // This will now fetch our new hardcoded list!
    axios.get('http://localhost:3001/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>All Products</h2>
      <div className="product-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            {/* Image placeholder is now GONE */}
            <div className="product-card-content">
              <h3>{product.name}</h3>
              <p>${product.price}</p>
              <Link to={`/products/${product.id}`}>
                <button>View Details</button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductListPage;