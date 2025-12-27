import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function FloatingManageButton() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    checkPosts();
  }, []);

  const checkPosts = async () => {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setShow(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id);

      if (error) throw error;

      const count = data?.length || 0;
      setPostCount(count);
      setShow(count > 0);
    } catch (err) {
      console.error('Error checking posts:', err);
    }
  };

  if (!show) return null;

  return (
    <button
      onClick={() => navigate('/manage')}
      className="fixed bottom-6 right-6 md:hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 transition-all z-50 border-2 border-white/30"
      aria-label="Manage Posts"
    >
      <div className="relative">
        <FileText size={24} />
        {postCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {postCount > 9 ? '9+' : postCount}
          </span>
        )}
      </div>
    </button>
  );
}
