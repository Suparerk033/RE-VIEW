import React, { useEffect, useState } from 'react';
import {  Typography, List, Avatar } from 'antd';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const { Title, Text } = Typography;

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/me', { withCredentials: true });
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (user && [1, 2].includes(user.role_id)) {
        setLoadingStats(true);
        try {
          const res = await axios.get('http://localhost:5000/api/stats', { withCredentials: true });
          setStats(res.data);
        } catch (err) {
          console.error('Error loading stats:', err);
        } finally {
          setLoadingStats(false);
        }
      }
    };
    fetchStats();
  }, [user]);

  if (loadingUser) return <div className="text-center mt-5 fs-4">⏳ กำลังโหลดผู้ใช้...</div>;
  if (!user || ![1, 2].includes(user.role_id)) return <div className="text-center mt-5 fs-4">🚫 ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  if (loadingStats || !stats) return <div className="text-center mt-5 fs-4">⏳ กำลังโหลดข้อมูล...</div>;

  const reviewChart = {
    labels: ['รีวิวทั้งหมด', 'อื่นๆ'],
    datasets: [
      {
        data: [stats.totalReviews, Math.max(1, stats.totalUsers - stats.totalReviews)],
        backgroundColor: ['#3f51b5', '#e0e0e0'],
        borderWidth: 2,
      },
    ],
  };

  const userChart = {
    labels: ['ผู้ใช้งานทั้งหมด', 'อื่นๆ'],
    datasets: [
      {
        data: [stats.totalUsers, 0.1],
        backgroundColor: ['#fbc02d', '#e0e0e0'],
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 14 },
          color: '#444',
        },
      },
      title: {
        display: true,
        text: title,
        font: { size: 20 },
        color: '#2c3e50',
        padding: { top: 10, bottom: 20 },
      },
    },
  });

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <Title level={2} style={{ fontWeight: 'bold', color: '#343a40' }}>
          📊 Dashboard สรุปข้อมูลระบบ
        </Title>
        <Text type="secondary" style={{ fontSize: '1.1rem' }}>
          ดูภาพรวมการใช้งานระบบอย่างรวดเร็วแบบชัดเจน
        </Text>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4 g-4">
        <div className="col-md-6">
          <div className="card text-white" style={{ backgroundColor: '#3f51b5' }}>
            <div className="card-body text-center">
              <h5 className="card-title fs-5">⭐ รีวิวทั้งหมด</h5>
              <p className="card-text fs-3 fw-bold">{stats.totalReviews.toLocaleString()} รีวิว</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-white" style={{ backgroundColor: '#fbc02d' }}>
            <div className="card-body text-center">
              <h5 className="card-title fs-5">🧑‍💻 ผู้ใช้งานทั้งหมด</h5>
              <p className="card-text fs-3 fw-bold">{stats.totalUsers.toLocaleString()} คน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row mb-5 g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow rounded-4">
            <div className="card-body">
              <Pie data={reviewChart} options={pieOptions('📘 รีวิวทั้งหมด')} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow rounded-4">
            <div className="card-body">
              <Pie data={userChart} options={pieOptions('👥 ผู้ใช้งานทั้งหมด')} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="card border-0 shadow-sm rounded-4 mb-5">
        <div className="card-body">
          <Title level={4} style={{ marginBottom: '1rem', color: '#3f51b5' }}>📰 รีวิวล่าสุด</Title>
          <List
            itemLayout="horizontal"
            dataSource={stats.recentReviews}
            renderItem={item => (
              <List.Item className="border-bottom">
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#3f51b5' }}>💬</Avatar>}
                  title={<Text strong>{item.title}</Text>}
                  description={
                    <span className="text-muted">
                      โดย {item.name} | {new Date(item.created_at).toLocaleString('th-TH')}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
