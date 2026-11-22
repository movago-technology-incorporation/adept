// Where clients leave a public review. Set NEXT_PUBLIC_REVIEW_URL to the Google Business "Ask for reviews" link
// (Google Business Profile → Ask for reviews → copy link). Until then, clients land on the Google Maps listing.
export function reviewUrl() {
  return (
    process.env.NEXT_PUBLIC_REVIEW_URL?.trim() ||
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Adept Bookkeeping and Tax Services Calgary")
  );
}
