export const getEffectiveStock = (menuItem) => {
  if (!menuItem) return 0;
  
  let itemStock = menuItem.totalStock || 0;
  
  if (menuItem.category && (menuItem.category.stockactive || menuItem.category.isSharedStock)) {
    let catStock = menuItem.category.totalStock || 0;
    return Math.max(itemStock, catStock);
  }
  
  return itemStock;
};
