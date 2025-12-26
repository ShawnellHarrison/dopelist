import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase, getSupabaseUrl } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { MAX_IMAGES } from '../lib/constants';
import type { City, Category } from '../types';

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  city: City | null;
  categories: Category[];
  onPostCreated: () => void;
  onShowUpgradePrompt: () => void;
  sessionId: string | null;
}

export function PostModal({ open, onClose, city, categories, onPostCreated, onShowUpgradePrompt, sessionId }: PostModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'payment' | 'form' | 'processing'>('payment');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [open, categories, categoryId]);

  useEffect(() => {
    if (open && sessionId) {
      setStep('form');
    } else if (open) {
      setStep('payment');
    }
  }, [open, sessionId]);

  useEffect(() => {
    if (!open) {
      setStep(sessionId ? 'form' : 'payment');
      setTitle('');
      setDescription('');
      setPrice('');
      setLocation('');
      setImages([]);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);
      if (categories.length > 0) setCategoryId(categories[0].id);
    }
  }, [open, categories, sessionId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImages(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleRemoveImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStartPayment = async () => {
    if (!user || !supabase || !city) return;

    try {
      setCheckingPayment(true);

      const apiUrl = `${getSupabaseUrl()}/functions/v1/create-post-checkout`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityId: city.id,
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.demo) {
        const demoSessionId = 'demo_' + Date.now();
        const url = new URL(window.location.href);
        url.searchParams.set('session_id', demoSessionId);
        window.location.href = url.toString();
        return;
      }

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      alert(error.message || 'Payment failed');
    } finally {
      setCheckingPayment(false);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || !supabase) return [];

    const uploadedUrls: string[] = [];

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (error) throw error;

      const publicUrl = `${getSupabaseUrl()}/storage/v1/object/public/post-images/${data.path}`;
      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmitPost = async () => {
    if (!user || !supabase || !city || !sessionId) return;

    if (!title || !description || !location || !categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      setStep('processing');

      const imageUrls = await uploadImages();

      const apiUrl = `${getSupabaseUrl()}/functions/v1/verify-payment-create-post`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          postData: {
            cityId: city.id,
            categoryId,
            title,
            description,
            price,
            location,
            images: imageUrls,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setStep('form');
        return;
      }

      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());

      onClose();
      onPostCreated();

      if (user.is_anonymous) {
        setTimeout(() => {
          onShowUpgradePrompt();
        }, 500);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create post');
      setStep('form');
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(234,179,8,0.3)]">
        {step === 'payment' && (
          <div className="p-8 text-center">
            <div className="text-6xl mb-6 animate-bounce">💳</div>
            <h2 className="text-3xl font-black text-yellow-400 mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
              $1 • 7 DAYS • {city?.name?.toUpperCase()}
            </h2>
            <p className="text-gray-300 mb-6">Pay first, then create your listing.</p>

            <div className="space-y-3">
              <button
                onClick={handleStartPayment}
                disabled={checkingPayment}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 rounded-xl text-lg transform hover:scale-105 transition-all shadow-lg border-2 border-white/20 disabled:opacity-60"
              >
                {checkingPayment ? 'REDIRECTING...' : '💰 PAY $1 NOW'}
              </button>

              <button
                onClick={onClose}
                disabled={checkingPayment}
                className="w-full text-gray-400 hover:text-white font-bold py-2 transition-colors disabled:opacity-60"
              >
                cancel
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-yellow-400" style={{ fontFamily: 'Impact, sans-serif' }}>
                  🚀 POST YOUR AD
                </h2>
                <div className="text-sm text-gray-300 mt-1">
                  City: <span className="text-cyan-300 font-bold uppercase">{city?.name}</span>
                  <span className="text-green-400 ml-2">✓ PAID</span>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:text-yellow-400 transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">
                  📂 Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-gray-900">
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">
                  ✏️ Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., iPhone 15 Pro - Mint Condition"
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">
                  💰 Price (optional)
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g., $500 or Free"
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">
                  📍 Location / Area
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Downtown, West End"
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">
                  📝 Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your listing..."
                  rows={4}
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2 text-sm uppercase tracking-wide">
                  🖼️ Photos (up to {MAX_IMAGES})
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 border-dashed rounded-xl px-4 py-6 text-white hover:bg-white/15 hover:border-yellow-400/50 cursor-pointer transition-all"
                  >
                    <Upload size={20} />
                    <span>Click to upload images</span>
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {imagePreviews.map((src, idx) => (
                      <div key={src} className="relative">
                        <img
                          src={src}
                          alt=""
                          className="w-full h-24 object-cover rounded-xl border-2 border-white/20"
                        />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-black/80 backdrop-blur-sm border-2 border-white/20 text-white rounded-full p-1 hover:border-yellow-400 transition-all"
                          onClick={() => handleRemoveImage(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitPost}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-black py-4 rounded-xl text-lg transform hover:scale-105 transition-all shadow-lg border-2 border-white/20 disabled:opacity-60"
              >
                {uploading ? 'PUBLISHING...' : '🚀 PUBLISH POST'}
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-8 text-center">
            <div className="text-6xl mb-6 animate-spin">⚡</div>
            <h2 className="text-3xl font-black text-yellow-400 mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
              CREATING YOUR POST...
            </h2>
            <p className="text-gray-300">Uploading images and publishing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
