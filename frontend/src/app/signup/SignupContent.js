'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import styles from '../login/auth.module.css';

export default function SignupContent() {
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await signup({ name, email, password, inviteToken: inviteToken || undefined });
      if (result?.user) {
        router.push(result.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
    setLoading(false);
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>{inviteToken ? 'Accept Invite' : 'Create Account'}</h1>
          <p>{inviteToken ? 'Complete your signup to start practising' : 'Start your English speaking journey'}</p>
        </div>

        <form onSubmit={handleSignup} className={styles.authForm}>
          {error && <div className={styles.authError}>{error}</div>}

          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" className="input" placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="input" placeholder="At least 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : inviteToken ? 'Accept & Join' : 'Create Account'}
          </button>
        </form>

        <p className={styles.authFooter}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
