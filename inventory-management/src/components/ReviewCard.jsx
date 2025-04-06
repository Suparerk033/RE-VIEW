import React from 'react';
import {
  Card,
  Avatar,
  Rate,
  Button,
  Typography,
  Space,
  Popconfirm,
  message
} from 'antd';
import {
  HeartOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from 'axios';

const { Text, Paragraph } = Typography;

function ReviewCard({ review, onLike, onComment, currentUser, onDeleted }) {
  const isOwner = currentUser?.user_id === review.user_id;
  const isAdmin = Number(currentUser?.role_id) === 1;
  const isManager = Number(currentUser?.role_id) === 2;
  const canEditOrDelete = isOwner || isAdmin || isManager;

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/reviews/${review.review_id}`, {
        withCredentials: true
      });
      message.success('ลบโพสต์สำเร็จ');
      if (onDeleted) onDeleted(review.review_id);
    } catch (err) {
      console.error('❌ ลบโพสต์ไม่สำเร็จ:', err);
      message.error('เกิดข้อผิดพลาดขณะลบโพสต์');
    }
  };

  return (
    <Card
      hoverable
      style={{
        marginBottom: 32,
        borderRadius: 16,
        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        maxWidth: 720,
        margin: 'auto',
        border: '1px solid #f0f0f0',
      }}
      cover={
        review.image_url && (
          <img
            alt="review"
            src={`http://localhost:5000${review.image_url}`}
            style={{
              width: '100%',
              maxHeight: 400,
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )
      }
    >
      {/* ส่วนหัว */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap'
      }}>
        <Avatar
          size={56}
          src={
            review.profile_pic
              ? `http://localhost:5000${review.profile_pic}`
              : '/default-avatar.png'
          }
        />
        <div style={{ flex: 1, minWidth: 150 }}>
          <Text strong style={{ fontSize: '1.05rem', display: 'block' }}>
            {review.name}
          </Text>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>
            {review.title}
          </Text>
        </div>
      </div>

      {/* เนื้อหา */}
      <Paragraph
        style={{
          fontSize: '1.05rem',
          lineHeight: 1.75,
          wordBreak: 'break-word',
          whiteSpace: 'pre-line'
        }}
      >
        {review.content}
      </Paragraph>

      {/* คะแนน */}
      <div style={{ marginBottom: 16 }}>
        <Rate disabled defaultValue={review.rating} style={{ fontSize: 20 }} />
      </div>

      {/* ปุ่มควบคุม */}
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* ปุ่ม Like / Comment */}
        <Space size="middle" wrap>
          <Button
            type="default"
            onClick={() => onLike(review.review_id)}
            icon={<HeartOutlined />}
            style={{
              backgroundColor: '#fff0f6',
              borderColor: '#ffadd2',
              color: '#eb2f96',
              borderRadius: 20,
              fontWeight: 500
            }}
          >
            {review.likes} ถูกใจ
          </Button>

          <Button
            type="default"
            onClick={() => onComment(review.review_id)}
            icon={<MessageOutlined />}
            style={{
              backgroundColor: '#e6f7ff',
              borderColor: '#91d5ff',
              color: '#1890ff',
              borderRadius: 20,
              fontWeight: 500
            }}
          >
            {review.comments} ความคิดเห็น
          </Button>
        </Space>

        {/* ปุ่ม แก้ไข / ลบ */}
        {canEditOrDelete && (
          <Space size="middle" wrap>
            <Link to={`/edit-post/${review.review_id}`}>
              <Button
                type="default"
                icon={<EditOutlined />}
                style={{
                  borderRadius: 20,
                  backgroundColor: '#fff7e6',
                  borderColor: '#ffd591',
                  color: '#fa8c16',
                  fontWeight: 500
                }}
              >
                แก้ไขโพสต์
              </Button>
            </Link>

            <Popconfirm
              title="คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?"
              onConfirm={handleDelete}
              okText="ใช่, ลบเลย"
              cancelText="ยกเลิก"
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                style={{
                  borderRadius: 20,
                  fontWeight: 500
                }}
              >
                ลบโพสต์
              </Button>
            </Popconfirm>
          </Space>
        )}
      </div>
    </Card>
  );
}

export default ReviewCard;
