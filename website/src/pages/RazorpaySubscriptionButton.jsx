import { useEffect, useRef } from "react";

/**
 * Razorpay Subscription Button Component
 * MUST be inside <form> tag (Razorpay requirement)
 */
const RazorpaySubscriptionButton = () => {
  const formRef = useRef(null);

  useEffect(() => {
    if (!formRef.current) return;

    // Prevent duplicate injection
    if (formRef.current.children.length > 0) return;

    const script = document.createElement("script");
    script.src = "https://cdn.razorpay.com/static/widget/subscription-button.js";
    script.async = true;

    // Razorpay config
    script.setAttribute("data-subscription_button_id", "pl_SBkpFMurIhTVJ7");
    script.setAttribute("data-button_theme", "rzp-dark-standard");

    formRef.current.appendChild(script);
  }, []);

  return (
    <form
      ref={formRef}
      className="w-full flex justify-center items-center"
    />
  );
};

export default RazorpaySubscriptionButton;
