'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { usePantryStore } from '@/stores/pantryStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Camera, Mic, MicOff, Package, AlertTriangle, Loader2, X, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { differenceInDays, parseISO, format } from 'date-fns';
import AIFridgeScanner from '@/components/fridge/AIFridgeScanner';

const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
  protein: { color: 'text-red-400 bg-red-400/10 border-red-400/20', emoji: '🥩' },
  vegetable: { color: 'text-green-400 bg-green-400/10 border-green-400/20', emoji: '🥦' },
  fruit: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', emoji: '🍎' },
  dairy: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', emoji: '🧀' },
  grain: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', emoji: '🌾' },
  spice: { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', emoji: '🌶️' },
  oil: { color: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/20', emoji: '🫙' },
  other: { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', emoji: '📦' },
};

function ExpiryBadge({ date }: { date: string }) {
  const days = differenceInDays(parseISO(date), new Date());
  if (days < 0) return <span className="badge bg-red-500/20 text-red-400 text-[10px]">Expired</span>;
  if (days <= 2) return <span className="badge bg-red-400/15 text-red-300 text-[10px]"><AlertTriangle className="w-2.5 h-2.5" /> {days}d left</span>;
  if (days <= 5) return <span className="badge bg-orange-400/15 text-orange-300 text-[10px]">{days}d left</span>;
  return <span className="badge bg-surface-muted/30 text-gray-400 text-[10px]">{format(parseISO(date), 'MMM d')}</span>;
}

export default function FridgePage() {
  const { items, loading, fetchPantry, addItem, addBulkItems, removeItem } = usePantryStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ingredient: '', quantity: 1, unit: 'piece', category: 'vegetable', expiryDate: '' });
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const recognitionRef = useRef<any>(null);

  useEffect(() => { fetchPantry(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ingredient.trim()) return;
    try {
      await addItem(form);
      toast.success(`${form.ingredient} added to fridge!`);
      setForm({ ingredient: '', quantity: 1, unit: 'piece', category: 'vegetable', expiryDate: '' });
      setShowAdd(false);
    } catch { toast.error('Failed to add ingredient'); }
  };

  const handleBarcode = async () => {
    if (!barcodeInput.trim()) return;
    setScanning(true);
    try {
      const { data } = await api.get(`/pantry/barcode/${barcodeInput.trim()}`);
      await addItem({ ingredient: data.name, quantity: 1, unit: 'piece', category: 'other' });
      toast.success(`Added: ${data.name}`);
      setBarcodeInput('');
    } catch { toast.error('Product not found'); }
    finally { setScanning(false); }
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return toast.error('Voice input not supported in this browser');
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      // Parse multiple ingredients from voice
      const ings = text.split(/and|,/).map((s: string) => s.trim()).filter(Boolean);
      Promise.all(ings.map((ing: string) => addItem({ ingredient: ing, quantity: 1, unit: 'piece', category: 'other' })))
        .then(() => toast.success(`Added ${ings.length} ingredient(s) from voice!`))
        .catch(() => toast.error('Failed to add voice ingredients'));
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const categories = ['All', ...Object.keys(CATEGORY_CONFIG)];
  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat);
  const expiring = items.filter(i => i.expiryDate && differenceInDays(parseISO(i.expiryDate), new Date()) <= 3);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-brand" /> My Fridge
            </h1>
            <p className="text-gray-400 mt-1">{items.length} ingredients tracked</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleVoice} title="Voice input" className={clsx('btn-ghost p-2.5', listening && 'bg-red-500/20 border-red-500/30 text-red-400')}>
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowAIScanner(true)} title="AI Photo Scanner" className="btn-ghost p-2.5 text-purple-400 border-purple-400/20 hover:bg-purple-400/10">
              <Camera className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Ingredient
            </button>
          </div>
        </div>

        {/* Expiry Alert */}
        {expiring.length > 0 && (
          <div className="card p-4 mb-6 border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2">
              <AlertTriangle className="w-4 h-4" /> {expiring.length} item{expiring.length > 1 ? 's' : ''} expiring soon
            </div>
            <div className="flex flex-wrap gap-2">
              {expiring.map(i => <span key={i._id} className="text-sm text-orange-300">{i.ingredient}</span>)}
            </div>
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="card p-5 mb-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Add to Fridge</h3>
                <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
                <input className="input col-span-2" placeholder="Ingredient name *" value={form.ingredient}
                  onChange={e => setForm({ ...form, ingredient: e.target.value })} required />
                <input type="number" className="input" placeholder="Quantity" value={form.quantity} min={0}
                  onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) })} />
                <input className="input" placeholder="Unit (piece, g, ml...)" value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })} />
                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {Object.keys(CATEGORY_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" className="input" value={form.expiryDate}
                  onChange={e => setForm({ ...form, expiryDate: e.target.value })} placeholder="Expiry date" />
                <div className="col-span-2 flex gap-2">
                  <button type="submit" className="btn-primary flex-1">Add to Fridge</button>
                  <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                </div>
              </form>

              {/* Barcode */}
              <div className="mt-4 pt-4 border-t border-surface-border">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><ScanLine className="w-3 h-3" /> Barcode Lookup</p>
                <div className="flex gap-2">
                  <input className="input flex-1 text-sm" placeholder="Enter barcode number..." value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBarcode()} />
                  <button onClick={handleBarcode} disabled={scanning} className="btn-ghost px-3">
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={clsx('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all capitalize',
                filterCat === cat ? 'bg-brand text-white' : 'bg-surface-card text-gray-400 border border-surface-border hover:text-white')}>
              {cat !== 'All' && CATEGORY_CONFIG[cat]?.emoji} {cat}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Your fridge is empty. Add some ingredients!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((item, i) => {
                const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
                return (
                  <motion.div key={item._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.03 }}
                    className="card p-4 flex flex-col gap-2 group hover:border-brand/30 transition-all">
                    <div className="flex items-start justify-between">
                      <span className={clsx('badge text-xs border', cfg.color)}>
                        {cfg.emoji} {item.category}
                      </span>
                      <button onClick={() => removeItem(item._id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-medium text-white capitalize leading-tight">{item.ingredient}</p>
                    <p className="text-xs text-gray-400">{item.quantity} {item.unit}</p>
                    {item.expiryDate && <ExpiryBadge date={item.expiryDate} />}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      {showAIScanner && (
        <AIFridgeScanner
          onIngredientsConfirmed={addBulkItems}
          onClose={() => setShowAIScanner(false)}
        />
      )}
    </DashboardLayout>
  );
}
