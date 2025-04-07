import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReviewCard from '../components/ReviewCard';
import { Typography, Space, Spin, Empty } from 'antd';

const { Title } = Typography;

function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/me', { withCredentials: true });
      setCurrentUser(res.data.user);
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reviews', {
        withCredentials: true,
      });
      setReviews(res.data);
    } catch (error) {
      console.error('❌ ดึงข้อมูลรีวิวไม่สำเร็จ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reviewId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/reviews/${reviewId}/like`,
        {},
        { withCredentials: true }
      );
      fetchReviews();
    } catch (error) {
      console.error('❌ กดถูกใจไม่สำเร็จ:', error);
    }
  };

  const handleCommentClick = (reviewId) => {
    window.location.href = `/reviews/${reviewId}`;
  };

  const handleDeleteReview = (deletedId) => {
    setReviews(prev => prev.filter(r => r.review_id !== deletedId));
  };

  useEffect(() => {
    fetchUser();
    fetchReviews();
  }, []);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '2rem auto',
        padding: '0 1rem',
      }}
    >
      <Title level={3} style={{ textAlign: 'center', color: '#4a148c', marginBottom: '2rem' }}>
        รีวิวจากผู้ใช้งานจริง
      </Title>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <Spin tip="กำลังโหลด...">
  <div style={{ padding: 20 }}>
    <p>Loading content...</p>
  </div>
</Spin>
        </div>
      ) : reviews.length === 0 ? (
        <Empty description="ยังไม่มีรีวิวในขณะนี้" style={{ marginTop: 80 }} />
      ) : (
        <Space direction="vertical" size={32} style={{ width: '100%' }}>
          {reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              onLike={handleLike}
              onComment={handleCommentClick}
              currentUser={currentUser}
              onDeleted={handleDeleteReview}
            />
          ))}
        </Space>
      )}
    </div>
  );
}

export default ReviewList;
