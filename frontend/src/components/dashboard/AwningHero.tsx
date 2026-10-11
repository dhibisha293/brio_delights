import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

interface AwningHeroProps {
  totalOrders: number;
  pendingCount: number;
  onNewOrder?: () => void;
}

export default function AwningHero({
  totalOrders,
  pendingCount,
  onNewOrder,
}: AwningHeroProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayName = user?.display_name || "Admin";
  const bakeryName = user?.bakery_name || "Brio Delights";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const message = useMemo(() => {
    if (totalOrders === 0) {
      return `Welcome to ${bakeryName}. Add your first order to get started!`;
    }
    if (pendingCount === 0) {
      return `All ${totalOrders} orders are completed and nothing is waiting. ${bakeryName} is caught up.`;
    }
    return `${pendingCount} of ${totalOrders} order${totalOrders === 1 ? "" : "s"} ${
      pendingCount === 1 ? "is" : "are"
    } pending right now. Let's bake!`;
  }, [totalOrders, pendingCount, bakeryName]);

  // Generate the fixed sprinkles matching seed in design reference
  const sprinkles = useMemo(() => {
    const cols = ["#FFF7EC", "#FFB3C7", "#3DB88C", "#FFB482", "#FFFFFF"];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const items = [];
    for (let i = 0; i < 22; i++) {
      items.push({
        left: `${(46 + rnd() * 52).toFixed(1)}%`,
        top: `${(8 + rnd() * 78).toFixed(1)}%`,
        color: cols[Math.floor(rnd() * cols.length)],
        rotate: `${Math.round(rnd() * 180)}deg`,
        duration: `${(6 + rnd() * 6).toFixed(1)}s`,
        delay: `${(-rnd() * 8).toFixed(1)}s`,
      });
    }
    return items;
  }, []);

  const handleNewOrderClick = () => {
    const btn = buttonRef.current;
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (btn && !reduceMotion) {
      let seed = 7;
      const rnd = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      const rect = btn.getBoundingClientRect();
      const x0 = rect.left + rect.width / 2;
      const y0 = rect.top + rect.height / 2;
      const burstCols = ["#FFF7EC", "#FF5C8A", "#FFB3C7", "#3DB88C", "#FFB482"];

      for (let i = 0; i < 26; i++) {
        const p = document.createElement("span");
        const dx = (rnd() - 0.5) * 300;
        const up = 60 + rnd() * 110;
        const fall = 40 + rnd() * 90;
        const rot = (rnd() - 0.5) * 720;
        p.style.cssText = `position:fixed;z-index:9999;pointer-events:none;width:6px;height:16px;border-radius:3px;left:${x0}px;top:${y0}px;background:${
          burstCols[i % burstCols.length]
        }`;
        document.body.appendChild(p);

        p.animate(
          [
            { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
            {
              transform: `translate(${dx * 0.7}px, ${-up}px) rotate(${rot * 0.6}deg)`,
              opacity: 1,
              offset: 0.45,
            },
            { transform: `translate(${dx}px, ${fall}px) rotate(${rot}deg)`, opacity: 0 },
          ],
          {
            duration: 1000 + rnd() * 500,
            easing: "cubic-bezier(.2,.7,.4,1)",
          }
        ).onfinish = () => {
          p.remove();
        };
      }
    }

    if (onNewOrder) {
      onNewOrder();
    } else {
      setTimeout(() => {
        navigate("/orders");
      }, 250);
    }
  };

  return (
    <div className="hero">
      <div className="sprinkles" id="sprinkles" aria-hidden="true">
        {sprinkles.map((s, idx) => (
          <i
            key={idx}
            style={
              {
                left: s.left,
                top: s.top,
                "--c": s.color,
                "--r": s.rotate,
                "--d": s.duration,
                "--dl": s.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="hero-text">
        <h1 id="greet">{`${greeting}, ${displayName}`}</h1>
        <p>{message}</p>
      </div>
      <button
        ref={buttonRef}
        className="cta"
        id="new-order"
        type="button"
        onClick={handleNewOrderClick}
      >
        <svg className="icon">
          <use href="#i-plus" />
        </svg>
        New order
      </button>
    </div>
  );
}
