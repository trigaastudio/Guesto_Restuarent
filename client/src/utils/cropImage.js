export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    
    if (!url.startsWith('data:')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}


export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  const imageOffsetX = safeArea / 2 - image.width * 0.5;
  const imageOffsetY = safeArea / 2 - image.height * 0.5;

  ctx.drawImage(image, imageOffsetX, imageOffsetY);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;
  
  croppedCtx.clearRect(0, 0, croppedCanvas.width, croppedCanvas.height);

  croppedCtx.drawImage(
    canvas,
    imageOffsetX + pixelCrop.x,
    imageOffsetY + pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => {
      resolve(URL.createObjectURL(file));
    }, 'image/png');
  });
}

export async function getCroppedImgFile(imageSrc, pixelCrop, rotation = 0, fileName = 'cropped_image.png') {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  
  if (rotation !== 0) {
    const safeArea = Math.max(image.width, image.height) * 2;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = safeArea;
    tempCanvas.height = safeArea;

    tempCtx.translate(safeArea / 2, safeArea / 2);
    tempCtx.rotate(getRadianAngle(rotation));
    tempCtx.translate(-safeArea / 2, -safeArea / 2);
    tempCtx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);

    ctx.drawImage(
      tempCanvas,
      safeArea / 2 - image.width / 2 + pixelCrop.x,
      safeArea / 2 - image.height / 2 + pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  } else {
    
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(new File([blob], fileName, { type: 'image/png' }));
    }, 'image/png');
  });
}
