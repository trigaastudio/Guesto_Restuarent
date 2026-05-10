import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
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
    iconColor: icon === 'error' ? themeColors.error : 
               icon === 'success' ? themeColors.success : 
               themeColors.primary,
    customClass: {
      popup: 'rounded-xl font-black text-[9px] tracking-widest uppercase px-6 bg-background-card text-text-primary shadow-xl border border-border/40'
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
