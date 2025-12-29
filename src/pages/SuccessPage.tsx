import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, getSupabaseUrl } from '../lib/supabase';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');
  const [postData, setPostData] = useState<{ cityId: string; categoryId: string } | null>(null);

  useEffect(() => {
    createPost();
  }, []);

  const handleViewPost = async () => {
    if (!postData || !supabase) {
      navigate('/');
      return;
    }

    try {
      const { data: category } = await supabase
        .from('categories')
        .select('section')
        .eq('id', postData.categoryId)
        .single();

      if (category) {
        navigate(`/?city=${postData.cityId}&section=${category.section}`);
      } else {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  };

  const createPost = async () => {
    try {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('Payment session not found. Please complete payment first.');
        setStatus('error');
        return;
      }

      const draftData = localStorage.getItem('pendingPost');
      if (!draftData) {
        setError('No post data found. Please try creating your post again.');
        setStatus('error');
        return;
      }

      const draft = JSON.parse(draftData);

      const draftAge = Date.now() - (draft.createdAt || 0);
      const maxAge = 60 * 60 * 1000;
      if (draftAge > maxAge) {
        setError('Post data expired. Please create your post again.');
        setStatus('error');
        localStorage.removeItem('pendingPost');
        return;
      }

      if (!supabase) {
        setError('Database connection not available');
        setStatus('error');
        return;
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        setError('Authentication required');
        setStatus('error');
        return;
      }

      let imageUrls: string[] = [];
      if (draft.images && draft.images.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');

        imageUrls = await Promise.all(
          draft.images.map(async (dataUrl: string, index: number) => {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const fileName = `${Date.now()}_${index}.jpg`;
            const filePath = `${user.id}/${fileName}`;

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

      const postPayload = {
        cityId: draft.cityId,
        categoryId: draft.categoryId,
        title: draft.title,
        description: draft.description,
        price: draft.price || null,
        location: draft.location || '',
        images: imageUrls,
        contactInfo: draft.contactInfo || {},
      };

      const verifyUrl = `${getSupabaseUrl()}/functions/v1/verify-payment-create-post`;
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          postData: postPayload,
        }),
      });

      const data = await response.json();

      if (data.error || !data.post) {
        throw new Error(data.error || 'Failed to create post');
      }

      setPostData({ cityId: draft.cityId, categoryId: draft.categoryId });
      localStorage.removeItem('pendingPost');
      setStatus('success');
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

          <p className="text-gray-300 mb-8">
            Your post is now visible and will remain active for 7 days.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleViewPost}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black py-3 rounded-xl font-bold transition-all"
            >
              View Your Post
            </button>
            <button
              onClick={() => navigate('/manage')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-xl font-bold transition-all"
            >
              Manage Your Posts
            </button>
          </div>

          <p className="text-gray-400 text-sm mt-6 text-center">
            Bookmark /manage to quickly find your posts later
          </p>
        </div>
      </div>
    </div>
  );
}