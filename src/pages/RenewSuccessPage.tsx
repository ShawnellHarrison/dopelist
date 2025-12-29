import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, getSupabaseUrl } from '../lib/supabase';

export function RenewSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    processRenewal();
  }, []);

  const processRenewal = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      const postId = searchParams.get('post_id');

      if (!sessionId) {
        setError('Missing payment session ID');
        setStatus('error');
        return;
      }

      if (!postId) {
        setError('Missing post ID');
        setStatus('error');
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

      const renewUrl = `${getSupabaseUrl()}/functions/v1/renew-post`;
      const response = await fetch(renewUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.error || !data.post) {
        throw new Error(data.error || 'Failed to renew post');
      }

      setStatus('success');
    } catch (err: any) {
      console.error('Error processing renewal:', err);
      setError(err.message || 'Failed to process renewal');
      setStatus('error');
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Processing renewal...</p>
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

            <h2 className="text-3xl font-black text-white mb-4">Renewal Failed</h2>

            <p className="text-gray-300 mb-8">{error}</p>

            <button
              onClick={() => navigate('/manage')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold transition-all"
            >
              Back to Manage Posts
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

          <h2 className="text-3xl font-black text-white mb-4">Post Renewed!</h2>

          <p className="text-gray-300 mb-8">
            Your post has been renewed for another 7 days and is now active again.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/manage')}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black py-3 rounded-xl font-bold transition-all"
            >
              View Your Posts
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-xl font-bold transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
