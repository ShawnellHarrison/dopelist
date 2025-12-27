import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Upload, X } from 'lucide-react';

const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test_PLACEHOLDER';

interface Category {
  id: string;
  name: string;
  section: string;
  icon?: string;
}

interface City {
  id: string;
  name: string;
}

export function CreatePost() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const preselectedCity = searchParams.get('city');
  const preselectedCategory = searchParams.get('category');

  const [cityId, setCityId] = useState(preselectedCity || '');
  const [categoryId, setCategoryId] = useState(preselectedCategory || '');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!supabase) return;
    try {
      const [citiesRes, categoriesRes] = await Promise.all([
        supabase
          .from('locations')
          .select('id, name')
          .eq('type', 'city')
          .eq('craigslist_supported', true)
          .order('name'),
        supabase.from('categories').select('*').order('section, name'),
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewUrls(newUrls);
  };

  const handleSubmit = async () => {
    setError('');

    if (!cityId) {
      setError('Please select a city');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const imageDataUrls = await Promise.all(
        images.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      const draft = {
        title,
        price,
        description,
        location,
        cityId,
        categoryId,
        images: imageDataUrls,
        createdAt: Date.now(),
      };

      localStorage.setItem('pendingPost', JSON.stringify(draft));

      window.location.href = STRIPE_PAYMENT_LINK;
    } catch (err) {
      setError('Failed to process images. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black py-6 md:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-4 md:p-8 shadow-lg">
          <button
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-white mb-6 transition-colors"
          >
            ← Back to Home
          </button>

          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Create a Post</h1>
          <p className="text-gray-300 mb-6 md:mb-8 text-sm md:text-base">
            Fill out the form below and pay $1 for a 7-day listing
          </p>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 mb-6">
              <p className="text-red-200 font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                City <span className="text-red-400">*</span>
              </label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-yellow-400"
                required
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id} className="text-black">
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-yellow-400"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="text-black">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., iPhone 13 Pro Max - Great Condition"
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Price (optional)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., $500 or Free"
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Downtown, Near Main St"
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item or service..."
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Photos (optional)</label>
              <div className="space-y-4">
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-center justify-center w-full px-6 py-8 bg-white/5 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-white font-semibold">Upload Images</p>
                    <p className="text-gray-400 text-sm mt-1">Click to select files</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? 'Redirecting to Stripe...' : 'Post for $1 (7 days)'}
            </button>

            <p className="text-center text-gray-400 text-sm">
              Anonymous posting allowed · No account required
              <br />
              You'll be redirected to Stripe for secure payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
