'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { submitEnquiry, makeIdempotencyKey } from '@/lib/submit-enquiry';

interface PBXEarlyAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PBXEarlyAccessModal({ open, onClose }: PBXEarlyAccessModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [usersNeeded, setUsersNeeded] = useState('');
  const [whatToTest, setWhatToTest] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setUsersNeeded('');
      setWhatToTest('');
      setNotes('');
      setSuccess(false);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const honeypot = (e.currentTarget.elements.namedItem('phone_alt') as HTMLInputElement)?.value?.trim();
    if (honeypot) {
      setSuccess(true);
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitEnquiry('leads', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        company_name: company.trim() || null,
        service_interest: 'Cloud PBX',
        message: whatToTest || null,
        enquiry_type: 'pbx_early_access',
        enquiry_data: { users_needed: usersNeeded || null, notes: notes || null },
        source: 'pbx_early_access',
        status: 'new',
        stage: 'new',
        consent_contact: true,
        idempotency_key: makeIdempotencyKey(),
      }, true);

      if (result.code === 'OK') {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-base font-semibold text-white">Request Early Access</h2>
                <p className="text-xs text-slate-400 mt-0.5">Be the first to test Digital-Footprint Cloud PBX</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Request Submitted</h3>
                <p className="text-sm text-slate-400 mb-6">Thank you for your interest. We will reach out when early access becomes available.</p>
                <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-colors cursor-pointer whitespace-nowrap">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} data-readdy-form="true" className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Name <span className="text-[#EF4444]">*</span></label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/30 transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Company <span className="text-[#EF4444]">*</span></label>
                  <input
                    name="company"
                    type="text"
                    required
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/30 transition-colors"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email <span className="text-[#EF4444]">*</span></label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/30 transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/30 transition-colors"
                    placeholder="+44 20 7946 0958"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Users/Extensions Needed</label>
                  <input
                    name="users_needed"
                    type="text"
                    value={usersNeeded}
                    onChange={e => setUsersNeeded(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/30 transition-colors"
                    placeholder="e.g. 5-10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">What would you like to test? <span className="text-[#EF4444]">*</span></label>
                  <textarea
                    name="what_to_test"
                    required
                    value={whatToTest}
                    onChange={e => setWhatToTest(e.target.value)}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/30 transition-colors resize-none h-20"
                    placeholder="Which features are you most interested in?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/30 transition-colors resize-none h-16"
                    placeholder="Anything else we should know?"
                  />
                </div>

                <input
                  type="text"
                  name="phone_alt"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                  className="absolute opacity-0 pointer-events-none"
                  style={{ position: 'absolute', left: '-9999px' }}
                />

                {error && (
                  <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                    <p className="text-xs text-[#EF4444]">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#F59E0B]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Submit Request</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}