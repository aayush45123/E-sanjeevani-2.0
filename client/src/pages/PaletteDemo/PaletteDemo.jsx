import styles from "./PaletteDemo.module.css";

export default function PaletteDemo() {
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <h1 className={styles.logo}>MyBrand</h1>
        <button className={styles.primaryBtn}>Login</button>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h2>Design System Preview</h2>
        <p>Testing your global color palette in real UI components</p>
        <div className={styles.heroBtns}>
          <button className={styles.primaryBtn}>Get Started</button>
          <button className={styles.secondaryBtn}>Explore</button>
        </div>
      </section>

      {/* Cards Section */}
      <section className={styles.cards}>
        <div className={styles.card}>
          <h3>Green Card</h3>
          <p>Primary success/accent usage</p>
        </div>

        <div className={styles.cardAlt}>
          <h3>Orange Card</h3>
          <p>CTA / Highlight color</p>
        </div>

        <div className={styles.cardPurple}>
          <h3>Purple Card</h3>
          <p>Fun / secondary accent</p>
        </div>
      </section>

      {/* Info Section */}
      <section className={styles.info}>
        <div className={styles.infoBox}>
          <h4>Typography</h4>
          <p>This uses your font + spacing system.</p>
        </div>

        <div className={styles.infoBoxDark}>
          <h4>Dark Mode Block</h4>
          <p>Testing contrast on dark background.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 MyBrand UI Test</p>
      </footer>
    </div>
  );
}
