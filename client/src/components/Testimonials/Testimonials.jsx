// Testimonials.jsx — Clean minimal testimonial cards
import React from "react";
import styles from "./Testimonials.module.css";

const testimonials = [
  {
    id: 1,
    name: "Aanya Patel",
    role: "Software Engineer, Mumbai",
    avatar: "AP",
    grad: "#5b5bd6",
    rating: 5,
    quote: "I had severe chest pain at midnight. Within 8 minutes I was in a video call with a cardiologist. The AI triage was incredibly accurate — it flagged the right symptoms immediately.",
    tag: "Emergency Care",
  },
  {
    id: 2,
    name: "Dr. Rohan Mehta",
    role: "General Practitioner, Delhi",
    avatar: "RM",
    grad: "#0284c7",
    rating: 5,
    quote: "The doctor dashboard is exceptional. I manage my schedule, see patient histories, and track analytics — all from one clean interface. My patient volume grew 40% in the first month.",
    tag: "Doctor Experience",
  },
  {
    id: 3,
    name: "Sunita Krishnamurthy",
    role: "Retired Teacher, Bangalore",
    avatar: "SK",
    grad: "#059669",
    rating: 5,
    quote: "I'm 67 and not great with technology, but eSanjeevani was simple enough for me. After the first time my daughter helped, I did everything myself. The doctors are kind and professional.",
    tag: "Ease of Use",
  },
];

const Stars = ({ count }) => (
  <div className={styles.stars}>
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </div>
);

const Testimonials = () => (
  <section className={styles.section} id="testimonials">
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Testimonials</p>
        <h2 className={styles.title}>Trusted by patients and doctors across India.</h2>
      </div>
      <div className={styles.grid}>
        {testimonials.map(t => (
          <div key={t.id} className={styles.card}>
            <Stars count={t.rating} />
            <p className={styles.quote}>{t.quote}</p>
            <div className={styles.footer}>
              <div className={styles.avatar} style={{ background: t.grad }}>{t.avatar}</div>
              <div>
                <div className={styles.name}>{t.name}</div>
                <div className={styles.role}>{t.role}</div>
              </div>
              <span className={styles.tag}>{t.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
