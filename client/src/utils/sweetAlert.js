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
  primary: '#C96A0A',
  background: '#F6F1EA',
  text: '#2D2D2D',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#E88A1A'
};

export const showAlert = (options) => {
  const isDarkMode = document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark') ||
                     document.querySelector('[data-theme="dark"]');

  return Swal.fire({
    icon: options.icon || 'info',
    title: options.title || '',
    text: options.text || '',
    background: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    color: isDarkMode ? '#F5F5F5' : '#2D2D2D',
    confirmButtonColor: themeColors.primary,
    iconColor: options.icon === 'error' ? themeColors.error : 
               options.icon === 'success' ? themeColors.success : 
               themeColors.primary,
    customClass: {
      popup: 'rounded-2xl border border-border-light shadow-2xl',
      title: 'text-xl font-bold',
      confirmButton: 'px-6 py-2 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all'
    },
    ...options
  });
};

export const showToast = (icon, title) => {
  const isDarkMode = document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark') ||
                     document.querySelector('[data-theme="dark"]');

  return Toast.fire({
    icon,
    title,
    background: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    color: isDarkMode ? '#F5F5F5' : '#2D2D2D',
    iconColor: icon === 'error' ? themeColors.error : 
               icon === 'success' ? themeColors.success : 
               themeColors.primary,
  });
};

export const showDeleteConfirmation = (title = 'Are you sure?', text = "You won't be able to revert this!") => {
  const isDarkMode = document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark') ||
                     document.querySelector('[data-theme="dark"]');

  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: themeColors.error,
    cancelButtonColor: '#9CA3AF',
    confirmButtonText: 'Yes, delete it!',
    background: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    color: isDarkMode ? '#F5F5F5' : '#2D2D2D',
    customClass: {
      popup: 'rounded-2xl border border-border-light shadow-2xl',
      title: 'text-xl font-bold',
      confirmButton: 'px-6 py-2 rounded-xl font-semibold transition-all',
      cancelButton: 'px-6 py-2 rounded-xl font-semibold transition-all'
    }
  });
};
