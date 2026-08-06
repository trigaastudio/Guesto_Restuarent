export const getEffectiveStock = (menuItem) => {
  if (!menuItem) return 0;
  
  // Check if any add-on (includedItem) in any variant is out of stock
  if (menuItem.variants && !menuItem.isCombo) {
    const hasOutOfStockAddon = menuItem.variants.some(variant => 
      variant.includedItems && variant.includedItems.some(inc => {
        const addon = inc.menuItem;
        if (addon && typeof addon === 'object' && addon._id) {
          // Recursive check for the addon's stock
          // We must pass a flag to prevent infinite recursion just in case, but addon doesn't typically have addons.
          let addonStock = addon.totalStock || 0;
          if (addon.category && (addon.category.stockactive || addon.category.isSharedStock)) {
            let catStock = addon.category.totalStock || 0;
            addonStock = Math.max(addonStock, catStock);
          }
          return addonStock <= 0;
        }
        return false;
      })
    );
    if (hasOutOfStockAddon) return 0;
  }
  
  let itemStock = menuItem.totalStock || 0;
  
  if (menuItem.category && (menuItem.category.stockactive || menuItem.category.isSharedStock)) {
    let catStock = menuItem.category.totalStock || 0;
    return Math.max(itemStock, catStock);
  }
  
  return itemStock;
};

export const checkCategoryTiming = (category) => {
  if (!category || !category.startTime || !category.endTime) return false;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = category.startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const [endHour, endMin] = category.endTime.split(':').map(Number);
  const endMinutes = endHour * 60 + endMin;
  
  if (startMinutes <= endMinutes) {
    return !(currentMinutes >= startMinutes && currentMinutes <= endMinutes); // true means closed
  } else {
    return !(currentMinutes >= startMinutes || currentMinutes <= endMinutes);
  }
};
