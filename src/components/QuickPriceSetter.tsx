import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProduceItem } from '../types';
import { Tag, Check, ArrowRight, Sparkles, Hash, Calculator, HelpCircle } from 'lucide-react';

export const QuickPriceSetter: React.FC = () => {
  const { produceList, updateProduceItem, lang } = useApp();

  // Selected product index / id
  const [selectedProductId, setSelectedProductId] = useState<string>(produceList[0]?.id || '');
  const [inputPrice, setInputPrice] = useState<string>(
    produceList[0]?.pricePerKg ? String(produceList[0].pricePerKg) : '35'
  );
  const [quickCommandText, setQuickCommandText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [recentUpdates, setRecentUpdates] = useState<
    Array<{ id: string; num: number; name: string; oldPrice: number; newPrice: number; unit: string; time: string }>
  >([]);

  // Sequential numbering map
  const itemNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    produceList.forEach((p, idx) => {
      map.set(p.id, idx + 1);
    });
    return map;
  }, [produceList]);

  const selectedItem = useMemo(() => {
    return produceList.find((p) => p.id === selectedProductId) || produceList[0];
  }, [produceList, selectedProductId]);

  // Synchronize inputPrice whenever product selection changes
  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const item = produceList.find((p) => p.id === id);
    if (item) {
      setInputPrice(String(item.pricePerKg));
    }
  };

  const pricingUnit = selectedItem?.pricingUnit || 'kg';
  const isGaddi = pricingUnit === 'gaddi';
  const isPiece = pricingUnit === 'piece';

  const unitLabel = useMemo(() => {
    if (isGaddi) return lang === 'mr' ? 'जुडी' : 'गड्डी';
    if (isPiece) return lang === 'mr' ? 'नग' : 'पीस';
    return 'kg';
  }, [isGaddi, isPiece, lang]);

  const currentPriceNum = Math.max(1, parseFloat(inputPrice) || selectedItem?.pricePerKg || 30);

  // Compute calculated tiers based on unit
  const computedTiers = useMemo(() => {
    if (isGaddi) {
      return [
        { label: '1 गड्डी', qty: 1, total: Math.round(currentPriceNum * 1) },
        { label: '2 गड्डी', qty: 2, total: Math.round(currentPriceNum * 2) },
        { label: '3 गड्डी', qty: 3, total: Math.round(currentPriceNum * 3) },
        { label: '5 गड्डी', qty: 5, total: Math.round(currentPriceNum * 5) },
      ];
    }
    if (isPiece) {
      return [
        { label: '1 नग / पीस', qty: 1, total: Math.round(currentPriceNum * 1) },
        { label: '2 नग / पीस', qty: 2, total: Math.round(currentPriceNum * 2) },
        { label: '4 नग / पीस', qty: 4, total: Math.round(currentPriceNum * 4) },
        { label: '6 नग / पीस', qty: 6, total: Math.round(currentPriceNum * 6) },
      ];
    }
    // kg default
    return [
      { label: '500g (0.5 kg)', qty: 0.5, total: Math.round(currentPriceNum * 0.5) },
      { label: '1 kg', qty: 1.0, total: Math.round(currentPriceNum * 1.0) },
      { label: '1.5 kg', qty: 1.5, total: Math.round(currentPriceNum * 1.5) },
      { label: '2 kg', qty: 2.0, total: Math.round(currentPriceNum * 2.0) },
      { label: '5 kg (थोक क्रेट)', qty: 5.0, total: Math.round(currentPriceNum * 5.0) },
    ];
  }, [currentPriceNum, isGaddi, isPiece]);

  // Apply new price to live store
  const handleSavePrice = () => {
    if (!selectedItem) return;
    const newPriceVal = parseFloat(inputPrice);
    if (isNaN(newPriceVal) || newPriceVal <= 0) {
      setStatusMessage('❌ कृपया मान्य मूल्य दर्ज करें');
      return;
    }

    const itemNum = itemNumberMap.get(selectedItem.id) || 1;
    const oldPrice = selectedItem.pricePerKg;

    updateProduceItem(selectedItem.id, {
      pricePerKg: newPriceVal,
    });

    const itemName = selectedItem.name.hi || selectedItem.name.en;
    setStatusMessage(`✅ #${itemNum} ${itemName} का भाव ₹${newPriceVal}/${unitLabel} सेट हो गया!`);
    setRecentUpdates((prev) => [
      {
        id: selectedItem.id,
        num: itemNum,
        name: itemName,
        oldPrice,
        newPrice: newPriceVal,
        unit: unitLabel,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 4),
    ]);

    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  // Quick Command parser: supports "#1 = 30", "1:35", "#tamatar = 40", "grapes 90"
  const handleQuickCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickCommandText.trim();
    if (!raw) return;

    // Pattern 1: #Number = Price (e.g. #1 = 40 or 1 = 40 or 1:40)
    const numMatch = raw.match(/^[#]?\s*(\d+)\s*[:=]\s*(\d+(?:\.\d+)?)$/);
    if (numMatch) {
      const targetNum = parseInt(numMatch[1], 10);
      const newRate = parseFloat(numMatch[2]);
      const targetItem = produceList[targetNum - 1];
      if (targetItem) {
        setSelectedProductId(targetItem.id);
        setInputPrice(String(newRate));
        updateProduceItem(targetItem.id, { pricePerKg: newRate });
        const name = targetItem.name.hi || targetItem.name.en;
        const unit = targetItem.pricingUnit || 'kg';
        setStatusMessage(`✅ कमांड सफल! #${targetNum} ${name} = ₹${newRate}/${unit}`);
        setQuickCommandText('');
        return;
      }
    }

    // Pattern 2: Text search name and price (e.g. "tamatar 35" or "अंगूर 80")
    const words = raw.split(/[:=\s]+/);
    if (words.length >= 2) {
      const priceStr = words[words.length - 1];
      const searchWord = words.slice(0, words.length - 1).join(' ').replace(/^[#]/, '').toLowerCase();
      const parsedRate = parseFloat(priceStr);
      if (!isNaN(parsedRate)) {
        const found = produceList.find(
          (p) =>
            p.name.hi.toLowerCase().includes(searchWord) ||
            p.name.en.toLowerCase().includes(searchWord) ||
            p.id.toLowerCase().includes(searchWord)
        );
        if (found) {
          const itemNum = itemNumberMap.get(found.id) || 1;
          setSelectedProductId(found.id);
          setInputPrice(String(parsedRate));
          updateProduceItem(found.id, { pricePerKg: parsedRate });
          const name = found.name.hi || found.name.en;
          const unit = found.pricingUnit || 'kg';
          setStatusMessage(`✅ #${itemNum} ${name} = ₹${parsedRate}/${unit} अपडेट हुआ!`);
          setQuickCommandText('');
          return;
        }
      }
    }

    setStatusMessage('⚠️ समझ नहीं आया। उदाहरण: "#1 = 30" या "tamatar 40" लिखें');
  };

  const selectedNum = itemNumberMap.get(selectedItem?.id || '') || 1;

  return (
    <div className="bg-slate-900 text-white rounded-xl border border-emerald-500/30 p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40">
              <Calculator className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>त्वरित भाव व स्लैब सेटर (Quick Price & Tier Setter)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                Live Store Sync
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            हर उत्पाद का निश्चित नंबर (#1, #2...) है। बस नंबर या नाम से भाव लिखें, 0.5kg, 1kg, 2kg, 5kg के स्लैब अपने-आप तय हो जाएँगे।
          </p>
        </div>

        {/* Shorthand Text Command Box */}
        <form onSubmit={handleQuickCommandSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickCommandText}
              onChange={(e) => setQuickCommandText(e.target.value)}
              placeholder='शॉर्टकट: "#1 = 35" या "अंगूर = 80"'
              className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-emerald-500 w-52 sm:w-64 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
          >
            <span>सेट करें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {statusMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>{statusMessage}</span>
          <span className="text-[10px] text-emerald-400 font-mono">Store Updated</span>
        </div>
      )}

      {/* Main Controls Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Step 1: Select Produce by Number or Name */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
            <span>1. उत्पाद चुनें (नंबर व नाम):</span>
            <span className="text-emerald-400 font-mono text-[10px]">#{selectedNum} सक्रिय</span>
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-emerald-500"
          >
            {produceList.map((item, idx) => {
              const num = idx + 1;
              const name = item.name.hi || item.name.en;
              const unit = item.pricingUnit || 'kg';
              return (
                <option key={item.id} value={item.id}>
                  #{num} · {name} — वर्तमान भाव: ₹{item.pricePerKg}/{unit}
                </option>
              );
            })}
          </select>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>इकाई: <b className="text-emerald-300 uppercase">{unitLabel}</b></span>
            <span>·</span>
            <span>श्रेणी: <b className="text-slate-300">{selectedItem?.category}</b></span>
            <span>·</span>
            <span>थोक मंडी भाव: <b className="text-slate-300">₹{selectedItem?.wholesalePricePerKg}</b></span>
          </div>
        </div>

        {/* Step 2: Set Base Rate */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
            2. नया भाव (प्रति {unitLabel}):
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-emerald-400 font-mono">₹</span>
            <input
              type="number"
              step="1"
              min="1"
              value={inputPrice}
              onChange={(e) => setInputPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-base font-black text-white focus:outline-emerald-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSavePrice}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-sm"
              title="Save to Master Store"
            >
              लागू करें
            </button>
          </div>

          {/* Quick Price Buttons */}
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {[20, 30, 40, 50, 60, 80, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setInputPrice(String(preset))}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700"
              >
                ₹{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Real-Time Calculated Tiers Preview (What Customer Sees) */}
        <div className="md:col-span-4 bg-slate-850 p-3 rounded-lg border border-slate-750">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
            <span>3. स्लैब कैलकुलेटर (ग्राहक को दिखेगा):</span>
            <span className="text-[10px] text-emerald-400 font-mono">#{selectedNum} {unitLabel}</span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            {computedTiers.map((tier) => (
              <div
                key={tier.label}
                className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60"
              >
                <span className="text-slate-300 font-medium">{tier.label}:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ₹{tier.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Updates History Bar */}
      {recentUpdates.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400">
          <span className="text-slate-500 font-bold shrink-0">हालिया अपडेट:</span>
          {recentUpdates.map((u, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono shrink-0 flex items-center gap-1"
            >
              <span className="text-emerald-400">#{u.num}</span>
              <span>{u.name}</span>
              <span className="text-slate-500 line-through">₹{u.oldPrice}</span>
              <span className="text-emerald-300 font-bold">₹{u.newPrice}/{u.unit}</span>
              <span className="text-[9px] text-slate-500">({u.time})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
