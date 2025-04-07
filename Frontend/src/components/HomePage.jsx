import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaPlusCircle, FaUserCircle, FaChartBar, FaUsers } from 'react-icons/fa';
import axios from 'axios';

function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/me', { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  const isAdmin = user?.role_id === 1;
  const isstaff = user?.role_id === 2;

  const menuItems = [
    {
      to: '/reviews',
      icon: <FaStar size={50} />,
      label: 'รีวิว',
    },
    {
      to: '/add-review',
      icon: <FaPlusCircle size={50} />,
      label: 'เพิ่มรีวิว',
    },
    {
      to: '/profile',
      icon: <FaUserCircle size={50} />,
      label: 'โปรไฟล์',
    },
    ...(isAdmin || isstaff ? [{
      to: '/dashboard',
      icon: <FaChartBar size={50} />,
      label: 'แดชบอร์ด',
    }] : []),
    ...(isAdmin ? [{
      to: '/admin',
      icon: <FaUsers size={50} />,
      label: 'ผู้ใช้',
    }] : []),
  ];

  return (
    <Container className="py-5 text-center">
      <h1 style={{ fontWeight: 900, fontSize: '3rem', color: '#512da8' }}>
        🔍 <span style={{ color: '#311b92' }}>RE:</span>VIEW
      </h1>
      <p className="text-muted mb-5" style={{ fontSize: '1.25rem' }}>
        แชร์ประสบการณ์ของคุณกับสินค้าที่ชื่นชอบ และดูรีวิวจากผู้ใช้จริงได้ที่นี่ ✨
      </p>

      <Row className="justify-content-center g-4">
        {menuItems.map((item, idx) => (
          <Col xs={12} sm={6} md={4} lg={3} key={idx}>
            <Link to={item.to} style={{ textDecoration: 'none' }}>
              <Card
                className="text-center shadow-lg"
                style={{
                  height: 180,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #ede7f6, #e3f2fd)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#512da8',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {item.icon}
                <h5 className="mt-3" style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
                  {item.label}
                </h5>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default HomePage;
