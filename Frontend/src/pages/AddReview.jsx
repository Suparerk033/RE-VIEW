import React, { useState } from 'react';
import {
  Form, Input, Button, Rate, message,
  Card, Typography, Upload, Image
} from 'antd';
import { UploadOutlined, PlusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph } = Typography;

function AddReview() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [preview, setPreview] = useState(null);

  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content);
    formData.append('rating', values.rating);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('image', fileList[0].originFileObj);
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/reviews', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Response from server:", response);
      message.success('✅ โพสต์รีวิวสำเร็จแล้ว!');
      form.resetFields();
      setFileList([]);
      setPreview(null);
    } catch (error) {
      console.error('🔥 ส่งรีวิวล้มเหลว:', error);
      if (error.response) {
        message.error(`❌ ${error.response.data.message || 'เกิดข้อผิดพลาด'}`);
      } else {
        message.error('❌ เกิดข้อผิดพลาดที่ไม่สามารถคาดเดาได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList }) => {
    const rawFile = fileList?.[0]?.originFileObj;
    if (!rawFile) return;

    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type);
    const isValidSize = rawFile.size / 1024 / 1024 <= 2;

    if (!isValidType) {
      message.error('❌ อนุญาตเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น');
      return;
    }

    if (!isValidSize) {
      message.error('❌ ไฟล์ต้องไม่เกิน 2MB');
      return;
    }

    setFileList(fileList);
    setPreview(URL.createObjectURL(rawFile));
  };

  return (
    <div style={{ maxWidth: 720, margin: '3rem auto', padding: '0 1rem' }}>
      <Card
        style={{
          padding: 32,
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          background: 'linear-gradient(to bottom right, #ffffff, #fafafa)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: '#6a1b9a', fontWeight: 'bold' }}>
            📝 เขียนรีวิวสินค้า
          </Title>
          <Paragraph style={{ color: '#555' }}>
            แชร์ประสบการณ์ของคุณเกี่ยวกับสินค้าที่เคยใช้ พร้อมให้คะแนนและรายละเอียดอย่างตรงไปตรงมา ✨
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ rating: 5 }}
        >
          <Form.Item
            name="title"
            label="หัวข้อรีวิว"
            rules={[{ required: true, message: 'กรุณากรอกหัวข้อรีวิว' }]}
          >
            <Input size="large" placeholder="เช่น เซรั่มลดสิวที่ใช้แล้วเวิร์คมาก!" />
          </Form.Item>

          <Form.Item
            name="content"
            label="รายละเอียด"
            rules={[{ required: true, message: 'กรุณาเขียนรายละเอียดรีวิว' }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="บอกเล่าประสบการณ์ของคุณกับสินค้านี้ เช่น กลิ่น เนื้อสัมผัส เห็นผลจริงหรือไม่ ฯลฯ"
              style={{ resize: 'none' }}
            />
          </Form.Item>

          <Form.Item
            name="rating"
            label="คะแนนความพึงพอใจ"
            rules={[{ required: true }]}
          >
            <Rate style={{ fontSize: 24 }} />
          </Form.Item>

          <Form.Item label="แนบรูปรีวิว (ไม่บังคับ)">
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp"
            >
              <Button icon={<UploadOutlined />} size="middle">
                เลือกรูปภาพ
              </Button>
            </Upload>
            {preview && (
              <Image
                src={preview}
                alt="Preview"
                style={{
                  marginTop: 16,
                  maxHeight: 200,
                  borderRadius: 12,
                  border: '1px solid #eee',
                }}
              />
            )}
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              icon={<PlusCircleOutlined />}
              loading={loading}
              style={{
                borderRadius: 24,
                fontWeight: 600,
                backgroundColor: '#6a1b9a',
                borderColor: '#6a1b9a',
              }}
            >
              โพสต์รีวิว
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AddReview;
