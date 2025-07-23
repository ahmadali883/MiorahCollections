// Utility function to get the correct image URL
// Handles both Cloudinary URLs and legacy local URLs
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // If it's already a full URL (Cloudinary or other CDN), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL starting with /uploads/, construct the full URL
  if (imageUrl.startsWith('/uploads/')) {
    const IMAGE_BASE_URL = process.env.REACT_APP_API_BASE_URL.replace('/api', '');
    return `${IMAGE_BASE_URL}${imageUrl}`;
  }
  
  // Legacy case: assume it's just a filename in uploads/products/
  const IMAGE_BASE_URL = process.env.REACT_APP_API_BASE_URL.replace('/api', '');
  return `${IMAGE_BASE_URL}/uploads/products/${imageUrl}`;
};
