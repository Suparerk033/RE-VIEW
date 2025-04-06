import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, message, Avatar, Tag, Select, Card, Space, Typography, Divider
} from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Title, Text } = Typography;

function AdminUserManager() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      message.error('ดึงข้อมูลผู้ใช้ไม่สำเร็จ');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showEditModal = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      name: record.name,
      role_id: record.role_id,
      newPassword: '',
    });
  };

  const handleEdit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await axios.put(`http://localhost:5000/api/users/${editingUser.user_id}`, values, {
        withCredentials: true,
      });

      message.success('อัปเดตสำเร็จ');
      fetchUsers();
      setEditingUser(null);
      form.resetFields();
    } catch (err) {
      message.error('เกิดข้อผิดพลาดขณะอัปเดต');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, name) => {
    Modal.confirm({
      title: `ลบ "${name}"?`,
      content: 'คุณแน่ใจว่าต้องการลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
      okText: 'ลบเลย',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/users/${userId}`, { withCredentials: true });
          message.success('ลบผู้ใช้เรียบร้อย');
          fetchUsers();
        } catch (err) {
          message.error('ไม่สามารถลบผู้ใช้ได้');
        }
      }
    });
  };

  const handleAddUser = async () => {
    try {
      const values = await addForm.validateFields();
      setLoading(true);

      await axios.post('http://localhost:5000/api/register', {
        ...values,
        login_method: 'local',
      }, { withCredentials: true });

      message.success('เพิ่มผู้ใช้สำเร็จ');
      fetchUsers();
      addForm.resetFields();
      setIsAddModalVisible(false);
    } catch (err) {
      message.error(err.response?.data?.message || 'เกิดข้อผิดพลาดขณะเพิ่มผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const roleDisplay = (role_id) => {
    const map = {
      1: { name: 'Admin', color: 'volcano' },
      2: { name: 'staff', color: 'purple' },
      3: { name: 'User', color: 'blue' },
    };
    return <Tag color={map[role_id]?.color || 'blue'}>{map[role_id]?.name || 'User'}</Tag>;
  };

  const columns = [
    {
      title: 'ชื่อ',
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          <Avatar src={`http://localhost:5000${record.profile_pic}`} icon={<UserOutlined />} />
          <span style={{ fontWeight: '500' }}>{record.name}</span>
        </Space>
      )
    },
    {
      title: 'อีเมล',
      dataIndex: 'email',
    },
    {
      title: 'สิทธิ์',
      render: (_, record) => roleDisplay(record.role_id),
      filters: [
        { text: 'Admin', value: 1 },
        { text: 'staff', value: 2 },
        { text: 'User', value: 3 },
      ],
      onFilter: (value, record) => record.role_id === value,
    },
    {
      title: 'เข้าสู่ระบบด้วย',
      dataIndex: 'login_method',
      render: (method) => (
        <Tag color={method === 'google' ? 'green' : 'default'}>
          {method === 'google' ? 'Google' : 'Local'}
        </Tag>
      )
    },
    {
      title: 'การจัดการ',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>แก้ไข</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.user_id, record.name)}>ลบ</Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '1rem' }}>
      <Card
        bordered
        style={{ borderRadius: 10, backgroundColor: '#fefefe', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>🛡️ ระบบจัดการผู้ใช้งาน</Title>
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            เพิ่ม ลบ แก้ไขข้อมูลผู้ใช้ และจัดการสิทธิ์การเข้าถึง
          </Text>

          <Divider />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
            style={{ width: 200 }}
          >
            เพิ่มผู้ใช้ใหม่
          </Button>

          <Table
            columns={columns}
            dataSource={users}
            rowKey="user_id"
            bordered
            pagination={{ pageSize: 8 }}
            style={{ marginTop: 20 }}
          />
        </Space>
      </Card>

      {/* Edit User Modal */}
      <Modal
        title="แก้ไขผู้ใช้"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        onOk={handleEdit}
        confirmLoading={loading}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="ชื่อผู้ใช้" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
            <Input placeholder="กรอกชื่อผู้ใช้" />
          </Form.Item>
          <Form.Item name="role_id" label="สิทธิ์ผู้ใช้" rules={[{ required: true }]}>
            <Select placeholder="เลือกสิทธิ์">
              <Option value={1}>Admin</Option>
              <Option value={2}>staff</Option>
              <Option value={3}>User</Option>
            </Select>
          </Form.Item>
          <Form.Item name="newPassword" label="รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)">
            <Input.Password placeholder="ไม่กรอกหากไม่ต้องการเปลี่ยน" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add User Modal */}
      <Modal
        title="เพิ่มผู้ใช้ใหม่"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onOk={handleAddUser}
        confirmLoading={loading}
        okText="เพิ่ม"
        cancelText="ยกเลิก"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="name" label="ชื่อ" rules={[{ required: true }]}>
            <Input placeholder="กรอกชื่อ" />
          </Form.Item>
          <Form.Item name="email" label="อีเมล" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="กรอกอีเมล" />
          </Form.Item>
          <Form.Item
            name="password"
            label="รหัสผ่าน"
            rules={[{ required: true, min: 8, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }]}
          >
            <Input.Password placeholder="รหัสผ่านอย่างน้อย 8 ตัว" />
          </Form.Item>
          <Form.Item name="role_id" label="สิทธิ์ผู้ใช้" rules={[{ required: true }]}>
            <Select placeholder="เลือกสิทธิ์ผู้ใช้">
              <Option value={1}>Admin</Option>
              <Option value={2}>staff</Option>
              <Option value={3}>User</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminUserManager;
