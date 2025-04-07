import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container } from 'react-bootstrap';

function EditProduct() {
  const { id } = useParams(); // ดึง id จาก URL
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: ''
  });

  // ดึงข้อมูลสินค้าจาก API เมื่อโหลดหน้า
  useEffect(() => {
    axios.get(`http://localhost:5000/api/products/${id}`)
      .then(response => setProduct(response.data))  // ตั้งค่าข้อมูลสินค้าที่ดึงมา
      .catch(error => console.error('Error fetching product:', error));
  }, [id]);

  // ส่งข้อมูลที่แก้ไขไปยัง Backend
  const handleSubmit = (e) => {
    e.preventDefault();

    axios.put(`http://localhost:5000/api/products/${id}`, product)
      .then(response => {
        navigate('/products');  // ไปที่หน้ารายการสินค้า
      })
      .catch(error => console.error('Error updating product:', error));
  };

  return (
    <Container className="mt-5">
      <h2>Edit Product</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="productName" className="mb-3">
          <Form.Label>Product Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter product name"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
          />
        </Form.Group>

        <Form.Group controlId="productDescription" className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter product description"
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
          />
        </Form.Group>

        <Form.Group controlId="productPrice" className="mb-3">
          <Form.Label>Price</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter price"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
          />
        </Form.Group>

        <Form.Group controlId="productQuantity" className="mb-3">
          <Form.Label>Stock Quantity</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter stock quantity"
            value={product.stock_quantity}
            onChange={(e) => setProduct({ ...product, stock_quantity: e.target.value })}
          />
        </Form.Group>

        <Button variant="primary" type="submit">Update Product</Button>
      </Form>
    </Container>
  );
}

export default EditProduct;
