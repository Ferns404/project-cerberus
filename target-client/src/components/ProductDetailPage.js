
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { id } = useParams();

  const fetchProductDetails = () => {
    axios.get(`http://localhost:3001/api/products/${id}`)
      .then(res => {
        setProduct(res.data.product);
        setComments(res.data.comments);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    
    if (!loggedInUser) {
      alert('You must be logged in to comment!');
      return;
    }

    try {
      // We are correctly posting to the SECURE endpoint
      await axios.post(`http://localhost:3001/api/products/${id}/comments-secure`, {
        comment_text: newComment,
      });
      
      setNewComment('');
      fetchProductDetails(); // Refresh the comments
    } catch (err) {
      console.error(err);
    }
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div>
      <div className="card">
        <h2>{product.name}</h2>
        <h3>${product.price}</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          {product.description}
        </p>
      </div>

      <div className="card">
        <h3>Post a Comment</h3>
        <form onSubmit={handleCommentSubmit}>
          <textarea
            rows="4"
            placeholder="Write a comment..."
            value={newComment}
            // --- THIS WAS THE BUG. It's now fixed. ---
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button type="submit">Post Comment</button>
        </form>
      </div>

      <div className="card">
        <h3>Comments ({comments.length})</h3>
        <div style={{marginTop: '2rem'}}>
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <strong>{comment.username}</strong>
              <p>{comment.comment_text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;