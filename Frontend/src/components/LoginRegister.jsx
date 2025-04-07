import React, { useState } from 'react';
import axios from 'axios';
import {
  Button, Form, Input, Card, Typography, Divider, Alert
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, GoogleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const url = isLogin ? '/api/login' : '/api/register';
      const payload = {
        ...values,
        email: values.email?.toLowerCase()
      };

      const response = await axios.post(`http://localhost:5000${url}`, payload, {
        withCredentials: true
      });

      setAlert({ type: 'success', message: response.data.message });
      form.resetFields();

      if (isLogin) {
        setTimeout(() => (window.location.href = '/'), 1500);
      } else {
        setIsLogin(true);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',

        padding: '2rem',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
          padding: '3rem 2.5rem',
          backgroundColor: '#fff',
        }}
      >
        <Title
          level={2}
          style={{
            textAlign: 'center',
            marginBottom: 32,
            fontWeight: 'bold',
            color: '#4b0082',
          }}
        >
          {isLogin ? '🔐 เข้าสู่ระบบ' : '📝 สมัครสมาชิก'}
        </Title>

        {alert && (
          <Alert
            {...alert}
            type={alert.type}
            message={alert.message}
            closable
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {!isLogin && (
            <Form.Item
              name="name"
              label="ชื่อผู้ใช้"
              rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="ชื่อของคุณ"
              />
            </Form.Item>
          )}
          <Form.Item
            name="email"
            label="อีเมล"
            rules={[{ required: true, message: 'กรุณากรอกอีเมล' }]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="example@email.com"
              type="email"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="รหัสผ่าน"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสผ่าน' },
              { min: 8, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 50,
                borderRadius: 999,
                fontWeight: 'bold',
                fontSize: '1rem',
                background: '#4b0082',
                borderColor: '#4b0082',
              }}
            >
              {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain style={{ margin: '2rem 0' }}>หรือ</Divider>

        <Button
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          block
          size="large"
          style={{
            background: '#db4437',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            height: 50,
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          เข้าสู่ระบบด้วย Google
        </Button>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: '1rem' }}>
            {isLogin ? 'ยังไม่มีบัญชีใช่ไหม?' : 'มีบัญชีอยู่แล้ว?'}{' '}
            <Button type="link" onClick={() => setIsLogin(!isLogin)} style={{ padding: 0, fontSize: '1rem' }}>
              {isLogin ? 'สมัครเลย' : 'เข้าสู่ระบบ'}
            </Button>
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default LoginRegister;
