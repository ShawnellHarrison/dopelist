import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, Send, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { ContactInfo } from './ContactInfoForm';
import { supabase } from '../lib/supabase';

interface ContactInfoDisplayProps {
  contactInfo: ContactInfo;
  postId: string;
  isOwnPost?: boolean;
}

export default function ContactInfoDisplay({
  contactInfo,
  postId,
  isOwnPost = false
}: ContactInfoDisplayProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hasAnyContact = Object.values(contactInfo || {}).some(
    (field) => field && field.value
  );

  if (!hasAnyContact) {
    return null;
  }

  const hiddenFields = Object.entries(contactInfo || {}).filter(
    ([_, field]) => field && field.value && !field.visible
  );
  const visibleFields = Object.entries(contactInfo || {}).filter(
    ([_, field]) => field && field.value && field.visible
  );

  const hasHiddenFields = hiddenFields.length > 0;

  const trackContactView = async () => {
    if (isOwnPost) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const sessionId = !userId ? getOrCreateSessionId() : null;

      await supabase.from('contact_views').insert({
        post_id: postId,
        viewer_user_id: userId,
        viewer_session_id: sessionId,
      });
    } catch (error) {
      console.error('Error tracking contact view:', error);
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
    trackContactView();
  };

  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem('anonymous_session_id');
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymous_session_id', sessionId);
    }
    return sessionId;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />;
      case 'telegram':
        return <Send className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderContactField = (type: string, field: { value: string; visible: boolean }) => (
    <div
      key={type}
      className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="text-gray-600">
          {getIcon(type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 font-medium">{getLabel(type)}</div>
          <div className="text-sm text-gray-900 font-medium truncate">{field.value}</div>
        </div>
      </div>
      <button
        onClick={() => copyToClipboard(field.value, type)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
        title="Copy to clipboard"
      >
        {copiedField === type ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-semibold text-gray-900">Contact Information</h4>
        {isOwnPost && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Your Post
          </span>
        )}
      </div>

      <div className="space-y-2">
        {visibleFields.map(([type, field]) => (
          field && renderContactField(type, field)
        ))}

        {hasHiddenFields && !isRevealed && (
          <button
            onClick={handleReveal}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            Show {hiddenFields.length} Hidden Contact{hiddenFields.length > 1 ? 's' : ''}
          </button>
        )}

        {hasHiddenFields && isRevealed && (
          <>
            {hiddenFields.map(([type, field]) => (
              field && renderContactField(type, field)
            ))}
            <button
              onClick={() => setIsRevealed(false)}
              className="w-full flex items-center justify-center gap-2 p-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              Hide Contact Info
            </button>
          </>
        )}
      </div>

      {!isOwnPost && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Contact the seller using the information above
        </p>
      )}
    </div>
  );
}
