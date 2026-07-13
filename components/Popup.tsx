'use client';

import Image from 'next/image';
import { useState } from 'react';

const charities = [
  { src: '/icons/popup-logo-1.svg', width: 229, height: 66 },
  { src: '/icons/popup-logo-2.svg', width: 51,  height: 75 },
  { src: '/icons/popup-logo-3.svg', width: 239, height: 67 },
  { src: '/icons/popup-logo-4.svg', width: 101, height: 62 },
  { src: '/icons/popup-logo-5.svg', width: 218, height: 67 },
  { src: '/icons/popup-logo-6.svg', width: 53,  height: 72 },
  { src: '/icons/popup-logo-7.svg', width: 56,  height: 72 },
];

interface PopupProps {
  isOpen: boolean;
  variant: 'charity' | 'thankyou';
  price?: string;
  other?: string;
  onClose: () => void;
  onSubmit?: (name: string, charity: number) => void;
}

export function Popup({ isOpen, variant, price, other, onClose, onSubmit }: PopupProps) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<number | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected === null) return;
    onSubmit?.(name, selected);
  }

  return (
    <div className={`popup${isOpen ? ' is-open' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="popup__box">
        {variant === 'charity' ? (
          <>
            <h2 className="popup__title">Select Your Charity.</h2>
            <p className="popup__text">
              By submitting your sales info you are helping preserve our planet&apos;s ecosystems
              and reshaping how insurance is done.
            </p>

            <div className="popup__list">
              {charities.map((c, i) => (
                <Image
                  key={c.src}
                  className={`popup__item${selected === i ? ' is-selected' : ''}`}
                  src={c.src}
                  width={c.width}
                  height={c.height}
                  alt={`Charity ${i + 1}`}
                  onClick={() => setSelected(i)}
                />
              ))}
            </div>

            <form className="popup__form" onSubmit={handleSubmit}>
              <input
                className="popup__input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <input type="hidden" name="price" value={price ?? ''} />
              <input type="hidden" name="other" value={other ?? ''} />
              <button type="submit" className="btn popup__submit">
                SUBMIT
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="popup__title">Thank You!</h2>
            <p className="popup__text popup-2__text">
              By submitting your sales info you are helping preserve our planet&apos;s ecosystems
              and reshaping how insurance is done.
            </p>
            <Image
              className="popup-2__logo"
              src="/images/logo-2.svg"
              height={95}
              width={306}
              alt="Kanopi"
            />
            <Image
              className="popup-2__img"
              src="/images/thank.svg"
              height={247}
              width={247}
              alt="Thank you"
            />
          </>
        )}
      </div>
    </div>
  );
}
