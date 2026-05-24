import { useState, useCallback } from 'react';
import { listingService } from '../services/listingService';

export function useSendMessage(profile, listing, setListing, showToast) {
  const [message,     setMessage]     = useState('');
  const [sending,     setSending]     = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const send = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    if (!profile?.id) {
      showToast('Sign in to message sellers', 'error');
      return;
    }
    if (profile.id === listing?.seller_id) {
      showToast("You can't message yourself", 'error');
      return;
    }

    setSending(true);
    try {
      await listingService.sendMessage(
        listing.seller_id,
        trimmed,
        listing.id,       
        listing.title,
      );

      setMessage('');
      setMessageSent(true);
      setListing((prev) =>
        prev ? { ...prev, inquiry_count: (prev.inquiry_count ?? 0) + 1 } : prev
      );
      showToast('Message sent!');
    } catch (err) {
      console.error('[useSendMessage] error:', err);
      showToast(err.message ?? 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  }, [message, profile, listing, setListing, showToast]);

  return { message, setMessage, sending, messageSent, send };
}