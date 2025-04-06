import React, { useEffect, useState } from 'react';
import {
  Form, Input, Button, Rate, message,
  Card, Typography, Upload, Image, Spin
} from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

function EditReview() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [preview, setPreview] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ โหลดข้อมูลรีวิวเก่า
  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/reviews', { withCredentials: true });
        const review = res.data.find(r => r.review_id.toString() === id.toString());
        if (!review) {
          message.error('❌ ไม่พบรีวิวที่ต้องการแก้ไข');
          return navigate('/');
        }

        // ✅ ป้องกัน warning ด้วย setTimeout
        setTimeout(() => {
          form.setFieldsValue({
            title: review.title,
            content: review.content,
            rating: review.rating,
          });
        }, 0);

        if (review.image_url) {
          setOriginalImage(`http://localhost:5000${review.image_url}`);
        }
      } catch (err) {
        message.error('❌ โหลดข้อมูลรีวิวล้มเหลว');
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [id, form, navigate]);

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

  // ✅ บันทึกการแก้ไข
  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content);
    formData.append('rating', values.rating);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('image', fileList[0].originFileObj);
    }

    try {
      setSaving(true);
      await axios.put(`http://localhost:5000/api/reviews/${id}`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('✅ แก้ไขรีวิวสำเร็จแล้ว!');
      navigate('/profile');
    } catch (error) {
      console.error('🔥 แก้ไขล้มเหลว:', error);
      message.error(error?.response?.data?.message || '❌ เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '4rem auto' }} />;
  }

  return (
    <div style={{ maxWidth: 700, margin: '3rem auto' }}>
      <Card style={{ padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Title level={3}>✏️ แก้ไขรีวิวของคุณ</Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          ปรับปรุงเนื้อหา รีวิว หรือแนบรูปใหม่ หากต้องการ
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="หัวข้อรีวิว"
            rules={[{ required: true, message: 'กรุณากรอกหัวข้อรีวิว' }]}
          >
            <Input placeholder="หัวข้อรีวิว" />
          </Form.Item>

          <Form.Item
            name="content"
            label="รายละเอียด"
            rules={[{ required: true, message: 'กรุณากรอกรายละเอียด' }]}
          >
            <Input.TextArea rows={4} placeholder="รายละเอียดรีวิว..." />
          </Form.Item>

          <Form.Item
            name="rating"
            label="คะแนนความพึงพอใจ"
            rules={[{ required: true }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item label="รูปภาพ (ถ้ามี)">
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp"
            >
              <Button icon={<UploadOutlined />}>เลือกรูปใหม่</Button>
            </Upload>
            {preview && (
              <Image
                src={preview}
                alt="Preview"
                style={{ marginTop: 12, maxHeight: 200, borderRadius: 8 }}
              />
            )}
            {!preview && originalImage && (
              <Image
                src={originalImage}
                alt="Original"
                style={{ marginTop: 12, maxHeight: 200, borderRadius: 8 }}
              />
            )}
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={saving}
              icon={<SaveOutlined />}
            >
              บันทึกการแก้ไข
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default EditReview;
