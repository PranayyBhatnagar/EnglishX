'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`container ${styles.heroContent}`}>
          <div className={`animate-fadeInUp`}>
            <div className={styles.heroBadge}>
              <span>✦</span> AI-Powered English Coach
            </div>
            <h1 className={styles.heroTitle}>
              Speak English with
              <br />
              <span className="text-gradient">Confidence</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Practise speaking with an AI partner, get instant feedback on your
              pronunciation, vocabulary, and grammar — and watch your fluency grow.
            </p>
            <div className={styles.heroCTA}>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Start Practising Free →
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>

          <div className={`${styles.heroVisual} animate-fadeIn stagger-3`}>
            <div className={styles.mockConversation}>
              <div className={styles.mockBubble}>
                <div className={styles.mockLabel}>You</div>
                <p>I went to the market yesterday and buyed some fruits...</p>
              </div>
              <div className={`${styles.mockBubble} ${styles.mockAI}`}>
                <div className={styles.mockLabel}>EnglishX AI</div>
                <p>That sounds nice! What kind of fruits did you get? 🍎</p>
              </div>
              <div className={styles.mockFeedback}>
                <div className={styles.feedbackHeader}>Session Feedback</div>
                <div className={styles.feedbackScores}>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreDim}>Pronunciation</span>
                    <div className={styles.scoreBar}>
                      <div className={styles.scoreBarFill} style={{width: '72%', background: 'var(--accent-500)'}} />
                    </div>
                    <span className={styles.scoreVal}>72</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreDim}>Vocabulary</span>
                    <div className={styles.scoreBar}>
                      <div className={styles.scoreBarFill} style={{width: '58%', background: 'var(--primary-500)'}} />
                    </div>
                    <span className={styles.scoreVal}>58</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span className={styles.scoreDim}>Grammar</span>
                    <div className={styles.scoreBar}>
                      <div className={styles.scoreBarFill} style={{width: '45%', background: 'var(--warning-500)'}} />
                    </div>
                    <span className={styles.scoreVal}>45</span>
                  </div>
                </div>
                <div className={styles.feedbackTip}>
                  💡 <strong>&quot;buyed&quot;</strong> → <strong>&quot;bought&quot;</strong> — irregular past tense
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Everything you need to
            <span className="text-gradient"> level up</span>
          </h2>
          <div className={`grid grid-3 gap-6`}>
            <div className={`card ${styles.featureCard} animate-fadeInUp stagger-1`}>
              <div className={styles.featureIcon}>🎤</div>
              <h3>Voice Conversations</h3>
              <p>Practise speaking with an AI partner that adapts to your level. Free talk or HR interview mode.</p>
            </div>
            <div className={`card ${styles.featureCard} animate-fadeInUp stagger-2`}>
              <div className={styles.featureIcon}>📊</div>
              <h3>3-Dimension Feedback</h3>
              <p>Get specific scores on pronunciation, vocabulary, and grammar with actionable tips to improve.</p>
            </div>
            <div className={`card ${styles.featureCard} animate-fadeInUp stagger-3`}>
              <div className={styles.featureIcon}>📈</div>
              <h3>Track Your Progress</h3>
              <p>Watch your L1–L6 levels grow over time with rolling averages and trend charts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className={styles.levelsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            CEFR-Mapped
            <span className="text-gradient"> Level System</span>
          </h2>
          <div className={styles.levelsGrid}>
            {[
              { level: 1, label: 'A1 · Beginner', range: '0–16', color: '#ef4444' },
              { level: 2, label: 'A2 · Elementary', range: '17–33', color: '#f59e0b' },
              { level: 3, label: 'B1 · Intermediate', range: '34–50', color: '#eab308' },
              { level: 4, label: 'B2 · Upper-Int', range: '51–67', color: '#10b981' },
              { level: 5, label: 'C1 · Advanced', range: '68–84', color: '#6366f1' },
              { level: 6, label: 'C2 · Proficient', range: '85–100', color: '#a855f7' },
            ].map((l) => (
              <div key={l.level} className={styles.levelCard}>
                <div className={styles.levelNum} style={{ color: l.color, borderColor: l.color }}>
                  L{l.level}
                </div>
                <div>
                  <div className={styles.levelLabel}>{l.label}</div>
                  <div className={styles.levelRange}>Score {l.range}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.footerLogo}>
              <span>✦</span> EnglishX
            </div>
            <p className="text-muted text-sm">
              Built for Zenith School of AI · Voice-first AI English speaking coach
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
