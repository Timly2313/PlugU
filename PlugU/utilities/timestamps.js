export const formatTimestamp = (timestamp) => {
  try {
    const now = new Date();
    const postDate = new Date(timestamp);

    if (isNaN(postDate.getTime())) return "Recently";

    const diffInMs = now - postDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  } catch (error) {
    return "Recently";
  }
};

export const  calculateProgress= (startDate, endDate, currentDate) =>{
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const current = new Date(currentDate).getTime();
  
  const totalDuration = end - start;
  const elapsedDuration = current - start;
  
  const percentage = (elapsedDuration / totalDuration) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}
