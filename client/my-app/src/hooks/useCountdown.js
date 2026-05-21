import { useState, useEffect } from 'react';
export function useCountdown(catchTime) {
  const [rem, setRem] = useState("");
  useEffect(() => {
    if (!catchTime) return;
    const tick = () => {
      const diff = 24 * 3600000 - (Date.now() - new Date(catchTime).getTime());
      if (diff <= 0) return setRem("Hết hạn");
      const h = Math.floor(diff / 3600000),
        m = Math.floor((diff % 3600000) / 60000);
      setRem(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [catchTime]);
  return rem;
}