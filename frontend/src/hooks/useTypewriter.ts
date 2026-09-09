import { useState, useEffect } from 'react';

export function useTypewriter(
  text: string,
  speed: number = 38,
  startDelay: number = 600
) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;
    let index = 0;

    setDisplayed('');
    setDone(false);

    timeout = setTimeout(() => {
      interval = setInterval(() => {
        index++;
        if (index <= text.length) {
          setDisplayed(text.slice(0, index));
        } else {
          setDone(true);
          if (interval) clearInterval(interval);
        }
      }, speed);
    }, startDelay);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
