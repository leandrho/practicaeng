export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <p className="site-footer__text">© {year} LeanDev</p>
    </footer>
  );
}
