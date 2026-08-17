import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, Shirt, ChevronRight, Eye, Crown, Users } from 'lucide-react';
import { Collection, Garment, User } from '../types';
import { api } from '../services/api';

interface CollectionsPageProps {
  onSelectTailorById: (tailorId: string) => void;
  onOpenAuth: (mode?: any) => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  onSelectTailorById,
  onOpenAuth,
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const garmentRes = await api.getGarments();
      if (garmentRes.garments) {
        setGarments(garmentRes.garments);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="rounded-3xl bg-stone-900 p-6 sm:p-8 border border-stone-800 shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest">
          <Layers className="w-4 h-4" />
          <span>Curated Lookbooks & Ensembles</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-100">
          Seasonal Collections & Signature Lines
        </h1>
        <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
          Explore complete tailoring series, bridal party coordination sets, royal velvet Agbada editions, and modern luxury suites designed by master artisans.
        </p>
      </div>

      {/* Grid of Garments grouped into Collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {garments.slice(0, 9).map((garment) => (
          <div
            key={garment.id}
            className="group rounded-3xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 shadow-xl overflow-hidden flex flex-col justify-between transition-all"
          >
            <div className="relative aspect-[4/3] bg-stone-950 overflow-hidden">
              <img
                src={garment.imageUrl}
                alt={garment.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  {garment.category} Collection
                </span>
                <h3 className="text-sm font-bold text-stone-100 truncate">{garment.title}</h3>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif font-black text-amber-400">
                  {garment.currency}{garment.price > 0 ? garment.price.toLocaleString() : 'Price on Inquiry'}
                </span>
                <span className="text-stone-400 text-[11px]">
                  Turnaround: {garment.turnaroundDays || 5} days
                </span>
              </div>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                <button
                  onClick={() => onSelectTailorById(garment.tailorId)}
                  className="text-xs font-bold text-stone-200 hover:text-amber-400 flex items-center gap-1"
                >
                  <span>By {garment.tailorName}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  onClick={() => onSelectTailorById(garment.tailorId)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all"
                >
                  View Lookbook
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
