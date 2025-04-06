import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Button, Avatar, Dropdown, Typography } from 'antd';
import {
  UserOutlined, LogoutOutlined, HomeOutlined,
  FileTextOutlined, PlusOutlined, TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';

// Pages & Components
import ProductList from './components/ProductList';
import AddProduct from './components/AddProduct';
import EditProduct from './components/EditProduct';
import AdminUserManager from './components/AdminUserManager';
import LoginRegister from './components/LoginRegister';
import PrivateRoute from './components/PrivateRoute';
import ReviewList from './components/ReviewList';
import AddReview from './pages/AddReview';
import ReviewDetail from './pages/ReviewDetail';
import UserProfile from './pages/UserProfile';
import HomeWithReviews from './pages/HomeWithReviews';
import EditReview from './pages/EditReview';
import Dashboard from './pages/Dashboard';

const { Header, Content } = Layout;
const { Text } = Typography;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/me', {
          withCredentials: true
        });
        setUser(res.data.user || null);
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error('⚠️ ไม่สามารถโหลดข้อมูลผู้ใช้:', err);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/logout', { withCredentials: true });
      setUser(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const dropdownItems = [
    {
      type: 'group',
      label: (
        <div style={{
          padding: '6px 16px',
          fontWeight: 'bold',
          fontSize: '15px',
          color: '#555'
        }}>
          เมนูหลัก
        </div>
      ),
      children: [
        {
          key: 'home',
          icon: <HomeOutlined />,
          label: (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Text style={{ fontSize: 16, color: 'inherit' }} strong>หน้าหลัก</Text>
            </Link>
          ),
        },
        {
          key: 'reviews',
          icon: <FileTextOutlined />,
          label: (
            <Link to="/reviews" style={{ textDecoration: 'none' }}>
              <Text style={{ fontSize: 16, color: 'inherit' }} strong>รีวิวทั้งหมด</Text>
            </Link>
          ),
        },
        {
          key: 'add-review',
          icon: <PlusOutlined />,
          label: (
            <Link to="/add-review" style={{ textDecoration: 'none' }}>
              <Text style={{ fontSize: 16, color: 'inherit' }} strong>เพิ่มรีวิว</Text>
            </Link>
          ),
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: (
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <Text style={{ fontSize: 16, color: 'inherit' }} strong>โปรไฟล์</Text>
            </Link>
          ),
        },
        ...(user?.role_id === 1 || user?.role_id === 2 ? [
          {
            key: 'dashboard',
            icon: <FileTextOutlined />,
            label: (
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <Text style={{ fontSize: 16, color: 'inherit' }} strong>แดชบอร์ด</Text>
              </Link>
            ),
          }
        ] : []),
        ...(user?.role_id === 1 ? [
          {
            key: 'admin-users',
            icon: <TeamOutlined />,
            label: (
              <Link to="/admin" style={{ textDecoration: 'none' }}>
                <Text style={{ fontSize: 16, color: 'inherit' }} strong>จัดการผู้ใช้</Text>
              </Link>
            ),
          }
        ] : []),
      ],
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#ff4d4f' }} />,
      label: (
        <span
          style={{ fontSize: '16px', color: '#ff4d4f' }}
          onClick={handleLogout}
        >
          ออกจากระบบ
        </span>
      ),
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 64 }}>⏳ กำลังโหลดข้อมูลผู้ใช้...</div>;
  }

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            backgroundColor: '#fff',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: 64,
          }}
        >
          {/* LEFT: Home Icon + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#1890ff' }}>
              <HomeOutlined
                style={{ fontSize: 22, cursor: 'pointer' }}
                title="หน้าหลัก"
              />
            </Link>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1890ff', letterSpacing: 1 }}>
              RE:VIEW
            </div>
          </div>

          {/* RIGHT: User dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user ? (
              <Dropdown
                placement="bottomRight"
                trigger={['click']}
                menu={{ items: dropdownItems }}
              >
                <div
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 16px',
                    borderRadius: 30,
                    backgroundColor: '#fafafa',
                    border: '1px solid #ddd',
                  }}
                >
                  <Avatar
                    size={36}
                    src={user?.profile_pic ? `http://localhost:5000${user.profile_pic}` : null}
                    icon={!user?.profile_pic && <UserOutlined />}
                  />
                  <Text style={{ fontWeight: 600, fontSize: 16 }}>{user.name}</Text>
                </div>
              </Dropdown>
            ) : (
              <Link to="/auth">
                <Button type="primary" shape="round" size="middle">
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}
          </div>
        </Header>

        <Content style={{ padding: '2rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Routes>
              <Route path="/auth" element={<LoginRegister />} />
              <Route path="/" element={<PrivateRoute user={user}><HomeWithReviews /></PrivateRoute>} />
              <Route path="/reviews" element={<PrivateRoute user={user}><ReviewList /></PrivateRoute>} />
              <Route path="/add-review" element={<PrivateRoute user={user}><AddReview /></PrivateRoute>} />
              <Route path="/reviews/:id" element={<PrivateRoute user={user}><ReviewDetail /></PrivateRoute>} />
              <Route path="/edit-post/:id" element={<PrivateRoute user={user}><EditReview /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute user={user}><UserProfile /></PrivateRoute>} />
              <Route path="/products" element={
                <PrivateRoute user={user} allowedRoles={['admin', 'staff', 'viewer']}>
                  <ProductList user={user} />
                </PrivateRoute>
              } />
              <Route path="/products/add" element={
                <PrivateRoute user={user} allowedRoles={['admin', 'staff']}>
                  <AddProduct />
                </PrivateRoute>
              } />
              <Route path="/products/edit/:id" element={
                <PrivateRoute user={user} allowedRoles={['admin', 'staff']}>
                  <EditProduct />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <PrivateRoute user={user} allowedRoles={['admin']}>
                  <AdminUserManager />
                </PrivateRoute>
              } />
              <Route path="/dashboard" element={
                <PrivateRoute user={user} allowedRoles={['admin', 'staff']}>
                  <Dashboard />
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
