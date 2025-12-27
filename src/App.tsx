import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  MapPin,
  LogOut,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { AuthModal } from './components/AuthModal';
import { PostModal } from './components/PostModal';
import { supabase } from './lib/supabase';
import { SECTIONS, REACTIONS, formatTimeLeft } from './lib/constants';
import type { City, Category, PostWithDetails, Section } from './types';

function DopeListApp() {
  const { user, signOut } = useAuth();

  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
    loadCategories();

    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('session_id');
    if (sid) {
      setSessionId(sid);
      setShowPostModal(true);
    }
  }, []);

  useEffect(() => {
    if (selectedCity && selectedSection) {
      loadPosts();
    }
  }, [selectedCity, selectedSection, selectedCategory]);

  useEffect(() => {
    if (!supabase || !selectedCity || !selectedSection) return;

    const sectionCategories = categories
      .filter((c) => c.section === selectedSection)
      .map((c) => c.id);

    if (sectionCategories.length === 0) return;

    const subscription = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `city_id=eq.${selectedCity.id}`,
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedCity, selectedSection, categories]);

  const loadCities = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'city')
        .eq('craigslist_supported', true)
        .order('name');
      if (error) throw error;
      setCities(data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('section, name');
    if (error) throw error;
    setCategories(data || []);
  };

  const loadPosts = async () => {
    if (!supabase || !selectedCity || !selectedSection) return;

    const query = supabase
      .from('posts')
      .select('*, city:cities(*), category:categories(*)')
      .eq('city_id', selectedCity.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (selectedCategory) {
      query.eq('category_id', selectedCategory.id);
    } else {
      const sectionCategories = categories
        .filter((c) => c.section === selectedSection)
        .map((c) => c.id);
      if (sectionCategories.length > 0) {
        query.in('category_id', sectionCategories);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    setPosts(data || []);
  };

  const handleVote = async (postId: string, direction: 'up' | 'down') => {
    if (!supabase) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newVotes = post.votes + (direction === 'up' ? 1 : -1);
    await supabase.from('posts').update({ votes: newVotes }).eq('id', postId);

    setPosts((prev) =>
      prev
        .map((p) => (p.id === postId ? { ...p, votes: newVotes } : p))
        .sort((a, b) => b.votes - a.votes)
    );
  };

  const handleReaction = async (postId: string, reactionKey: string) => {
    if (!supabase) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newReactions = {
      ...post.reactions,
      [reactionKey]: (post.reactions[reactionKey] || 0) + 1,
    };

    await supabase.from('posts').update({ reactions: newReactions }).eq('id', postId);

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, reactions: newReactions } : p))
    );
  };

  const citiesByCountry = useMemo(() => {
    const grouped: Record<string, City[]> = {};
    for (const city of cities) {
      const country = 'All Cities';
      if (!grouped[country]) grouped[country] = [];
      grouped[country].push(city);
    }
    Object.keys(grouped).forEach((k) =>
      grouped[k].sort((a, b) => a.name.localeCompare(b.name))
    );
    return grouped;
  }, [cities]);

  const sectionCategories = useMemo(() => {
    if (!selectedSection) return [];
    return categories.filter((c) => c.section === selectedSection);
  }, [categories, selectedSection]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setSelectedSection(null);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-white text-2xl font-black">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      <div className="fixed inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)',
          }}
        />
      </div>

      <div className="relative">
        <header className="border-b-2 border-yellow-400/30 bg-black/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h1
                  className="text-5xl font-black tracking-tight leading-none cursor-pointer"
                  onClick={() => {
                    setSelectedCity(null);
                    setSelectedSection(null);
                    setSelectedCategory(null);
                  }}
                >
                  <span
                    className="bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 text-transparent bg-clip-text animate-pulse"
                    style={{ fontFamily: 'Impact, sans-serif' }}
                  >
                    DOPELIST
                  </span>
                </h1>

                <div className="mt-2 flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-gray-300 flex items-center gap-2">
                    <MapPin size={16} className="text-cyan-400" />
                    {selectedCity ? (
                      <>
                        <span className="text-cyan-300 font-bold uppercase tracking-wider">
                          {selectedCity.name}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedCity(null);
                            setSelectedSection(null);
                            setSelectedCategory(null);
                          }}
                          className="text-yellow-400 hover:text-yellow-300 font-bold underline underline-offset-4 transition-colors"
                        >
                          change city
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400">choose a city to browse</span>
                    )}
                  </span>

                  {selectedSection && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-purple-400 font-bold uppercase">
                        {SECTIONS.find((s) => s.id === selectedSection)?.name}
                      </span>
                    </>
                  )}

                  <span className="text-gray-500">•</span>

                  {user ? (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-xs">
                        {user.is_anonymous ? 'anonymous' : user.email}
                      </span>
                      {user.is_anonymous && (
                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="text-yellow-400 hover:text-yellow-300 font-bold underline underline-offset-4 transition-colors text-xs"
                        >
                          upgrade account
                        </button>
                      )}
                      <button
                        onClick={() => signOut().catch((e: any) => alert(e?.message))}
                        className="text-gray-300 hover:text-white font-bold inline-flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} /> sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedCity && (
                <button
                  onClick={() => setShowPostModal(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transform hover:scale-105 transition-all shadow-lg border-2 border-white/20 whitespace-nowrap"
                >
                  <Plus size={20} />
                  POST FOR $1
                </button>
              )}
            </div>

            {selectedCity && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all font-medium"
                />
              </div>
            )}
          </div>
        </header>

        {!selectedCity && (
          <div className="max-w-7xl mx-auto px-4 py-10 pb-16">
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2
                className="text-3xl md:text-4xl font-black text-white mb-2"
                style={{ fontFamily: 'Impact, sans-serif' }}
              >
                Choose your city
              </h2>
              <p className="text-gray-300 mb-6">Browse classifieds in your area</p>

              <div className="space-y-8">
                {Object.keys(citiesByCountry)
                  .sort()
                  .map((country) => (
                    <div key={country}>
                      <div className="text-yellow-400 font-black uppercase tracking-wider mb-3">
                        {country}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {citiesByCountry[country].map((city) => (
                          <button
                            key={city.id}
                            onClick={() => handleCitySelect(city)}
                            className="text-left bg-white/5 backdrop-blur-sm hover:bg-white/10 border-2 border-white/10 hover:border-yellow-400 rounded-xl p-4 transition-all transform hover:-translate-y-0.5"
                          >
                            <div className="text-white font-bold capitalize">{city.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {selectedCity && !selectedSection && (
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2
                className="text-3xl md:text-4xl font-black text-white mb-2"
                style={{ fontFamily: 'Impact, sans-serif' }}
              >
                Browse by section
              </h2>
              <p className="text-gray-300 mb-6">What are you looking for?</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SECTIONS.map((section) => {
                  const count = posts.filter((p) =>
                    categories.some((c) => c.id === p.category_id && c.section === section.id)
                  ).length;

                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionSelect(section.id)}
                      className={`text-left bg-gradient-to-r ${section.color} p-6 rounded-2xl border-2 border-white/20 hover:border-white/40 transition-all transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">{section.emoji}</span>
                        <div>
                          <div className="text-white font-black text-xl uppercase tracking-wide">
                            {section.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedCity && selectedSection && (
          <>
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border-2 ${
                    !selectedCategory
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-white/40'
                      : 'bg-white/5 backdrop-blur-sm text-white border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="uppercase tracking-wide text-sm">ALL</span>
                </button>
                {sectionCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border-2 ${
                      selectedCategory?.id === cat.id
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-white/40'
                        : 'bg-white/5 backdrop-blur-sm text-white border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="uppercase tracking-wide text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-12">
              <div className="space-y-4">
                {filteredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="group bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl overflow-hidden hover:border-yellow-400 transition-all transform hover:-translate-y-1"
                    style={{ animation: `slideIn 0.5s ease-out ${index * 0.08}s both` }}
                  >
                    <div className="flex gap-4 p-6">
                      <div className="flex flex-col items-center gap-2 bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                        <button
                          onClick={() => handleVote(post.id, 'up')}
                          className="text-gray-400 hover:text-green-400 transition-colors transform hover:scale-125 active:scale-95"
                        >
                          <ChevronUp size={24} strokeWidth={3} />
                        </button>
                        <span
                          className="font-black text-xl bg-gradient-to-b from-yellow-400 to-orange-500 text-transparent bg-clip-text"
                          style={{ fontFamily: 'Impact, sans-serif' }}
                        >
                          {post.votes}
                        </span>
                        <button
                          onClick={() => handleVote(post.id, 'down')}
                          className="text-gray-400 hover:text-red-400 transition-colors transform hover:scale-125 active:scale-95"
                        >
                          <ChevronDown size={24} strokeWidth={3} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {post.images?.length ? (
                              <img
                                src={post.images[0]}
                                alt=""
                                className="w-20 h-20 rounded-xl object-cover border-2 border-white/20 group-hover:border-yellow-400/50 transition-all"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-black/30 backdrop-blur-sm border-2 border-white/10 flex items-center justify-center text-gray-500">
                                <ImageIcon size={22} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-1">
                              <span className="text-3xl flex-shrink-0 transform group-hover:scale-110 transition-transform">
                                {post.category?.icon || '📋'}
                              </span>
                              <div className="min-w-0">
                                <h3
                                  className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors truncate"
                                  style={{ fontFamily: '"Space Mono", monospace' }}
                                  title={post.title}
                                >
                                  {post.title}
                                </h3>

                                <div className="mt-1 flex flex-wrap gap-3 items-center text-sm">
                                  {post.price && (
                                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full font-bold border-2 border-white/20">
                                      {post.price}
                                    </span>
                                  )}
                                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                                    📍 {post.location}
                                  </span>
                                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                                    {post.category?.name}
                                  </span>
                                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                                    • {formatTimeLeft(post.expires_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-300 text-sm leading-relaxed mt-2">
                              {post.description}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2 items-center">
                              <span className="text-gray-400 text-xs uppercase tracking-wider mr-2">
                                reactions
                              </span>
                              {REACTIONS.map((r) => (
                                <button
                                  key={r.key}
                                  onClick={() => handleReaction(post.id, r.key)}
                                  className="px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/40 border border-white/10 hover:border-yellow-400/50 text-white font-bold transition-all active:scale-95"
                                  title={r.label}
                                >
                                  <span className="mr-1">{r.emoji}</span>
                                  <span className="text-sm">
                                    {post.reactions?.[r.key as keyof typeof post.reactions] || 0}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-white text-xl font-bold">No listings found</p>
                  <p className="text-gray-400">Try a different category or search term</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={showUpgradePrompt ? 'upgrade' : 'signin'}
      />

      <PostModal
        open={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setSessionId(null);
        }}
        city={selectedCity}
        categories={sectionCategories}
        onPostCreated={loadPosts}
        onShowUpgradePrompt={() => {
          setShowUpgradePrompt(true);
          setShowAuthModal(true);
        }}
        sessionId={sessionId}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}


function App() {
  return (
      `}</style>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <DopeListApp />
    </AuthProvider>
  );
}
