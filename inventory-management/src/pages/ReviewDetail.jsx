import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, List, Avatar, Form, Input, Button, Rate, message, Typography
} from 'antd';
import axios from 'axios';

const { Paragraph, Text } = Typography;

function ReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resReview = await axios.get(`http://localhost:5000/api/reviews`);
        const found = resReview.data.find(r => r.review_id === Number(id));
        setReview(found);

        const resComments = await axios.get(`http://localhost:5000/api/reviews/${id}/comments`);
        setComments(resComments.data);
      } catch (err) {
        message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    try {
      await axios.post(
        `http://localhost:5000/api/reviews/${id}/comment`,
        { content: comment },
        { withCredentials: true }
      );
      setComment("");
      const res = await axios.get(`http://localhost:5000/api/reviews/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      message.error('โพสต์คอมเมนต์ไม่สำเร็จ');
    }
  };

  if (!review)
    return <div style={{ textAlign: 'center', marginTop: 64 }}>⏳ กำลังโหลดข้อมูลรีวิว...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
          marginBottom: 32
        }}
        cover={
          review.image_url && (
            <img
              src={`http://localhost:5000${review.image_url}`}
              alt="review"
              style={{
                width: '100%',
                maxHeight: 360,
                objectFit: 'cover',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16
              }}
            />
          )
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <Avatar
            src={review.profile_pic ? `http://localhost:5000${review.profile_pic}` : '/default-avatar.png'}
            size="large"
          />
          <div style={{ marginLeft: 12 }}>
            <Text strong>{review.name}</Text>
            <div style={{ fontSize: '0.9rem', color: '#888' }}>{review.title}</div>
          </div>
        </div>

        <Paragraph style={{ fontSize: '1rem', lineHeight: 1.6 }}>{review.content}</Paragraph>
        <Rate disabled defaultValue={review.rating} style={{ fontSize: 20 }} />
      </Card>

      <Card
        title="💬 ความคิดเห็น"
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <List
          dataSource={comments}
          locale={{ emptyText: 'ยังไม่มีความคิดเห็น' }}
          renderItem={(item) => (
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <Avatar
                  src={item.profile_pic ? `http://localhost:5000${item.profile_pic}` : '/default-avatar.png'}
                  alt={item.name}
                />
                <strong style={{ marginLeft: 10 }}>{item.name}</strong>
              </div>
              <div style={{ marginBottom: 4 }}>{item.content}</div>
              <small style={{ color: '#999' }}>{new Date(item.created_at).toLocaleString()}</small>
            </div>
          )}
        />

        <Form onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Form.Item>
            <Input.TextArea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="แสดงความคิดเห็นของคุณ..."
              style={{ borderRadius: 12 }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ borderRadius: 999, height: 45, fontWeight: 'bold' }}
            >
              โพสต์คอมเมนต์
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ReviewDetail;
