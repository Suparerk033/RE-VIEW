import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Avatar, Typography, Button,
  Form, Input, Spin, List, Rate, message, Popconfirm
} from 'antd';
import {
  UserOutlined, LogoutOutlined,
  EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

function UserProfile() {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/me', { withCredentials: true });
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchUserReviews = useCallback(async () => {
    if (!user) return;
    const res = await axios.get('http://localhost:5000/api/reviews', { withCredentials: true });
    const myReviews = res.data.filter(r => r.user_id === user.user_id);
    setReviews(myReviews);
  }, [user]);

  const handleLogout = async () => {
    await axios.get('http://localhost:5000/logout', { withCredentials: true });
    window.location.href = '/auth';
  };

  const handleUpdate = async (values) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${user.user_id}`, {
        name: values.name,
        role_id: user.role_id
      }, {
        withCredentials: true
      });

      message.success('✅ อัปเดตชื่อสำเร็จแล้ว');
      setEditing(false);
      fetchUser();
    } catch (err) {
      message.error('❌ เกิดข้อผิดพลาดในการอัปเดตชื่อ');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`http://localhost:5000/api/reviews/${reviewId}`, {
        withCredentials: true
      });
      message.success('🗑️ ลบโพสต์สำเร็จ');
      setReviews(prev => prev.filter(r => r.review_id !== reviewId));
    } catch (err) {
      console.error('❌ ลบโพสต์ไม่สำเร็จ:', err);
      message.error('เกิดข้อผิดพลาดขณะลบโพสต์');
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchUser();
      setLoading(false);
    };
    load();
  }, [fetchUser]);

  useEffect(() => {
    if (user) fetchUserReviews();
  }, [user, fetchUserReviews]);

  useEffect(() => {
    if (editing && user) {
      form.setFieldsValue({ name: user.name });
    }
  }, [editing, user, form]);

  if (loading || !user) {
    return <Spin size="large" style={{ display: 'block', margin: '5rem auto' }} />;
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <Card
        style={{
          padding: 32,
          borderRadius: 20,
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
          background: 'linear-gradient(to right, #ffffff, #fafafa)',
          marginBottom: 32,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={100}
            src={user.profile_pic ? `http://localhost:5000${user.profile_pic}` : null}
            icon={!user.profile_pic && <UserOutlined />}
            style={{ marginBottom: 16, border: '2px solid #ddd' }}
          />
          <Title level={4} style={{ marginBottom: 4 }}>{user.name}</Title>
          <Text type="secondary" style={{ fontSize: '0.95rem' }}>{user.email}</Text>
          <br />
          <Text strong style={{ marginTop: 8 }}>บทบาท: </Text>
          <Text code>{user.role_name || 'user'}</Text>
        </div>

        {editing ? (
          <Form form={form} layout="vertical" onFinish={handleUpdate}>
            <Form.Item
              name="name"
              label="ชื่อ"
              rules={[{ required: true, message: 'กรุณากรอกชื่อใหม่' }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
                บันทึก
              </Button>
              <Button type="text" onClick={() => setEditing(false)}>
                ยกเลิก
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              style={{
                marginRight: 12,
                borderRadius: 999,
                fontWeight: 'bold',
                backgroundColor: '#f0f0f0',
                borderColor: '#ddd'
              }}
            >
              แก้ไขชื่อ
            </Button>
            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                borderRadius: 999,
                fontWeight: 'bold'
              }}
            >
              ออกจากระบบ
            </Button>
          </div>
        )}
      </Card>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>📜 รีวิวที่ฉันโพสต์</Title>}
        style={{
          borderRadius: 20,
          boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
          background: '#fff'
        }}
      >
        <List
          dataSource={reviews}
          locale={{ emptyText: 'ยังไม่มีรีวิวที่คุณโพสต์' }}
          itemLayout="vertical"
          renderItem={item => (
            <List.Item
              style={{
                padding: '1rem 0',
                borderBottom: '1px solid #f0f0f0'
              }}
              actions={[
                <Link to={`/edit-post/${item.review_id}`} key="edit">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    style={{ padding: 0 }}
                  >
                    แก้ไขโพสต์
                  </Button>
                </Link>,
                <Popconfirm
                  key="delete"
                  title="คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?"
                  onConfirm={() => handleDeleteReview(item.review_id)}
                  okText="ใช่"
                  cancelText="ยกเลิก"
                >
                  <Button danger type="link" icon={<DeleteOutlined />} style={{ padding: 0 }}>
                    ลบโพสต์
                  </Button>
                </Popconfirm>
              ]}
            >
              <Title level={5} style={{ marginBottom: 4 }}>{item.title}</Title>
              <Paragraph style={{ marginBottom: 8 }}>{item.content}</Paragraph>
              <Rate disabled defaultValue={item.rating} />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default UserProfile;
