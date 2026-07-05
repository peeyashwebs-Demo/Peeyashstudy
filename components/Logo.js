export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#15214B" />
      <path d="M12 27V13h7.5c3.6 0 6 2.2 6 5.5s-2.4 5.5-6 5.5H16v3h-4Zm4-6.5h3.2c1.6 0 2.6-.9 2.6-2s-1-2-2.6-2H16v4Z" fill="#FFE34D" />
    </svg>
  );
}
