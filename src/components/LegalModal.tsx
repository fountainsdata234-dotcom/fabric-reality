import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            {type === 'terms' ? (
              <FileText className="w-5 h-5 text-amber-500" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="text-lg font-serif font-bold text-amber-400">
              {type === 'terms' ? 'Terms & Conditions of Service' : 'Privacy Policy & Data Protection'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-stone-300 text-sm leading-relaxed space-y-4 font-sans">
          {type === 'terms' ? (
            <>
              <p className="text-stone-400 text-xs font-mono">Effective Date: August 2026 | Platform: Fabric Reality</p>
              
              <h3 className="text-amber-300 font-semibold text-base mt-2">1. Welcome to Fabric Reality</h3>
              <p>
                Fabric Reality provides a premium bespoke matchmaking, portfolio publishing, and discovery platform linking certified bespoke tailors, fashion designers, and discerning customers worldwide. By signing up, browsing, or publishing designs on Fabric Reality, you agree to these Terms.
              </p>

              <h3 className="text-amber-300 font-semibold text-base">2. Tailor Portfolios & Authentic Imagery</h3>
              <p>
                Tailors agree to upload only original, authentic photographs of garments they have crafted or customized. Misleading stock photographs from third-party catalogs without attribution are strictly subject to removal by platform administrators.
              </p>

              <h3 className="text-amber-300 font-semibold text-base">3. Customer Reviews & Ratings</h3>
              <p>
                Only verified customers who have interacted or commissioned work may rate tailors and individual garments. Ratings directly influence search index visibility and trending rank.
              </p>

              <h3 className="text-amber-300 font-semibold text-base">4. Promotion Plans & Invoicing</h3>
              <p>
                Promotional packages (including Spotlight Gold and Royal Elite) offer enhanced search algorithm frequency, homepage carousel highlights, and verified gold badges. Invoicing and payment confirmation are coordinated through official administrative support (08029772375).
              </p>

              <h3 className="text-amber-300 font-semibold text-base">5. Direct Messaging & WhatsApp Communications</h3>
              <p>
                Fabric Reality provides in-app messaging and direct WhatsApp routing. Users agree to engage professionally regarding tailoring measurements, styling consultations, pricing agreements, and delivery schedules.
              </p>
            </>
          ) : (
            <>
              <p className="text-stone-400 text-xs font-mono">Updated: August 2026 | Privacy & AWS S3 Safeguards</p>

              <h3 className="text-amber-300 font-semibold text-base mt-2">1. Data Collection & Purpose</h3>
              <p>
                We collect essential contact details (Country, City, Phone Number with country code, optional WhatsApp number) to match customers with tailors in their vicinity and facilitate custom garment inquiries.
              </p>

              <h3 className="text-amber-300 font-semibold text-base">2. Cloud Storage with AWS S3</h3>
              <p>
                Garment portfolio photographs and user avatar profile images are securely stored in Amazon Web Services (AWS S3 bucket <code>fabric-reality</code> in EU region) to ensure high-resolution presentation and fast global delivery.
              </p>

              <h3 className="text-amber-300 font-semibold text-base">3. Location Information</h3>
              <p>
                Geographic coordinates and city locations are utilized strictly for calculating regional proximity so customers can locate talented master tailors nearby.
              </p>

              <h3 className="text-amber-300 font-semibold text-base">4. Account Security & Administration</h3>
              <p>
                Admin oversight is maintained by designated administrators to maintain marketplace integrity, prevent spam, and protect our fashion community.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
