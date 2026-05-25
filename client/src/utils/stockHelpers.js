export const getEffectiveStock = (menuItem) => {
  if (!menuItem) return 0;
  if (menuItem.category && menuItem.category.isSharedStock) {
    return menuItem.category.totalStock || 0;
  }
  return menuItem.totalStock || 0;
};
