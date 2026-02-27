import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ClientExpenses from './ClientExpenses';

function ClientGate() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/client/login', { replace: true });
    } else if (isAdmin) {
      navigate('/', { replace: true });
    }
  }, [token, isAdmin, navigate]);

  if (!token || isAdmin) return null;
  return <ClientExpenses />;
}

export default ClientGate;
