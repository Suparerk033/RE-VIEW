import React from 'react';
import HomePage from '../components/HomePage';
import ReviewList from '../components/ReviewList';

function HomeWithReviews() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <HomePage />
      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
      <ReviewList />
    </div>
  );
}

export default HomeWithReviews;
