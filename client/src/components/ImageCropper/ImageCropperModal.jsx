import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const ImageCropperModal = ({ isOpen, image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
      canvas.toBlob((file) => {
        resolve(URL.createObjectURL(file));
      }, 'image/jpeg');
    });
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      onCropComplete(file);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-background-card w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col h-[80vh] md:h-[70vh]">
        
        {}
        <div className="p-6 md:p-8 bg-primary text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black tracking-tight">Perfect Your Profile</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Crop and scale your image</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {}
        <div className="flex-1 relative bg-background-muted/30 m-4 md:m-8 rounded-[2rem] overflow-hidden border border-border/40">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            cropShape="round"
            showGrid={false}
          />
        </div>

        {}
        <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-6 shrink-0">
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            {}
            <div className="flex-1 flex items-center gap-4">
              <ZoomOut size={16} className="text-text-muted" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="flex-1 h-1.5 bg-background-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
              <ZoomIn size={16} className="text-text-muted" />
            </div>

            {}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setRotation((r) => r - 90)}
                className="p-3 bg-background-muted hover:bg-primary/10 text-text-primary hover:text-primary rounded-xl transition-all active:scale-90"
                title="Rotate Left"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                onClick={() => setRotation((r) => r + 90)}
                className="p-3 bg-background-muted hover:bg-primary/10 text-text-primary hover:text-primary rounded-xl transition-all active:scale-90 scale-x-[-1]"
                title="Rotate Right"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-8 py-4 rounded-2xl bg-background-muted text-text-primary font-black text-xs uppercase tracking-widest hover:bg-border/40 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
            >
              <Check size={18} strokeWidth={3} /> Save Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
