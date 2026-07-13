import Image from 'next/image';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__box">
          <div className="footer__box-left">
            <nav className="footer__nav">
              <a href="/" className="logo footer__logo">
                <Image src="/images/logo.svg" height={58} width={51} alt="Kanopi" />
              </a>
              <div className="footer__nav-link">
                <p>navigation</p>
                <ul>
                  <li><a href="#">Auto</a></li>
                  <li><a href="#">Our Planet</a></li>
                </ul>
              </div>
            </nav>
            <nav className="footer__charities">
              <p>Charities</p>
              <ul>
                <li><a href="#">WILD Foundation</a></li>
                <li><a href="#">World Wildlife Fund</a></li>
                <li><a href="#">Wildlife Conservation Society</a></li>
                <li><a href="#">4Ocean</a></li>
                <li><a href="#">PADI</a></li>
                <li><a href="#">Durrell Wildlife Conservation</a></li>
              </ul>
            </nav>
          </div>
          <div className="footer__right">
            <div className="footer__app">
              <p>get the app</p>
            </div>
            <div className="footer__follow">
              <p>follow us</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
