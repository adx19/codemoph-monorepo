import { useEffect, useRef } from "react";

/**
 * Razorpay Subscription Button Component
 * Injects Razorpay's official subscription widget safely into React
 */
const RazorpaySubscriptionButton = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Prevent duplicate injection
    if (!containerRef.current) return;
    if (containerRef.current.children.length > 0) return;

    const script = document.createElement("script");
    script.src = "https://cdn.razorpay.com/static/widget/subscription-button.js";
    script.async = true;

    // Razorpay config
    script.setAttribute("data-subscription_button_id", "pl_SBkpFMurIhTVJ7");
    script.setAttribute("data-button_theme", "rzp-dark-standard");

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-center"
    />
  );
};

export default RazorpaySubscriptionButton;
