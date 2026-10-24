import React, { useState, useEffect } from 'react';
import { X, Pill, Trash2, Check, Clock } from 'lucide-react';
import { Medicine, Slot } from '../../types';

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine?: Medicine | null;
  onSave: (med: {
    name: string;
    strength: string;
    dosage: string;
    slot: Slot | 'both';
    pillsLeft: number;
    pillsPerDose: number;
  }) => Promise<void>;
  onDelete?: (medicineId: string) => Promise<void>;
}

export const MedicineModal: React.FC<MedicineModalProps> = ({
  isOpen,
  onClose,
  medicine,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosage, setDosage] = useState('');
  const [slot, setSlot] = useState<Slot | 'both'>('morning');
  const [pillsLeft, setPillsLeft] = useState(30);
  const [pillsPerDose, setPillsPerDose] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (medicine) {
      setName(medicine.name || '');
      setStrength(medicine.strength || '');
      setDosage(medicine.dosage || '');
      setSlot(medicine.slot || 'morning');
      setPillsLeft(medicine.pillsLeft ?? 30);
      setPillsPerDose(medicine.pillsPerDose ?? 1);
    } else {
      setName('');
      setStrength('');
      setDosage('1 tablet');
      setSlot('morning');
      setPillsLeft(30);
      setPillsPerDose(1);
    }
    setError(null);
  }, [medicine, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the medicine name');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        strength: strength.trim(),
        dosage: dosage.trim() || '1 tablet',
        slot,
        pillsLeft: Math.max(0, Number(pillsLeft) || 0),
        pillsPerDose: Math.max(1, Number(pillsPerDose) || 1),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!medicine || !onDelete) return;
    if (window.confirm(`Are you sure you want to remove ${medicine.name}?`)) {
      setIsSubmitting(true);
      try {
        await onDelete(medicine.id);
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to remove medicine');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#2E7D79]/15 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2E7D79]/10 text-[#2E7D79] flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <h2 id="modal-title" className="font-heading font-bold text-base text-[#1F4E4B]">
              {medicine ? 'Edit Medication' : 'Add Medication'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8E9E9C] hover:text-[#1F4E4B] hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Medicine Name */}
          <div>
            <label className="block text-xs font-semibold text-[#1F4E4B] mb-1">
              Medicine Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin"
              className="w-full px-3.5 py-2.5 bg-[#F9F7F3] border border-[#2E7D79]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D79]/40 text-[#1F4E4B]"
              required
            />
          </div>

          {/* Strength & Dosage */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F4E4B] mb-1">
                Strength
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500mg"
                className="w-full px-3 py-2 bg-[#F9F7F3] border border-[#2E7D79]/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D79]/40 text-[#1F4E4B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F4E4B] mb-1">
                Instructions
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1 tablet"
                className="w-full px-3 py-2 bg-[#F9F7F3] border border-[#2E7D79]/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D79]/40 text-[#1F4E4B]"
              />
            </div>
          </div>

          {/* Compartment / Slot */}
          <div>
            <label className="block text-xs font-semibold text-[#1F4E4B] mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#2E7D79]" />
              <span>Dose Compartment</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['morning', 'afternoon', 'night', 'both'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`py-2 text-[11px] font-semibold rounded-xl capitalize transition-all border ${
                    slot === s
                      ? 'bg-[#2E7D79] text-white border-[#2E7D79] shadow-xs'
                      : 'bg-[#F9F7F3] text-[#5C716E] border-transparent hover:border-[#2E7D79]/30'
                  }`}
                >
                  {s === 'both' ? 'M & N' : s.slice(0, 5)}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Tracking */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#1F4E4B] mb-1">
                Pills Left
              </label>
              <input
                type="number"
                min="0"
                value={pillsLeft}
                onChange={(e) => setPillsLeft(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#F9F7F3] border border-[#2E7D79]/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D79]/40 text-[#1F4E4B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F4E4B] mb-1">
                Pills Per Dose
              </label>
              <input
                type="number"
                min="1"
                value={pillsPerDose}
                onChange={(e) => setPillsPerDose(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-[#F9F7F3] border border-[#2E7D79]/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D79]/40 text-[#1F4E4B]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {medicine && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors"
                title="Delete medication"
                aria-label="Delete medication"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#2E7D79] hover:bg-[#246562] active:scale-[0.99] text-white font-medium text-xs rounded-xl shadow-soft transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{medicine ? 'Save Changes' : 'Add Medication'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
