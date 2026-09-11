"use client";

import { useEffect, useState } from "react";
import styles from "./testimonial-carousel.module.css";

type PublicTestimonial = { id: string; customerName: string; content: string; rating: number; isActive: boolean };

export function TestimonialCarousel({ testimonials }: { testimonials: PublicTestimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTestimonial = testimonials[activeIndex];

  useEffect(() => {
    if (testimonials.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % testimonials.length), 6500);
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  if (!activeTestimonial) return <p className={styles.author}>More guest notes coming soon.</p>;
  return <div className={styles.carousel}><div className={styles.slides}>{testimonials.map((testimonial, index) => <article aria-hidden={index !== activeIndex} className={`${styles.slide} ${index === activeIndex ? styles.slideActive : ""}`} key={testimonial.id}><div aria-label={`${testimonial.rating} out of 5 stars`} className={styles.stars} role="img">{[1, 2, 3, 4, 5].map((star) => <span aria-hidden="true" className={star > testimonial.rating ? styles.starEmpty : undefined} key={star}>★</span>)}</div><blockquote className={styles.quote}>“{testimonial.content}”</blockquote><p className={styles.author}>— {testimonial.customerName}</p></article>)}</div>{testimonials.length > 1 ? <div aria-label="Choose a testimonial" className={styles.controls} role="group">{testimonials.map((testimonial, index) => <button aria-label={`Show testimonial from ${testimonial.customerName}`} aria-pressed={index === activeIndex} className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`} key={testimonial.id} onClick={() => setActiveIndex(index)} type="button" />)}</div> : null}</div>;
}
