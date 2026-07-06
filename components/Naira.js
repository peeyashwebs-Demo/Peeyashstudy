// The Naira symbol (₦) isn't included in the "latin" subset our custom fonts load,
// which forces an ugly mid-line font fallback. This component pins currency text to
// the device's native system font — which every Nigerian phone/OS renders correctly —
// so the symbol always looks clean instead of falling back unpredictably.

export default function Naira({ amount, className = "" }) {
  const formatted = typeof amount === "number" ? amount.toLocaleString() : amount;
  return (
    <span className={`font-currency ${className}`}>
      ₦{formatted}
    </span>
  );
}
