import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1200, // Ultra-fast speed
  timerProgressBar: true,
  showClass: {
    popup: 'animate__animated animate__fadeInRight animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutRight animate__faster'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

const themeColors = {
  primary: '#B91C1C',
  secondary: '#DA9133',
  background: '#FAF9F6',
  text: '#1A1A1A',
  error: '#B91C1C',
  success: '#16A34A',
  warning: '#DA9133'
};

export const showAlert = (options) => {
  return Swal.fire({
    icon: options.icon || 'info',
    title: options.title || '',
    text: options.text || '',
    confirmButtonColor: themeColors.primary,
    iconColor: options.icon === 'error' ? themeColors.error : 
               options.icon === 'success' ? themeColors.success : 
               themeColors.primary,
    customClass: {
      popup: 'rounded-[2.5rem] border-none shadow-2xl max-w-[400px] bg-background-card text-text-primary',
      title: 'text-xl font-black tracking-tight pt-6 text-text-primary',
      htmlContainer: 'text-[11px] font-bold opacity-60 px-6 pb-2 text-text-muted',
      confirmButton: 'rounded-xl px-8 py-3 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all mb-6'
    },
    ...options
  });
};

export const showToast = (icon, title) => {
  return Toast.fire({
    icon,
    title,
    timer: 1200, // Consistent fast speed
    iconColor: icon === 'error' ? themeColors.error : 
               icon === 'success' ? themeColors.success : 
               themeColors.primary,
    customClass: {
      popup: 'rounded-xl font-black text-[9px] tracking-widest uppercase px-6 bg-background-card text-text-primary shadow-xl border border-border/40'
    }
  });
};

export const showCartToast = (item) => {
  return Toast.fire({
    icon: 'success',
    timer: 1200, // Consistent fast speed
    iconColor: themeColors.success,
    html: `
      <div class="flex items-center gap-2.5 text-left">
        <div class="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 border border-border/10 bg-white p-0.5 shadow-sm">
          <img src="${item.image || '/placeholder-food.jpg'}" alt="${item.name}" class="w-full h-full object-contain" />
        </div>
        <div class="flex flex-col min-w-0 leading-tight">
          <span class="text-[10px] font-black uppercase tracking-wider text-text-primary truncate max-w-[120px]">${item.name}</span>
          <span class="text-[7px] font-black text-primary uppercase tracking-[0.1em] opacity-80">Added to Feast</span>
        </div>
      </div>
    `,
    customClass: {
      popup: 'rounded-xl bg-background-card text-text-primary shadow-2xl border border-border/40 px-3 py-1.5 min-w-[140px] max-w-[200px]',
      htmlContainer: 'm-0 p-0',
      icon: 'hidden'
    }
  });
};

export const showDeleteConfirmation = (title = 'Are you sure?', text = "You won't be able to revert this!") => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: themeColors.primary,
    cancelButtonColor: '#9CA3AF',
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-[2.5rem] border-none shadow-2xl p-6 max-w-[400px] bg-background-card text-text-primary',
      title: 'text-xl font-black tracking-tight text-text-primary',
      htmlContainer: 'text-[10px] font-bold opacity-60 text-text-muted',
      confirmButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all',
      cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[9px] bg-background text-text-muted hover:bg-background-muted transition-all'
    }
  });
};
