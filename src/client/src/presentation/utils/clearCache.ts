export const clearAllCache = () => {
  try {
    // Clear all localStorage items
    localStorage.clear();

    // Clear sessionStorage items
    sessionStorage.clear();

    // Reload the page to reset application state
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
};

export const clearApplicationDataOnly = () => {
  try {
    // Clear specific application data while preserving user preferences
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

    // Clear sessionStorage completely
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear application data:', error);
    throw error;
  }
};
