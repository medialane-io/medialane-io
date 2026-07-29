/** Standard Google "G" mark — used only to label the "Sign in with Google" entry point. */
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.41 3.63v3h3.9c2.28-2.1 3.56-5.2 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.9-3c-1.08.73-2.46 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.92H1.28v3.09C3.26 21.3 7.32 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.34c-.24-.73-.38-1.5-.38-2.34s.14-1.61.38-2.34V6.57H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.43l4.03-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.32 0 3.26 2.7 1.28 6.57l4.03 3.09C6.25 6.84 8.89 4.75 12 4.75Z"
      />
    </svg>
  );
}
