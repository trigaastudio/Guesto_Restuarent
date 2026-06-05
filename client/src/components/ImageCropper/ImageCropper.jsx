import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Crop, Check } from 'lucide-react';
import { getCroppedImgFile } from '../../utils/cropImage';

const ImageCropper = ({ image, onCropComplete, onCancel, aspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImageFile = await getCroppedImgFile(image, croppedAreaPixels);
      onCropComplete(croppedImageFile);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="relative w-full max-w-4xl h-[60vh] sm:h-[70vh] bg-background-card rounded-[2.5rem] overflow-hidden border border-border-light shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%)', backgroundSize: '20px 20px' }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
            classes={{
              containerClassName: "rounded-[2.5rem]",
              mediaClassName: "rounded-[2.5rem]",
              cropAreaClassName: "border-2 border-white/50 rounded-lg shadow-[0_0_0_9999em_rgba(0,0,0,0.5)]"
            }}
          />
        </div>
        
        {}
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 backdrop-blur-md rounded-xl">
              <Crop size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg tracking-tight">Crop Image</h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Adjust to fit perfectly</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        {}
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center space-y-6 z-10">
          <div className="w-full max-w-sm px-4">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(e.target.value)}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">1x</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">3x</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="px-10 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2"
            >
              <Check size={18} />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
