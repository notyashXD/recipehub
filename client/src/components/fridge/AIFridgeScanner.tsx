'use client';
import { useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Camera, Upload, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExtractedIngredient {
  name: string;
  estimatedQuantity: number;
  unit: string;
  category: string;
  selected: boolean;
}

interface Props {
  onIngredientsConfirmed: (items: any[]) => Promise<void>;
  onClose: () => void;
}

export default function AIFridgeScanner({ onIngredientsConfirmed, onClose }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<ExtractedIngredient[]>([]);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const scanImage = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/extract-ingredients', {
        imageBase64,
        mimeType: 'image/jpeg',
      });
      setIngredients(data.ingredients.map((i: any) => ({ ...i, selected: true })));
      setStep('results');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to scan image');
    } finally { setLoading(false); }
  };

  const toggle = (idx: number) => setIngredients(i => i.map((ing, j) => j === idx ? { ...ing, selected: !ing.selected } : ing));

  const confirm = async () => {
    const selected = ingredients.filter(i => i.selected).map(i => ({
      ingredient: i.name, quantity: i.estimatedQuantity || 1, unit: i.unit || 'piece', category: i.category || 'other',
    }));
    if (selected.length === 0) return toast.error('Select at least one ingredient');
    setAdding(true);
    try {
      await onIngredientsConfirmed(selected);
      toast.success(`Added ${selected.length} ingredients from photo!`);
      onClose();
    } catch { toast.error('Failed to add ingredients'); }
    finally { setAdding(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="card w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> AI Fridge Scanner
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Photo your fridge — AI extracts all ingredients</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-surface-muted rounded-2xl p-10 text-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-white font-medium">Drop a fridge photo here</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                <p className="text-xs text-gray-600 mt-3">Supports JPG, PNG, WEBP</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </motion.div>
          )}

          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="relative rounded-xl overflow-hidden mb-4 h-56">
                <img src={imagePreview} alt="Fridge" className="w-full h-full object-cover" />
                <button onClick={() => setStep('upload')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button onClick={scanImage} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning with AI...</> : <><Sparkles className="w-4 h-4" /> Scan for Ingredients</>}
              </button>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-gray-400 mb-3">Found {ingredients.length} ingredients. Tap to deselect any:</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4 pr-1">
                {ingredients.map((ing, i) => (
                  <button key={i} onClick={() => toggle(i)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all border ${ing.selected ? 'bg-green-500/10 border-green-500/25 text-white' : 'bg-surface-card border-surface-border text-gray-500'}`}>
                    {ing.selected ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded border border-gray-600 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize truncate">{ing.name}</div>
                      <div className="text-xs text-gray-500">{ing.estimatedQuantity} {ing.unit}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={confirm} disabled={adding} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Add {ingredients.filter(i => i.selected).length} to Fridge
                </button>
                <button onClick={() => setStep('upload')} className="btn-ghost px-4">Retry</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
