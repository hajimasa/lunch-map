import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LocationProvider } from './hooks/useLocation';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';
import MyPage from './pages/MyPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'map' | 'mypage'>('map');

  if (loading) {
    return (
      <div className="loading">
        <div>読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <LocationProvider>
      <div className="container">
        <header className="header">
          <h1>ランチ店舗おすすめ</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setCurrentPage('map')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                textDecoration: currentPage === 'map' ? 'underline' : 'none'
              }}
            >
              地図
            </button>
            <button
              onClick={() => setCurrentPage('mypage')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                textDecoration: currentPage === 'mypage' ? 'underline' : 'none'
              }}
            >
              マイページ
            </button>
            <img
              src={user.avatar_url}
              alt={user.name}
              className="user-avatar"
              onClick={() => setCurrentPage('mypage')}
            />
          </div>
        </header>
        {currentPage === 'map' ? <MapPage /> : <MyPage />}
      </div>
    </LocationProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;