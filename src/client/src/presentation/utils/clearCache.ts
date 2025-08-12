export const clearAllCache = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
};

export const clearApplicationDataOnly = () => {
  try {
    const keysToRemove = [
      'visual-programming-nodes',
      'visual-programming-edges',
      'visual-programming-console-messages',
      'visual-programming-console-visibility',
      'seen_tutorials',
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear application data:', error);
    throw error;
  }
};
