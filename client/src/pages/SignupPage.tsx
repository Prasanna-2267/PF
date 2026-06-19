import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AuthShell, Button, Input } from '../components/ui';
import { GoogleButton } from '../components/GoogleButton';
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
    <AuthShell
      title="Create your account"
      subtitle="Start learning with Parallax Flow"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input label="Full name" value={form.name} onChange={update('name')} required />
        <Input label="Email" type="email" value={form.email} onChange={update('email')} required />
        <Input label="Phone" value={form.phone} onChange={update('phone')} required />
        <Input
          label="Password"
          type="password"
          minLength={8}
          value={form.password}
          onChange={update('password')}
          required
        />
        <Alert>{error}</Alert>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Sending code…' : 'Sign up'}
        </Button>
      </form>
      <GoogleButton onError={setError} />
    </AuthShell>
  );
}
