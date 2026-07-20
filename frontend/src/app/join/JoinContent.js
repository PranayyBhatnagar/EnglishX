'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validateInvite } from '@/lib/api';
import styles from '../login/auth.module.css';

export default function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validate() {
      if (!token) {
        setError('No invite token provided');
        setLoading(false);
        return;
      }
      try {
        const result = await validateInvite(token);
        setInvite(result);
      } catch (err) {
        setError(err.message || 'Invalid or expired invite');
      }
      setLoading(false);
    }
    validate();
  }, [token]);

  if (loading) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1>Validating invite...</h1>
            <p>Please wait while we verify your invite link</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1>Invalid Invite</h1>
            <p>{error}</p>
          </div>
          <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '16px' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>You&apos;re Invited! 🎉</h1>
          <p>
            You&apos;ve been invited to join EnglishX.
            {invite?.email && <><br />Email: <strong>{invite.email}</strong></>}
          </p>
        </div>
        <Link href={`/signup?token=${token}`} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          Accept Invite & Sign Up
        </Link>
        <p className={styles.authFooter}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
