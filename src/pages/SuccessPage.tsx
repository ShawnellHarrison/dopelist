import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SuccessPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    createPost();
  }, []);

  const createPost = async () => {
    try {
      const draftData = localStorage.getItem('pendingPost');
      if (!draftData) {
        setError('No post data found. Please try creating your post again.');
        setStatus('error');
        return;
      }

      const draft = JSON.parse(draftData);

      if (!supabase) {
        setError('Database connection not available');
        setStatus('error');
        return;
      }

      const { data: anonUser, error: authError } = await supabase.auth.signInAnonymously();

      if (authError || !anonUser.user) {
        throw new Error('Failed to create anonymous session');
      }

      let imageUrls: string[] = [];
      if (draft.images && draft.images.length > 0) {
        imageUrls = await Promise.all(
          draft.images.map(async (dataUrl: string, index: number) => {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const fileName = `${Date.now()}_${index}.jpg`;
            const filePath = `${anonUser.user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('post-images')
              .upload(filePath, blob);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('post-images')
              .getPublicUrl(filePath);

            return urlData.publicUrl;
          })
        );
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: anonUser.user.id,
        city_id: draft.cityId,
        category_id: draft.categoryId,
        title: draft.title,
        description: draft.description,
        price: draft.price || null,
        location: draft.location || '',
        images: imageUrls,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        stripe_payment_id: 'payment_link_' + Date.now(),
        comments_close_at: expiresAt.toISOString(),
      });

      if (insertError) throw insertError;

      localStorage.removeItem('pendingPost');
      setStatus('success');

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
      setStatus('error');
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Publishing your post...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-xl border-2 border-red-400/50 rounded-2xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-500/20 mb-6">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>

            <h2 className="text-3xl font-black text-white mb-4">Error</h2>

            <p className="text-gray-300 mb-8">{error}</p>

            <button
              onClick={() => navigate('/create-post')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl border-2 border-green-400/50 rounded-2xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-500/20 mb-6">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>

          <h2 className="text-3xl font-black text-white mb-4">Post Live!</h2>

          <p className="text-gray-300 mb-2">
            Your post is now visible and will remain active for 7 days.
          </p>
          <p className="text-gray-400 text-sm mb-8">Redirecting to home page...</p>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black py-3 rounded-xl font-bold transition-all"
          >
            View All Posts
          </button>
        </div>
      </div>
    </div>
  );
}