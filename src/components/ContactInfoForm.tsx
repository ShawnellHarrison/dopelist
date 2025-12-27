import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageCircle, Send, Plus, X } from 'lucide-react';

export interface ContactInfo {
  phone?: { value: string; visible: boolean };
  email?: { value: string; visible: boolean };
  whatsapp?: { value: string; visible: boolean };
  telegram?: { value: string; visible: boolean };
  other?: { value: string; visible: boolean };
}

interface ContactInfoFormProps {
  value: ContactInfo;
  onChange: (contactInfo: ContactInfo) => void;
  showVisibilityToggles?: boolean;
}

export default function ContactInfoForm({
  value,
  onChange,
  showVisibilityToggles = true
}: ContactInfoFormProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(value || {});
  const [showOther, setShowOther] = useState(!!value?.other?.value);

  useEffect(() => {
    setContactInfo(value || {});
    setShowOther(!!value?.other?.value);
  }, [value]);

  const updateField = (field: keyof ContactInfo, fieldValue: string, visible: boolean = false) => {
    const updated = {
      ...contactInfo,
      [field]: fieldValue ? { value: fieldValue, visible } : undefined,
    };
    setContactInfo(updated);
    onChange(updated);
  };

  const toggleVisibility = (field: keyof ContactInfo) => {
    const fieldData = contactInfo[field];
    if (!fieldData) return;

    const updated = {
      ...contactInfo,
      [field]: { ...fieldData, visible: !fieldData.visible },
    };
    setContactInfo(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        <span className="text-sm text-gray-500">(Optional)</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Add your contact details. You can control which details are visible to others.
      </p>

      <div className="space-y-3">
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={contactInfo.phone?.value || ''}
              onChange={(e) => updateField('phone', e.target.value, contactInfo.phone?.visible || false)}
              placeholder="555-123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {showVisibilityToggles && contactInfo.phone?.value && (
            <button
              type="button"
              onClick={() => toggleVisibility('phone')}
              className={`mt-7 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                contactInfo.phone.visible
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {contactInfo.phone.visible ? 'Visible' : 'Hidden'}
            </button>
          )}
        </div>

        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={contactInfo.email?.value || ''}
              onChange={(e) => updateField('email', e.target.value, contactInfo.email?.visible || false)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {showVisibilityToggles && contactInfo.email?.value && (
            <button
              type="button"
              onClick={() => toggleVisibility('email')}
              className={`mt-7 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                contactInfo.email.visible
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {contactInfo.email.visible ? 'Visible' : 'Hidden'}
            </button>
          )}
        </div>

        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </label>
            <input
              type="tel"
              value={contactInfo.whatsapp?.value || ''}
              onChange={(e) => updateField('whatsapp', e.target.value, contactInfo.whatsapp?.visible || false)}
              placeholder="555-123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {showVisibilityToggles && contactInfo.whatsapp?.value && (
            <button
              type="button"
              onClick={() => toggleVisibility('whatsapp')}
              className={`mt-7 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                contactInfo.whatsapp.visible
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {contactInfo.whatsapp.visible ? 'Visible' : 'Hidden'}
            </button>
          )}
        </div>

        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Send className="w-4 h-4" />
              Telegram
            </label>
            <input
              type="text"
              value={contactInfo.telegram?.value || ''}
              onChange={(e) => updateField('telegram', e.target.value, contactInfo.telegram?.visible || false)}
              placeholder="@username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {showVisibilityToggles && contactInfo.telegram?.value && (
            <button
              type="button"
              onClick={() => toggleVisibility('telegram')}
              className={`mt-7 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                contactInfo.telegram.visible
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {contactInfo.telegram.visible ? 'Visible' : 'Hidden'}
            </button>
          )}
        </div>

        {!showOther ? (
          <button
            type="button"
            onClick={() => setShowOther(true)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add other contact method
          </button>
        ) : (
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                Other Contact Method
                <button
                  type="button"
                  onClick={() => {
                    setShowOther(false);
                    updateField('other', '', false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </label>
              <input
                type="text"
                value={contactInfo.other?.value || ''}
                onChange={(e) => updateField('other', e.target.value, contactInfo.other?.visible || false)}
                placeholder="Discord: username#1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {showVisibilityToggles && contactInfo.other?.value && (
              <button
                type="button"
                onClick={() => toggleVisibility('other')}
                className={`mt-7 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contactInfo.other.visible
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {contactInfo.other.visible ? 'Visible' : 'Hidden'}
              </button>
            )}
          </div>
        )}
      </div>

      {showVisibilityToggles && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Hidden</strong> contact info will be revealed when viewers click "Show Contact Info" button.
            <strong> Visible</strong> contact info is always displayed.
          </p>
        </div>
      )}
    </div>
  );
}
