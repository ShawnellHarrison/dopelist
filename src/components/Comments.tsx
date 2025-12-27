import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, Clock } from 'lucide-react';
import { supabase, getSupabaseUrl } from '../lib/supabase';
import { useAuth } from './AuthProvider';

interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  session_id: string | null;
  text: string;
  created_at: string;
}

interface CommentsProps {
  postId: string;
  commentsCloseAt: string;
}

export function Comments({ postId, commentsCloseAt }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const commentsOpen = new Date(commentsCloseAt) > new Date();

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      const apiUrl = `${getSupabaseUrl()}/functions/v1/manage-comments?postId=${postId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      const data = await response.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase || !newComment.trim()) return;

    try {
      setSubmitting(true);
      const apiUrl = `${getSupabaseUrl()}/functions/v1/manage-comments`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          text: newComment.trim(),
          sessionId: localStorage.getItem('session_id') || null,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.comment) {
        setComments([...comments, data.comment]);
        setNewComment('');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getTimeUntilClose = () => {
    const closeDate = new Date(commentsCloseAt);
    const now = new Date();
    const hoursLeft = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursLeft <= 0) return 'Closed';
    if (hoursLeft === 1) return '1 hour left';
    return `${hoursLeft} hours left`;
  };

  return (
    <div className="mt-4 pt-4 border-t-2 border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-cyan-400" />
          <span className="text-white font-bold uppercase tracking-wide text-sm">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={14} />
          <span>{getTimeUntilClose()}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-400 text-sm">Loading comments...</div>
      ) : (
        <>
          <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-cyan-400 font-semibold">
                    {comment.user_id ? 'User' : 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">{formatTime(comment.created_at)}</span>
                </div>
                <p className="text-white text-sm leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </div>
          )}

          {commentsOpen ? (
            user ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={submitting}
                  className="flex-1 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all text-sm disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1 transition-all border-2 border-white/20 disabled:opacity-60 text-sm"
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div className="text-center py-3 text-gray-400 text-xs">
                Sign in to comment
              </div>
            )
          ) : (
            <div className="text-center py-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Comments Closed</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
