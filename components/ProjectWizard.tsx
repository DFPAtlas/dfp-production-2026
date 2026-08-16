'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { 
  X, ChevronRight, ChevronLeft, Globe, Smartphone, Bot, Share2, 
  Database, ShoppingCart, Clock, Settings, Upload, Check, Sparkles,
  Zap, Layers, Code, Palette, Server, CreditCard, Users, FileImage
} from 'lucide-react';



interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    email: string;
    projectType: string;
    budget: number;
    message: string;
  };
}

const websiteTypes = [
  { id: 'business', label: 'Business Website', icon: Globe, desc: 'Company site with services & contact' },
  { id: 'ecommerce', label: 'E-commerce Store', icon: ShoppingCart, desc: 'Online shop with products' },
  { id: 'portfolio', label: 'Portfolio', icon: Palette, desc: 'Showcase your work' },
  { id: 'saas', label: 'SaaS Platform', icon: Layers, desc: 'Software as a service' },
  { id: 'blog', label: 'Blog/Content', icon: FileImage, desc: 'Content-focused site' },
  { id: 'booking', label: 'Booking System', icon: Clock, desc: 'Appointments & reservations' },
  { id: 'community', label: 'Community/Forum', icon: Users, desc: 'User discussions & groups' },
  { id: 'custom', label: 'Custom Solution', icon: Code, desc: 'Unique requirements' }
];

const visualEffects = [
  { id: 'minimal', label: 'Minimal & Clean', desc: 'Simple, fast-loading design' },
  { id: 'modern', label: 'Modern Animations', desc: 'Subtle transitions & effects' },
  { id: 'immersive', label: 'Immersive Experience', desc: 'Rich animations & interactions' },
  { id: 'parallax', label: 'Parallax Scrolling', desc: 'Depth & movement effects' }
];

const databaseOptions = [
  { id: 'none', label: 'No Database', desc: 'Static content only' },
  { id: 'simple', label: 'Simple Storage', desc: 'Basic data storage' },
  { id: 'relational', label: 'Relational Database', desc: 'Complex data relationships' },
  { id: 'realtime', label: 'Real-time Database', desc: 'Live updates & sync' }
];

const timelineOptions = [
  { id: 'urgent', label: '2-4 Weeks', desc: 'Rush delivery', price: '+25%' },
  { id: 'standard', label: '1-2 Months', desc: 'Standard timeline', price: 'Standard' },
  { id: 'relaxed', label: '2-3 Months', desc: 'Flexible timeline', price: '-10%' },
  { id: 'flexible', label: 'No Rush', desc: 'When it\'s ready', price: '-15%' }
];

