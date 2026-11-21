import { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle2, UploadCloud, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { request } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Kyc() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  
  const [formData, setFormData] = useState({
    citizenship: "",
    fullName: "",
    documentNumber: ""
  });
  
  const [photos, setPhotos] = useState({
    front: null,
    back: null,
    selfie: null
  });

  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (user?.status === "Verified") {
      setStatus("verified");
    } else if (user?.status === "Pending") {
      setStatus("pending");
    } else {
      setStatus("idle");
    }
  }, [user?.status]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1200px
          const MAX_DIM = 1200;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setPhotos(prev => ({ ...prev, [type]: compressedBase64 }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photos.front || !photos.back || !photos.selfie) {
      alert("Будь ласка, завантажте всі три фотографії");
      return;
    }

    setStatus("loading");
    try {
      await request("/api/session/kyc", { 
        method: "POST",
        body: JSON.stringify({
          citizenship: formData.citizenship,
          full_name: formData.fullName,
          document_number: formData.documentNumber,
          front_image: photos.front,
          back_image: photos.back,
          selfie_image: photos.selfie
        })
      });
      setStatus("pending");
      fetchUser();
    } catch (err) {
      console.error(err);
      setStatus("idle");
      alert(err.message || "Помилка верифікації");
    }
  };

  const isVerified = status === "verified";
  const isPending = status === "pending";
  const isReadOnly = isVerified || isPending || status === "loading";

  return (
    <div className="flex flex-col h-full bg-app-bg text-app-text py-4 overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="flex items-center mb-8 relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-medium text-app-text/90 mx-auto pr-8">Початкова верифікація</h1>
      </div>

      {/* Title */}
      <div className="flex items-start justify-between mb-8 relative z-10 px-1 border-b border-app-border/10 pb-6">
        <h2 className="text-[28px] font-medium leading-tight max-w-[200px]">Верифікація особи</h2>
        {isVerified && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex items-center gap-2 mt-2"
          >
            <CheckCircle2 size={18} className="text-[#32C776]" />
            <span className="text-sm font-medium text-app-text w-20 leading-tight">Перевірку пройдено</span>
          </motion.div>
        )}
        {isPending && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex items-center gap-2 mt-2"
          >
            <Loader2 size={18} className="text-yellow-500 animate-spin" />
            <span className="text-sm font-medium text-app-text w-20 leading-tight">Очікує перевірки</span>
          </motion.div>
        )}
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10 px-1 pb-10">
        <div>
          <label className="block text-[13px] text-app-text/80 mb-2 font-medium">Громадянство</label>
          <input 
            name="citizenship"
            value={formData.citizenship}
            onChange={handleInputChange}
            disabled={isReadOnly}
            placeholder="Наприклад: ua"
            className="w-full bg-app-panel border border-transparent rounded-lg p-3.5 text-app-text/90 text-sm focus:border-nx-lime focus:outline-none transition-colors disabled:opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-[13px] text-app-text/80 mb-2 font-medium">Повне ім'я</label>
          <input 
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled={isReadOnly}
            placeholder="Ваше повне ім'я"
            className="w-full bg-app-bg border border-app-border/10 rounded-lg p-3.5 text-app-text/90 text-sm focus:border-nx-lime focus:outline-none transition-colors disabled:opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-[13px] text-app-text/80 mb-2 font-medium">Номер документа / паспорта</label>
          <input 
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleInputChange}
            disabled={isReadOnly}
            placeholder="Введіть номер документа"
            className="w-full bg-app-bg border border-app-border/10 rounded-lg p-3.5 text-app-text/90 text-sm focus:border-nx-lime focus:outline-none transition-colors disabled:opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-[13px] text-app-text/80 mb-4 font-medium">Фото документа / Завантажити паспорт</label>
          <div className="grid grid-cols-3 gap-3">
            <PhotoUploadBlock 
              id="front" 
              label="Передня сторона документа" 
              photo={photos.front} 
              onUpload={(e) => handlePhotoUpload(e, 'front')} 
              disabled={isReadOnly}
            />
            <PhotoUploadBlock 
              id="back" 
              label="Зворотна сторона документа" 
              photo={photos.back} 
              onUpload={(e) => handlePhotoUpload(e, 'back')} 
              disabled={isReadOnly}
            />
            <PhotoUploadBlock 
              id="selfie" 
              label="Фото з документом у руках" 
              photo={photos.selfie} 
              onUpload={(e) => handlePhotoUpload(e, 'selfie')} 
              disabled={isReadOnly}
            />
          </div>
        </div>

        {!isVerified && !isPending && (
          <button 
            type="submit" 
            disabled={status === "loading"}
            className="w-full mt-8 py-4 bg-nx-lime text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Обробка...
              </>
            ) : "Надіслати на перевірку"}
          </button>
        )}
      </form>
    </div>
  );
}

function PhotoUploadBlock({ id, label, photo, onUpload, disabled }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <label htmlFor={id} className={`aspect-[4/3] w-full bg-app-panel border border-dashed ${photo ? 'border-transparent p-1' : 'border-app-border/20 p-2'} rounded-lg overflow-hidden flex flex-col items-center justify-center relative cursor-pointer hover:border-nx-lime transition-colors ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        {photo ? (
          <img src={photo} alt={label} className="w-full h-full object-cover opacity-90 rounded" />
        ) : (
          <>
            <UploadCloud size={24} className="text-app-text/40 mb-1" />
            <span className="text-[10px] text-app-text/40">Завантажити</span>
          </>
        )}
        <input 
          type="file" 
          id={id} 
          accept="image/*" 
          className="hidden" 
          onChange={onUpload}
          disabled={disabled}
        />
      </label>
      <span className="text-[10px] text-center text-app-text/60 leading-[1.2]">{label}</span>
    </div>
  );
}
