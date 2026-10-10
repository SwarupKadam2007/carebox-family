import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, ShoppingBag, Bell, Pill, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Medicine } from '../../types';

export const RefillsScreen: React.FC = () => {
  const { setCurrentTab, medicines, showToast } = useApp();
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);

  const pharmacyOptions = [
    { name: 'Tata 1mg', url: 'https://www.1mg.com', desc: 'Home delivery across India' },
    { name: 'Apollo Pharmacy', url: 'https://www.apollopharmacy.in', desc: '24/7 delivery in major cities' },
    { name: 'PharmEasy', url: 'https://pharmeasy.in', desc: 'Prescription refill discounts' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FCF6EE] px-5 py-4 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentTab('today')}
          className="p-2 -ml-2 text-[#1F4E4B] hover:text-[#2E7D79] rounded-full transition-colors"
          aria-label="Back to Today"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-semibold text-base text-[#1F4E4B]">
          Refills
        </h1>
        <div className="w-7" />
      </div>

      {/* Medicine Cards List matching Screen 6 */}
      <div className="space-y-3 mb-6">
        {medicines.map((med) => {
          const isLow = med.daysLeft <= 5;

          return (
            <div
              key={med.id}
              onClick={() => setSelectedMed(med)}
              className="bg-white rounded-2xl p-4 shadow-card border border-[#E5EAE9] flex items-center justify-between cursor-pointer hover:border-[#2E7D79]/30 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isLow ? 'bg-[#FEF7EC] text-[#F2B33D]' : 'bg-[#EBF7EE] text-[#27A348]'
                  }`}
                >
                  <Pill className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-heading font-semibold text-sm text-[#1F4E4B]">
                    {med.name}
                  </h3>
                  <p className="text-xs text-[#597573] mt-0.5">
                    {med.dosage}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    isLow ? 'text-[#D89825]' : 'text-[#27A348]'
                  }`}
                >
                  {med.daysLeft} days left
                </span>
                <ChevronRight className="w-4 h-4 text-[#C3CDCC]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons matching Screen 6 */}
      <div className="mt-auto space-y-3 pb-2">
        <button
          id="btn-remind-order"
          onClick={() => showToast('Calendar reminder set: Refill Metformin in 2 days.')}
          className="w-full py-4 bg-[#2E7D79] hover:bg-[#246562] active:scale-[0.99] text-white font-medium text-base rounded-2xl shadow-soft flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          <span>Remind me to order</span>
        </button>

        <button
          id="btn-order-pharmacy"
          onClick={() => setShowPharmacyModal(true)}
          className="w-full py-3.5 bg-white border border-[#2E7D79] text-[#2E7D79] hover:bg-[#E8F3F1]/40 active:scale-[0.99] font-medium text-base rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order from pharmacy</span>
        </button>
      </div>

      {/* Medicine Detail Modal */}
      {selectedMed && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setSelectedMed(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-float border border-[#E5EAE9]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-base text-[#1F4E4B]">
              {selectedMed.name}
            </h3>
            <p className="text-xs text-[#597573] mt-1">{selectedMed.dosage}</p>

            <div className="bg-[#FCF6EE] p-3 rounded-2xl my-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#597573]">Pills remaining:</span>
                <span className="font-semibold text-[#1F4E4B]">{selectedMed.pillsLeft} tablets</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#597573]">Daily consumption:</span>
                <span className="font-semibold text-[#1F4E4B]">{selectedMed.pillsPerDose} / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#597573]">Estimated run out:</span>
                <span className={`font-semibold ${selectedMed.daysLeft <= 5 ? 'text-[#D89825]' : 'text-[#27A348]'}`}>
                  {selectedMed.daysLeft} days
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMed(null)}
              className="w-full py-3 bg-[#2E7D79] text-white text-xs font-medium rounded-xl hover:bg-[#246562]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Pharmacy External Links Modal */}
      {showPharmacyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowPharmacyModal(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-float border border-[#E5EAE9]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-base text-[#1F4E4B] mb-1">
              Order from Pharmacy
            </h3>
            <p className="text-xs text-[#597573] mb-4">
              Select your trusted pharmacy partner. CareBox does not process payments or collect commissions.
            </p>

            <div className="space-y-2 mb-4">
              {pharmacyOptions.map((pharm) => (
                <a
                  key={pharm.name}
                  href={pharm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl border border-[#E5EAE9] hover:border-[#2E7D79] bg-[#FCF6EE]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1F4E4B]">{pharm.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#2E7D79]" />
                  </div>
                  <p className="text-[11px] text-[#8E9E9C] mt-0.5">{pharm.desc}</p>
                </a>
              ))}
            </div>

            <button
              onClick={() => setShowPharmacyModal(false)}
              className="w-full py-2.5 bg-gray-100 text-[#597573] text-xs font-medium rounded-xl hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