export default function ProjectWizard({ isOpen, onClose, initialData }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    websiteType: '',
    mobileApp: false,
    aiAgents: false,
    socialMedia: false,
    referenceUrls: ['', '', ''],
    visualEffects: '',
    databaseType: '',
    ecommerce: false,
    stripePayment: false,
    timeline: '',
    managedHosting: false,
    additionalNotes: '',
    uploadedFiles: [] as File[]
  });

  const steps = isAdvancedMode ? [
    { title: 'Project Type', icon: Globe },
    { title: 'Services', icon: Zap },
    { title: 'References', icon: Sparkles },
    { title: 'Design', icon: Palette },
    { title: 'Technical', icon: Database },
    { title: 'E-commerce', icon: ShoppingCart },
    { title: 'Timeline', icon: Clock },
    { title: 'Assets', icon: Upload },
    { title: 'Review', icon: Check }
  ] : [
    { title: 'What You Need', icon: Globe },
    { title: 'Inspiration', icon: Sparkles },
    { title: 'Features', icon: Zap },
    { title: 'Timeline', icon: Clock },
    { title: 'Review', icon: Check }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      return sizeMB <= 5 && formData.uploadedFiles.length + files.indexOf(file) < 4;
    });
    setFormData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...validFiles].slice(0, 4)
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: submission, error } = await supabase
        .from('project_submissions')
        .insert({
          name: initialData.name,
          email: initialData.email,
          project_type: initialData.projectType,
          budget_range: `£${initialData.budget.toLocaleString()}+`,
          initial_message: initialData.message,
          website_type: formData.websiteType,
          mobile_app: formData.mobileApp,
          ai_agents: formData.aiAgents,
          social_media: formData.socialMedia,
          reference_urls: formData.referenceUrls.filter(url => url.trim() !== ''),
          visual_effects: formData.visualEffects,
          database_type: formData.databaseType,
          ecommerce: formData.ecommerce,
          stripe_payment: formData.stripePayment,
          timeline: formData.timeline,
          managed_hosting: formData.managedHosting,
          experience_level: isAdvancedMode ? 'advanced' : 'beginner',
          additional_notes: formData.additionalNotes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReferenceUrl = (index: number, value: string) => {
    const newUrls = [...formData.referenceUrls];
    newUrls[index] = value;
    setFormData(prev => ({ ...prev, referenceUrls: newUrls }));
  };

  const selectBtnBase = 'p-4 rounded-xl border text-left transition-all cursor-pointer';
  const selectBtnActive = 'border-[#00F0FF] bg-[#00F0FF]/10';
  const selectBtnInactive = 'border-gray-200 hover:border-gray-300';
  const checkboxRow = 'flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#00F0FF]/40 cursor-pointer transition-all';
  const inputField = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:border-[#00F0FF] transition-colors text-gray-900';
  const iconActive = 'text-[#00F0FF]';
  const iconInactive = 'text-gray-400';

  const renderBeginnerStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">What type of website do you need?</h3>
              <div className="grid grid-cols-2 gap-3">
                {websiteTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setFormData(prev => ({ ...prev, websiteType: type.id }))}
                    className={`${selectBtnBase} ${formData.websiteType === type.id ? selectBtnActive : selectBtnInactive}`}
                  >
                    <type.icon className={`w-6 h-6 mb-2 ${formData.websiteType === type.id ? iconActive : iconInactive}`} />
                    <p className="font-mono font-medium text-sm text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-mono font-bold text-gray-900">Additional Services</h3>
              <label className={checkboxRow}>
                <input
                  type="checkbox"
                  checked={formData.mobileApp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, mobileApp: e.target.checked }))}
                  className="w-5 h-5 rounded accent-[#00F0FF]"
                />
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-mono text-sm text-gray-900">Mobile App</p>
                  <p className="text-xs text-gray-500">iOS & Android app</p>
                </div>
              </label>
              <label className={checkboxRow}>
                <input
                  type="checkbox"
                  checked={formData.aiAgents}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, aiAgents: e.target.checked }))}
                  className="w-5 h-5 rounded accent-[#00F0FF]"
                />
                <Bot className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-mono text-sm text-gray-900">AI Agents</p>
                  <p className="text-xs text-gray-500">Chatbots & automation</p>
                </div>
              </label>
              <label className={checkboxRow}>
                <input
                  type="checkbox"
                  checked={formData.socialMedia}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, socialMedia: e.target.checked }))}
                  className="w-5 h-5 rounded accent-[#00F0FF]"
                />
                <Share2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-mono text-sm text-gray-900">Social Media Integration</p>
                  <p className="text-xs text-gray-500">Connect your socials</p>
                </div>
              </label>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-mono font-bold mb-2 text-gray-900">Share Your Inspiration</h3>
              <p className="text-gray-500 text-sm mb-4">Add up to 3 website links that inspire you</p>
              <div className="space-y-3">
                {formData.referenceUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateReferenceUrl(index, e.target.value)}
                      placeholder={`Website ${index + 1} (e.g., https://example.com)`}
                      className={`${inputField} pl-10`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Visual Style Preference</h3>
              <div className="grid grid-cols-2 gap-3">
                {visualEffects.map(effect => (
                  <button
                    key={effect.id}
                    onClick={() => setFormData(prev => ({ ...prev, visualEffects: effect.id }))}
                    className={`${selectBtnBase} ${formData.visualEffects === effect.id ? selectBtnActive : selectBtnInactive}`}
                  >
                    <p className="font-mono font-medium text-sm text-gray-900">{effect.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{effect.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Do you need online payments?</h3>
              <div className="space-y-3">
                <label className={checkboxRow}>
                  <input
                    type="checkbox"
                    checked={formData.ecommerce}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, ecommerce: e.target.checked }))}
                    className="w-5 h-5 rounded accent-[#00F0FF]"
                  />
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-mono text-sm text-gray-900">E-commerce / Online Shop</p>
                    <p className="text-xs text-gray-500">Sell products or services online</p>
                  </div>
                </label>
                {formData.ecommerce && (
                  <label className={`${checkboxRow} ml-4`}>
                    <input
                      type="checkbox"
                      checked={formData.stripePayment}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, stripePayment: e.target.checked }))}
                      className="w-5 h-5 rounded accent-[#00F0FF]"
                    />
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-mono text-sm text-gray-900">Stripe Payments</p>
                      <p className="text-xs text-gray-500">Accept card payments securely</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Ongoing Management</h3>
              <label className={checkboxRow}>
                <input
                  type="checkbox"
                  checked={formData.managedHosting}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, managedHosting: e.target.checked }))}
                  className="w-5 h-5 rounded accent-[#00F0FF]"
                />
                <Settings className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-mono text-sm text-gray-900">Managed Hosting & Support</p>
                  <p className="text-xs text-gray-500">We handle updates, security & maintenance</p>
                </div>
              </label>
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Upload Images (Optional)</h3>
              <p className="text-gray-500 text-sm mb-3">Share logos, brand assets, or inspiration images (max 4 files, 5MB each)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={formData.uploadedFiles.length >= 4}
                className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#00F0FF] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload images</p>
              </button>
              {formData.uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">When do you need this completed?</h3>
            <div className="space-y-3">
              {timelineOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFormData(prev => ({ ...prev, timeline: option.id }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    formData.timeline === option.id
                      ? selectBtnActive
                      : selectBtnInactive
                  }`}
                >
                  <div>
                    <p className="font-mono font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                  </div>
                  <span className={`text-sm font-mono ${option.price.includes('+') ? 'text-[#FF6B4A]' : option.price.includes('-') ? 'text-green-500' : 'text-gray-400'}`}>
                    {option.price}
                  </span>
                </button>
              ))}
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold mb-2 text-gray-900">Anything else we should know?</h3>
              <textarea
                value={formData.additionalNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Special requirements, existing branding guidelines, specific features..."
                maxLength={500}
                rows={4}
                className={`${inputField} resize-none`}
              />
              <p className="text-right text-xs text-gray-400 mt-1">{formData.additionalNotes.length}/500</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Review Your Project Brief</h3>
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-mono text-gray-900">{initialData.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-mono text-gray-900">{initialData.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Budget</p>
                  <p className="font-mono text-gray-900">£{initialData.budget.toLocaleString()}+</p>
                </div>
                <div>
                  <p className="text-gray-500">Website Type</p>
                  <p className="font-mono text-gray-900 capitalize">{formData.websiteType || 'Not selected'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Timeline</p>
                  <p className="font-mono text-gray-900">{timelineOptions.find(t => t.id === formData.timeline)?.label || 'Not selected'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Visual Style</p>
                  <p className="font-mono text-gray-900">{visualEffects.find(e => e.id === formData.visualEffects)?.label || 'Not selected'}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-500 text-sm mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {formData.mobileApp && <span className="px-2 py-1 bg-[#00F0FF]/20 text-[#00B8CC] rounded text-xs font-mono">Mobile App</span>}
                  {formData.aiAgents && <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs font-mono">AI Agents</span>}
                  {formData.socialMedia && <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded text-xs font-mono">Social Media</span>}
                  {formData.ecommerce && <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-mono">E-commerce</span>}
                  {formData.stripePayment && <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded text-xs font-mono">Stripe</span>}
                  {formData.managedHosting && <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-mono">Managed Hosting</span>}
                </div>
              </div>
              {formData.referenceUrls.some(url => url.trim()) && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-500 text-sm mb-2">Reference Sites</p>
                  <div className="space-y-1">
                    {formData.referenceUrls.filter(url => url.trim()).map((url, i) => (
                      <p key={i} className="text-xs font-mono text-[#00B8CC] truncate">{url}</p>
                    ))}
                  </div>
                </div>
              )}
              {formData.uploadedFiles.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-500 text-sm mb-2">Uploaded Files</p>
                  <p className="text-sm font-mono text-gray-900">{formData.uploadedFiles.length} file(s)</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderAdvancedStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Select Website Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {websiteTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setFormData(prev => ({ ...prev, websiteType: type.id }))}
                  className={`${selectBtnBase} ${formData.websiteType === type.id ? selectBtnActive : selectBtnInactive}`}
                >
                  <type.icon className={`w-6 h-6 mb-2 ${formData.websiteType === type.id ? iconActive : iconInactive}`} />
                  <p className="font-mono font-medium text-sm text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Additional Services</h3>
            <label className={checkboxRow}>
              <input
                type="checkbox"
                checked={formData.mobileApp}
                onChange={(e) => setFormData(prev => ({ ...prev, mobileApp: e.target.checked }))}
                className="w-5 h-5 rounded accent-[#00F0FF]"
              />
              <Smartphone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-mono text-sm text-gray-900">Mobile Application</p>
                <p className="text-xs text-gray-500">Native iOS & Android or React Native</p>
              </div>
            </label>
            <label className={checkboxRow}>
              <input
                type="checkbox"
                checked={formData.aiAgents}
                onChange={(e) => setFormData(prev => ({ ...prev, aiAgents: e.target.checked }))}
                className="w-5 h-5 rounded accent-[#00F0FF]"
              />
              <Bot className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-mono text-sm text-gray-900">AI Agents & Automation</p>
                <p className="text-xs text-gray-500">Chatbots, voice assistants, workflow automation</p>
              </div>
            </label>
            <label className={checkboxRow}>
              <input
                type="checkbox"
                checked={formData.socialMedia}
                onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: e.target.checked }))}
                className="w-5 h-5 rounded accent-[#00F0FF]"
              />
              <Share2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-mono text-sm text-gray-900">Social Media Integration</p>
                <p className="text-xs text-gray-500">OAuth, sharing, feeds, analytics</p>
              </div>
            </label>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-2 text-gray-900">Reference Websites</h3>
            <p className="text-gray-500 text-sm mb-4">Provide up to 3 URLs of websites you like</p>
            <div className="space-y-3">
              {formData.referenceUrls.map((url, index) => (
                <div key={index} className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateReferenceUrl(index, e.target.value)}
                    placeholder={`Reference URL ${index + 1}`}
                    className={`${inputField} pl-10`}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Visual Effects & Animations</h3>
            <div className="space-y-3">
              {visualEffects.map(effect => (
                <button
                  key={effect.id}
                  onClick={() => setFormData(prev => ({ ...prev, visualEffects: effect.id }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.visualEffects === effect.id
                      ? selectBtnActive
                      : selectBtnInactive
                  }`}
                >
                  <p className="font-mono font-medium text-gray-900">{effect.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{effect.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Database Requirements</h3>
            <div className="space-y-3">
              {databaseOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFormData(prev => ({ ...prev, databaseType: option.id }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.databaseType === option.id
                      ? selectBtnActive
                      : selectBtnInactive
                  }`}
                >
                  <p className="font-mono font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">E-commerce & Payments</h3>
            <label className={checkboxRow}>
              <input
                type="checkbox"
                checked={formData.ecommerce}
                onChange={(e) => setFormData(prev => ({ ...prev, ecommerce: e.target.checked }))}
                className="w-5 h-5 rounded accent-[#00F0FF]"
              />
              <ShoppingCart className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-mono text-sm text-gray-900">E-commerce Functionality</p>
                <p className="text-xs text-gray-500">Product catalog, cart, checkout</p>
              </div>
            </label>
            {formData.ecommerce && (
              <label className={`${checkboxRow} ml-4`}>
                <input
                  type="checkbox"
                  checked={formData.stripePayment}
                  onChange={(e) => setFormData(prev => ({ ...prev, stripePayment: e.target.checked }))}
                  className="w-5 h-5 rounded accent-[#00F0FF]"
                />
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-mono text-sm text-gray-900">Stripe Payment Integration</p>
                  <p className="text-xs text-gray-500">Secure card payments, subscriptions</p>
                </div>
              </label>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-4 text-gray-900">Project Timeline</h3>
            <div className="space-y-3">
              {timelineOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFormData(prev => ({ ...prev, timeline: option.id }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    formData.timeline === option.id
                      ? selectBtnActive
                      : selectBtnInactive
                  }`}
                >
                  <div>
                    <p className="font-mono font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                  </div>
                  <span className={`text-sm font-mono ${option.price.includes('+') ? 'text-[#FF6B4A]' : option.price.includes('-') ? 'text-green-500' : 'text-gray-400'}`}>
                    {option.price}
                  </span>
                </button>
              ))}
            </div>
            <label className={checkboxRow}>
              <input
                type="checkbox"
                checked={formData.managedHosting}
                onChange={(e) => setFormData(prev => ({ ...prev, managedHosting: e.target.checked }))}
                className="w-5 h-5 rounded accent-[#00F0FF]"
              />
              <Server className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-mono text-sm text-gray-900">Managed Hosting & Maintenance</p>
                <p className="text-xs text-gray-500">Ongoing support after deployment</p>
              </div>
            </label>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-mono font-bold mb-2 text-gray-900">Upload Assets</h3>
            <p className="text-gray-500 text-sm mb-4">Upload logos, brand guidelines, or reference images (max 4 files, 5MB each)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={formData.uploadedFiles.length >= 4}
              className="w-full p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#00F0FF] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">Click to upload files</p>
              <p className="text-xs text-gray-400 mt-1">{formData.uploadedFiles.length}/4 files uploaded</p>
            </button>
            {formData.uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {formData.uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileImage className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)}MB</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <h3 className="text-lg font-mono font-bold mb-2 mt-6 text-gray-900">Additional Notes</h3>
              <textarea
                value={formData.additionalNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Technical requirements, API integrations, specific frameworks..."
                maxLength={500}
                rows={4}
                className={`${inputField} resize-none`}
              />
              <p className="text-right text-xs text-gray-400 mt-1">{formData.additionalNotes.length}/500</p>
            </div>
          </div>
        );
      case 8:
        return renderBeginnerStep();
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border border-gray-100 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {submitSuccess ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-[#00F0FF]/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-[#00F0FF]" />
              </motion.div>
              <h2 className="text-2xl font-bold font-mono mb-4 text-gray-900">Project Brief Submitted!</h2>
              <p className="text-gray-500 mb-6">We’ll review your requirements and get back to you within 24 hours.</p>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC]"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold font-mono text-gray-900">Project Setup Wizard</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                          index === currentStep
                            ? 'bg-[#00F0FF] text-white'
                            : index < currentStep
                            ? 'bg-[#00B8CC] text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      isAdvancedMode
                        ? 'bg-[#FF6B4A]/10 text-[#FF6B4A] border border-[#FF6B4A]/30'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isAdvancedMode ? 'Advanced Mode' : 'Simple Mode'}
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-3 font-mono">
                  Step {currentStep + 1}: {steps[currentStep].title}
                </p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {isAdvancedMode ? renderAdvancedStep() : renderBeginnerStep()}
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer font-mono text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] rounded-lg font-mono font-bold hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Brief
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-6 py-3 bg-[#00F0FF] rounded-lg font-mono font-bold hover:bg-[#00B8CC] transition-colors cursor-pointer whitespace-nowrap text-white"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
