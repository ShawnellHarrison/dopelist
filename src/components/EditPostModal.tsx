import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase, getSupabaseUrl } from '../lib/supabase';
import ContactInfoForm, { ContactInfo } from './ContactInfoForm';

interface EditPostModalProps {
  postId: string;
  onClose: () => void;
  onSuccess: () => void;
}

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

export function EditPostModal({ postId, onClose, onSuccess }: EditPostModalProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [cityId, setCityId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!supabase) return;

    try {
      const [citiesRes, categoriesRes, postRes] = await Promise.all([
        supabase
          .from('locations')
          .select('id, name')
          .eq('type', 'city')
          .eq('craigslist_supported', true)
          .order('name'),
        supabase.from('categories').select('*').order('section, name'),
        supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single(),
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);

      if (postRes.data) {
        const post = postRes.data;

        if (!post.is_active || new Date(post.expires_at) <= new Date()) {
          setError('This post has expired and cannot be edited. Please renew it first.');
          setLoading(false);
          return;
        }

        setCityId(post.city_id);
        setCategoryId(post.category_id);
        setTitle(post.title);
        setPrice(post.price || '');
        setDescription(post.description);
        setLocation(post.location || '');
        setExistingImages(post.images || []);
        setContactInfo(post.contact_info || {});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(files);

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (title.length > 200) {
      setError('Title must be 200 characters or less');
      return;
    }

    if (description.length > 5000) {
      setError('Description must be 5000 characters or less');
      return;
    }

    const totalImages = existingImages.length + newImages.length;
    if (totalImages > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setSubmitting(true);

    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to edit posts');
        setSubmitting(false);
        return;
      }

      let imageUrls = [...existingImages];

      if (newImages.length > 0) {
        const uploadedUrls = await Promise.all(
          newImages.map(async (file, index) => {
            const fileName = `${Date.now()}_${index}.jpg`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('post-images')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('post-images')
              .getPublicUrl(filePath);

            return urlData.publicUrl;
          })
        );

        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({
          city_id: cityId,
          category_id: categoryId,
          title,
          description,
          price: price || null,
          location,
          images: imageUrls,
          contact_info: contactInfo,
        })
        .eq('id', postId);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-4 md:p-8 shadow-lg max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">Edit Post</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-200 font-semibold">{error}</p>
          </div>
        )}

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-white font-semibold mb-2">
              City <span className="text-red-400">*</span>
            </label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-yellow-400"
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
              className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Price (optional)</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Photos</label>
            <div className="space-y-4">
              {existingImages.length > 0 && (
                <div>
                  <p className="text-gray-300 text-sm mb-2">Current Images</p>
                  <div className="grid grid-cols-3 gap-4">
                    {existingImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Current ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewUrls.length > 0 && (
                <div>
                  <p className="text-gray-300 text-sm mb-2">New Images</p>
                  <div className="grid grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`New ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center justify-center w-full px-6 py-8 bg-white/5 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-white font-semibold">Add More Images</p>
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

          <div className="bg-white/5 border-2 border-white/20 rounded-xl p-6">
            <ContactInfoForm
              value={contactInfo}
              onChange={setContactInfo}
              showVisibilityToggles={true}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
