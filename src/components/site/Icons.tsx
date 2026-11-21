export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" />
    </svg>
  );
}

export function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3.5" y="6" width="17" height="12" rx="1.5" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path
        d="M8.2 4.8l1.8 1.8a1.4 1.4 0 0 1 0 2L8.6 10a11 11 0 0 0 5.4 5.4l1.4-1.4a1.4 1.4 0 0 1 2 0l1.8 1.8a1.4 1.4 0 0 1 0 2l-1.2 1.2c-.8.8-2 1.1-3.1.7A16 16 0 0 1 4.1 8.3c-.4-1.1-.1-2.3.7-3.1L6 4.8a1.4 1.4 0 0 1 2.2 0Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14.2 8.5h2.3V5.4h-2.3c-2.6 0-4.3 1.6-4.3 4.3v1.7H8v3.1h1.9V21h3.3v-6.5h2.4l.5-3.1h-2.9V9.8c0-.8.4-1.3 1-1.3Z" />
    </svg>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 4H19l-5.4 6.2L20 20h-4.6l-3.6-4.7L7.6 20H5.3l5.8-6.6L4.3 4h4.7l3.3 4.4L16.7 4Zm-1.6 14.4h1.3L8.9 5.5H7.6l7.5 12.9Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="17.1" cy="6.9" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RssIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6.4" cy="17.6" r="2" />
      <path d="M5 10.2a8.8 8.8 0 0 1 8.8 8.8h-2.6A6.2 6.2 0 0 0 5 12.8v-2.6Z" />
      <path d="M5 5.4A13.6 13.6 0 0 1 18.6 19h-2.6A11 11 0 0 0 5 8V5.4Z" />
    </svg>
  );
}
