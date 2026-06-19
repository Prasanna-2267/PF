import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Button, ErrorText, TextInput } from '../components/ui';
import { authApi, errorMessage } from '../features/auth/auth.api';

export function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.signup(form);
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Start learning with Parallax Flow">
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput label="Full name" value={form.name} onChange={update('name')} required />
        <TextInput label="Email" type="email" value={form.email} onChange={update('email')} required />
        <TextInput label="Phone" value={form.phone} onChange={update('phone')} required />
        <TextInput
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          minLength={8}
          required
        />
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending code…' : 'Sign up'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
