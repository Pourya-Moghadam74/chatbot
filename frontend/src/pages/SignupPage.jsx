import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { signupUser } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import AuthInput from '../components/AuthInput';
import AuthButton from '../components/AuthButton';

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return;
    await dispatch(signupUser({ email, password }));
    navigate('/');
  };

  return (
    <AuthLayout title="Create account" footer={
      <>Already have one? <Link to="/login">Log in</Link></>
    }>
      <form onSubmit={handleSubmit}>
        <AuthInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <AuthInput label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <AuthButton>Sign up</AuthButton>
      </form>
    </AuthLayout>
  );
}
