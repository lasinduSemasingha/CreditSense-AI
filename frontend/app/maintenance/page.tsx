import React from 'react'

export const metadata = {
  title: 'Maintenance',
}

export default function MaintenancePage() {
  // Return a fragment / div only — do NOT render <html> or <body> here.
  // The root layout already renders those tags and adding them here causes
  // hydration mismatches.
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#0f172a',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: 740, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>We'll be back soon</h1>
        <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#475569' }}>
          The site is currently under maintenance. We're working to bring things back online as
          quickly as possible. Thanks for your patience.
        </p>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          If you need immediate assistance, please contact your site administrator.
        </p>
      </div>
    </div>
  )
}
