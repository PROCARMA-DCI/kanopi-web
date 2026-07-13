'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CoverageSectionProps {
  onUpload?: (other: string, price: string) => void;
}

export function CoverageSection({ onUpload }: CoverageSectionProps) {
  const [other, setOther] = useState('');
  const [price, setPrice] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onUpload?.(other, price);
  }

  return (
    <section className="coverage">
      <Image
        className="coverage__add anim-center"
        src="/icons/add.png"
        width={115}
        height={114}
        alt="add"
      />
      <p className="coverage__text anim-center">
        Any other coverage you purchased for your vehicle?
      </p>
      <div className="coverage__box anim-center">
        <form onSubmit={handleSubmit}>
          <input
            className="coverage__input coverage__input--other"
            type="text"
            placeholder="other"
            value={other}
            onChange={e => setOther(e.target.value)}
          />
          <div className="coverage__wrapper-input">
            <input
              className="coverage__input coverage__input--price"
              type="text"
              data-input
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>
          <button type="submit" className="btn coverage__btn">
            UPLOAD TO KANOPI
          </button>
        </form>
      </div>
    </section>
  );
}
