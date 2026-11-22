import React, { useState, useEffect } from 'react';
import { Camera, Upload, Link, Check, X, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ProductImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    image: string;
    type: 'produce' | 'accessory';
    category?: string;
  } | null;
  onSaveImage: (productId: string, newImageUrl: string, productType: 'produce' | 'accessory') => void;
}

export const ProductImageUploaderModal: React.FC<ProductImageUploaderModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaveImage,
}) => {
  const [imageUrl, setImageUrl] = useState<string>(product?.image || '');
  const [activeMode, setActiveMode] = useState<'upload' | 'url' | 'samples'>('upload');
  const [previewError, setPreviewError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (product) {
      setImageUrl(product.image || '');
      setPreviewError(false);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Handle local file upload (camera or gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          setPreviewError(false);
          setErrorMessage('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      setErrorMessage('कृपया फोटो चुनें या URL दर्ज करें');
      return;
    }
    setErrorMessage('');
    onSaveImage(product.id, trimmed, product.type);
    setSuccessMessage('✓ फोटो सफलतापूर्वक अपडेट हो गई!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  const sampleProduceImages = [
    { label: 'ताज़ा बटन मशरूम', url: '/assets/images/fresh_button_mushrooms.jpg' },
    { label: 'लाल शिमला मिर्च (Red)', url: '/assets/images/fresh_red_bell_pepper.jpg' },
    { label: 'पीली शिमला मिर्च (Yellow)', url: '/assets/images/fresh_yellow_bell_pepper.jpg' },
    { label: 'हरी शिमला मिर्च (Green)', url: '/assets/images/fresh_polyhouse_capsicum.jpg' },
    { label: 'ताज़ी पालक गड्डी', url: '/assets/images/fresh_palak_basket_1793423367076.jpg' },
    { label: 'ताज़ी मेथी जुडी', url: '/assets/images/fresh_desi_methi.jpg' },
    { label: 'मीठा तरबूज', url: '/assets/images/fresh_sweet_tarbooj.jpg' },
    { label: 'ताज़ा अनन्नास', url: '/assets/images/fresh_kew_ananas.jpg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {product.type === 'produce' ? 'सब्ज़ी / फल फोटो मैनेजर' : 'मोबाइल एक्सेसरीज़ फोटो मैनेजर'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium truncate max-w-sm">
              {product.name} ({product.id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Live Preview */}
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
            {imageUrl && !previewError ? (
              <img
                src={imageUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
                <span className="text-xs font-semibold">कोई फोटो नहीं या लोड नहीं हो सकी</span>
                <span className="text-[10px] text-slate-500 mt-1">कैमरा से फोटो खींचें या URL दर्ज करें</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
              लाइव प्रीव्यू · {product.name}
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>कैमरा / फाइल अपलोड</span>
            </button>
            <button
              onClick={() => setActiveMode('url')}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'url'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>फोटो URL लिंक</span>
            </button>
            {product.type === 'produce' && (
              <button
                onClick={() => setActiveMode('samples')}
                className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === 'samples'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>सत्यापित नमूने</span>
              </button>
            )}
          </div>

          {/* Mode: Upload / Camera */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all text-center">
                <Camera className="w-8 h-8 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  दुकान या मंडी से लाइव फोटो खींचें या गैलरी से चुनें
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  (JPG, PNG, WebP समर्थित)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 <strong>एडमिन टिप:</strong> जब आप किसी दुकान या एपीएमसी वाशी शेड में जाएँ, तो मोबाइल से सीधी फोटो खींचकर यहाँ अपलोड करें। वह फ़ोटो तुरंत ऐप में दिखने लगेगी।
              </p>
            </div>
          )}

          {/* Mode: Web URL */}
          {activeMode === 'url' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                वेब इमेज URL दर्ज करें:
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewError(false);
                }}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
              />
              <span className="text-[10px] text-slate-500">
                (Google Drive, Unsplash, Cloudinary, या किसी भी डायरेक्ट इमेज लिंक का उपयोग करें)
              </span>
            </div>
          )}

          {/* Mode: Sample Verified Mandi Assets */}
          {activeMode === 'samples' && (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {sampleProduceImages.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageUrl(s.url);
                    setPreviewError(false);
                  }}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    imageUrl === s.url
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <img src={s.url} alt={s.label} className="w-10 h-10 object-cover rounded shrink-0" />
                  <span className="text-xs text-slate-800 dark:text-slate-200 leading-tight truncate">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold text-center animate-in fade-in">
              {successMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg transition-colors"
          >
            रद्द करें
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>💾 फोटो सहेजें (Save Image)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
