import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { CreatePost } from './pages/CreatePost';
import { SuccessPage } from './pages/SuccessPage';
import { ManagePosts } from './pages/ManagePosts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/manage" element={<ManagePosts />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
