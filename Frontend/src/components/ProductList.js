// ProductList.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Container, Badge } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ProductList({ user }) {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:5000/api/products', { withCredentials: true });
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Container className="mt-4">
      <h3>รายการสินค้า</h3>

      {(user.role_name === 'admin' || user.role_name === 'staff') && (
        <Link to="/products/add">
          <Button className="mb-3">➕ เพิ่มสินค้า</Button>
        </Link>
      )}

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>รูป</th>
            <th>ชื่อ</th>
            <th>จำนวน</th>
            <th>สถานะ</th>
            {(user.role_name === 'admin' || user.role_name === 'staff') && (
              <th>แก้ไข</th>
            )}
          </tr>
        </thead>
        <tbody>
          {products.map((item) => (
            <tr key={item.product_id}>
              <td><img src={`http://localhost:5000${item.image_path}`} width="50" alt="img" /></td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>
                {item.quantity <= item.minimum_quantity ? (
                  <Badge bg="danger">ใกล้หมด</Badge>
                ) : (
                  <Badge bg="success">ปกติ</Badge>
                )}
              </td>
              {(user.role_name === 'admin' || user.role_name === 'staff') && (
                <td>
                  <Link to={`/products/edit/${item.product_id}`}>
                    <Button variant="warning" size="sm">แก้ไข</Button>
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default ProductList;
