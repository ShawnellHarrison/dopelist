import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getSupabaseUrl } from '../lib/supabase';
import { Clock, Trash2, RefreshCw, Edit, ArrowLeft, X, Bookmark } from 'lucide-react';
import { formatTimeLeft } from '../lib/constants';
import { EditPostModal } from '../components/EditPostModal';

interface Post {
  id: string;
  title: string;
  description: string;
  price: string | null;
  location: string;
  images: string[];
  expires_at: string;
  is_active: boolean;
  created_at: string;
  category: {
    name: string;
    icon: string;
  };
  city: {
    name: string;
  };
}

export function ManagePosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [showBookmarkTip, setShowBookmarkTip] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [renewingPostId, setRenewingPostId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('device_token');
    if (!token) {
      const newToken = crypto.randomUUID();
      localStorage.setItem('device_token', newToken);
      setDeviceToken(newToken);
    } else {
      setDeviceToken(token);
    }
  }, []);

  useEffect(() => {
    if (deviceToken) {
      loadPosts();
    }
  }, [deviceToken]);

  useEffect(() => {
    const hasSeenTip = localStorage.getItem('manage_bookmark_tip_shown');
    if (!hasSeenTip && posts.length > 0) {
      setShowBookmarkTip(true);
    }
  }, [posts]);

  const loadPosts = async () => {
    if (!supabase || !deviceToken) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, category:categories(*), city:locations(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (postId: string) => {
    if (!confirm('Renew this post for another 7 days? ($1 fee applies)')) return;

    setRenewingPostId(postId);

    try {
      if (!supabase) return;

      const STRIPE_POST_PRICE_ID = import.meta.env.VITE_STRIPE_POST_PRICE_ID;

      if (!STRIPE_POST_PRICE_ID) {
        alert('Stripe configuration missing. Please contact support.');
        return;
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        alert('Please log in to renew posts');
        return;
      }

      const checkoutUrl = `${getSupabaseUrl()}/functions/v1/stripe-checkout`;
      const response = await fetch(checkoutUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: STRIPE_POST_PRICE_ID,
          mode: 'payment',
          success_url: `${window.location.origin}/renew-success?post_id=${postId}`,
          cancel_url: `${window.location.origin}/manage`,
          metadata: {
            post_id: postId,
            action: 'renew',
          },
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Error creating renewal checkout:', err);
      alert(err.message || 'Failed to create payment session');
    } finally {
      setRenewingPostId(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_active: false })
        .eq('id', postId);

      if (error) throw error;
      loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const getExpiryStatus = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) return { color: 'text-gray-400', label: 'Expired', urgent: false };
    if (hoursLeft < 24) return { color: 'text-red-400', label: formatTimeLeft(expiresAt), urgent: true };
    if (hoursLeft < 48) return { color: 'text-yellow-400', label: formatTimeLeft(expiresAt), urgent: true };
    return { color: 'text-green-400', label: formatTimeLeft(expiresAt), urgent: false };
  };

  const activePosts = posts.filter(p => p.is_active && new Date(p.expires_at) > new Date());
  const expiredPosts = posts.filter(p => !p.is_active || new Date(p.expires_at) <= new Date());
  const expiringCount = activePosts.filter(p => {
    const hoursLeft = (new Date(p.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return hoursLeft < 48;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading your posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black py-6 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-4 md:p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Manage Your Posts</h1>
          <p className="text-gray-300 mb-8 text-sm md:text-base">
            View, renew, or delete your listings
          </p>

          {showBookmarkTip && (
            <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-4 mb-6 relative">
              <button
                onClick={() => {
                  setShowBookmarkTip(false);
                  localStorage.setItem('manage_bookmark_tip_shown', 'true');
                }}
                className="absolute top-2 right-2 text-blue-300 hover:text-white"
              >
                <X size={20} />
              </button>
              <div className="flex items-start gap-3">
                <Bookmark className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-blue-200 font-semibold mb-1">Pro Tip!</p>
                  <p className="text-blue-100 text-sm">
                    Bookmark this page to quickly find and manage your posts later
                  </p>
                </div>
              </div>
            </div>
          )}

          {expiringCount > 0 && (
            <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4 mb-6">
              <p className="text-yellow-200 font-semibold">
                {expiringCount} {expiringCount === 1 ? 'post' : 'posts'} expiring soon!
              </p>
            </div>
          )}

          {posts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-white text-xl font-bold mb-2">No posts yet</p>
              <p className="text-gray-400 mb-6">Create your first post to get started</p>
              <button
                onClick={() => navigate('/create-post')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                Create Post
              </button>
            </div>
          )}

          {activePosts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Active Posts ({activePosts.length})</h2>
              <div className="space-y-4">
                {activePosts.map((post) => {
                  const status = getExpiryStatus(post.expires_at);
                  return (
                    <div
                      key={post.id}
                      className="bg-white/5 border-2 border-white/10 rounded-xl p-4 hover:border-yellow-400/50 transition-all"
                    >
                      <div className="flex gap-4">
                        {post.images?.[0] && (
                          <img
                            src={post.images[0]}
                            alt=""
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-lg mb-1 truncate">{post.title}</h3>
                          <div className="flex flex-wrap gap-2 text-sm mb-2">
                            <span className="text-cyan-400">{post.category.icon} {post.category.name}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{post.city.name}</span>
                            {post.price && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-green-400 font-bold">{post.price}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock size={14} className={status.color} />
                            <span className={status.color}>{status.label}</span>
                            {status.urgent && (
                              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-xs font-bold">
                                EXPIRING SOON
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setEditingPostId(post.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleRenew(post.id)}
                          disabled={renewingPostId === post.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw size={16} className={renewingPostId === post.id ? 'animate-spin' : ''} />
                          {renewingPostId === post.id ? 'Processing...' : 'Renew 7 Days'}
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {expiredPosts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-400 mb-4">Expired Posts ({expiredPosts.length})</h2>
              <div className="space-y-4">
                {expiredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white/5 border-2 border-white/5 rounded-xl p-4 opacity-50"
                  >
                    <div className="flex gap-4">
                      {post.images?.[0] && (
                        <img
                          src={post.images[0]}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0 grayscale"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1 truncate">{post.title}</h3>
                        <div className="flex flex-wrap gap-2 text-sm mb-2">
                          <span className="text-gray-500">{post.category.icon} {post.category.name}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-500">{post.city.name}</span>
                        </div>
                        <span className="text-gray-500 text-sm">Expired</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingPostId && (
        <EditPostModal
          postId={editingPostId}
          onClose={() => setEditingPostId(null)}
          onSuccess={loadPosts}
        />
      )}
    </div>
  );
}
