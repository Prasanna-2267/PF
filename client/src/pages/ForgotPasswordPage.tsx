import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Button, ErrorText, TextInput } from '../components/ui';
import { authApi, errorMessage } from '../features/auth/auth.api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Forgot password" subtitle="We'll email you a reset code">
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset code'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-400">
        <Link to="/login" className="text-violet-400 hover:underline">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
