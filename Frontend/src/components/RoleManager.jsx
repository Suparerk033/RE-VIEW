// RoleManager.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Select, message } from 'antd';


function RoleManager() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        withCredentials: true,
      });
      setUsers(res.data);
    } catch (err) {
      message.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        { role_id: newRoleId },
        { withCredentials: true }
      );
      message.success('อัปเดต Role สำเร็จ');
      fetchUsers();
    } catch (err) {
      message.error('ไม่สามารถอัปเดต Role ได้');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const roleOptions = [
    { label: 'Admin', value: 1 },
    { label: 'staff', value: 2 },
    { label: 'User', value: 3 },
  ];

  const columns = [
    { title: 'ชื่อ', dataIndex: 'name', key: 'name' },
    { title: 'อีเมล', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      key: 'role_name',
      render: (text, record) => (
        <Select
          defaultValue={record.role_name}
          style={{ width: 150 }}
          onChange={(val) => handleRoleChange(record.user_id, val)}
          options={roleOptions}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🛡️ จัดการสิทธิ์ผู้ใช้</h2>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="user_id"
        pagination={{ pageSize: 6 }}
        bordered
      />
    </div>
  );
}

export default RoleManager;
