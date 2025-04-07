import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, user, allowedRoles }) {
  // ✅ ไม่ได้ login
  if (!user) return <Navigate to="/auth" replace />;

  // ✅ ตรวจสิทธิ์ role (ถ้าระบุ allowedRoles)
  if (allowedRoles) {
    const role = user.role_name?.toLowerCase();     // เช่น 'admin'
    const roleId = Number(user.role_id);            // เช่น 1

    const normalizedRoles = allowedRoles.map(r => typeof r === 'string' ? r.toLowerCase() : Number(r));

    if (!normalizedRoles.includes(role) && !normalizedRoles.includes(roleId)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default PrivateRoute;
