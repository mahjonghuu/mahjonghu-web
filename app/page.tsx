"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import styles from "./page.module.css";
import BookingSchedule from "./booking-schedule";
import { formatRupiah as money } from "../lib/currency";

const outlets = [
  {
    id: "senopati",
    name: "Senopati Social Club",
    city: "Jakarta",
    area: "Senopati, Jakarta Selatan",
    address: "Jl. Senopati No. 38, Jakarta Selatan",
    image: "/outlet-senopati.jpg",
    label: "THE ORIGINAL",
    description:
      "Sudut hangat di tengah kota. Tempat cerita dan permainan baik dimulai.",
    price: 75000,
    tables: 8,
    features: ["Private room", "Coffee & bites"],
  },
  {
    id: "pik",
    name: "PIK Garden House",
    city: "Jakarta",
    area: "Pantai Indah Kapuk, Jakarta Utara",
    address: "Jl. Garden House No. 12, Pantai Indah Kapuk",
    image: "/outlet-pik.jpg",
    label: "A BREATH OF FRESH AIR",
    description:
      "Suasana santai, cahaya alami, dan satu ronde lagi bersama teman.",
    price: 85000,
    tables: 6,
    features: ["Garden view", "Private room"],
  },
  {
    id: "bandung",
    name: "Dago Hideaway",
    city: "Bandung",
    area: "Dago, Bandung",
    address: "Jl. Ir. H. Juanda No. 85, Bandung",
    image: "/outlet-bandung.jpg",
    label: "YOUR LITTLE ESCAPE",
    description:
      "Udara sejuk Bandung bertemu kehangatan meja mahjong favoritmu.",
    price: 60000,
    tables: 5,
    features: ["Cozy lounge", "Coffee & bites"],
  },
];
function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

/** Public, frontend-only outlet discovery and booking preview. No reservation or payment is persisted. */
export default function Home() {
  return (
    <Suspense>
      <BookingPage />
    </Suspense>
  );
}

function BookingPage() {
  const [city, setCity] = useState("Semua kota");
  const [outletId, setOutletId] = useState(outlets[0].id);
  const outlet = outlets.find((item) => item.id === outletId)!;
  const visibleOutlets = outlets.filter(
    (item) => city === "Semua kota" || item.city === city,
  );

  function chooseOutlet(id: string) {
    setOutletId(id);
    document.getElementById("booking")?.scrollIntoView({ block: "start" });
  }

  return (
    <main className={styles.page}>
      <div className={styles.announcement}>
        A little strategy. A lot of good company. <span>Let’s play.</span>{" "}
        <span aria-hidden="true">✳</span>
      </div>
      <header className={styles.header}>
        <a href="#" className={styles.brand} aria-label="MahjongHu beranda">
          <Image
            className={styles.brandLogo}
            src="/logo-transparent.webp"
            alt="MahjongHu"
            width={120}
            height={120}
            priority
          />
        </a>
        <nav aria-label="Navigasi utama">
          <a href="#outlets">Temukan outlet</a>
          <a href="#experience">The experience</a>
          <a href="#how-it-works">Cara booking</a>
        </nav>
        <a className={styles.navCta} href="#booking">
          Let’s play <Arrow diagonal />
        </a>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.smallLine} /> YOUR NEXT FAVORITE HANGOUT
          </p>
          <h1 id="hero-title">
            Good tiles.
            <br />
            Great company.
            <br />
            <em>Your move.</em>
          </h1>
          <p className={styles.heroDescription}>
            Taruh ponselmu. Kumpulkan temanmu.
            <br />
            Temukan meja untuk obrolan panjang, tawa lepas,
            <br className={styles.desktopBreak} /> dan satu ronde lagi.
          </p>
          <a className={styles.primary} href="#booking">
            Temukan meja kamu <Arrow diagonal />
          </a>
          <div className={styles.heroNote}>
            <span className={styles.miniTiles} aria-hidden="true">
              <i>發</i>
              <i>中</i>
              <i>白</i>
            </span>
            <span>
              For the game. For the good times.
              <br />
              <b>Pemula sampai pro, semua punya tempat.</b>
            </span>
          </div>
        </div>
        <div
          className={styles.heroArt}
          role="img"
          aria-label="Ilustrasi meja mahjong hijau dengan susunan tile dan tulisan meet you at the table"
        >
          <div className={styles.artGrid} />
          <span className={styles.artTop}>THE MAHJONG SOCIAL CLUB</span>
          <div className={styles.tableRim}>
            <div className={styles.tableFelt}>
              <span className={styles.tableMark}>
                胡<span>MAHJONGHU</span>
              </span>
              <div className={styles.backTiles}>
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <div className={styles.sideTiles}>
                {Array.from({ length: 7 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <div className={styles.playTiles}>
                <i>發</i>
                <i>中</i>
                <i>
                  八<span>萬</span>
                </i>
                <i>
                  ●<br />●
                </i>
              </div>
              <div className={styles.frontTiles}>
                {["一", "二", "三", "發", "發", "中", "中", "八", "九"].map(
                  (tile, i) => (
                    <i key={i}>
                      {tile}
                      <small>{i < 3 || i > 6 ? "萬" : ""}</small>
                    </i>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className={styles.roundStamp}>
            GOOD TIMES
            <br />
            <span>發</span>
            <br />
            GREAT TILES
          </div>
          <div className={styles.artCaption}>
            Meet you
            <br />
            <em>at the table.</em>
          </div>
          <span className={styles.artBottom}>
            EST. 2024 <span>MAKE ROOM FOR PLAY ↗</span>
          </span>
        </div>
      </section>

      <BookingSchedule
        key={outlet.id}
        outlet={outlet}
        outlets={outlets}
        onOutletChange={setOutletId}
      />

      <section id="outlets" className={styles.outlets}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>DI KOTA KAMU, UNTUK CIRCLE KAMU</p>
            <h2>
              Different places.
              <br />
              <em>Same good energy.</em>
            </h2>
          </div>
          <p>
            Setiap tempat punya ceritanya.
            <br />
            Pilih suasana yang paling kamu suka.
          </p>
        </div>
        <div className={styles.filters}>
          <div role="group" aria-label="Filter kota">
            {["Semua kota", "Jakarta", "Bandung"].map((item) => (
              <button
                key={item}
                aria-pressed={city === item}
                className={city === item ? styles.activeFilter : ""}
                onClick={() => setCity(item)}
              >
                {item}
                {item === "Semua kota" && <span>3</span>}
              </button>
            ))}
          </div>
          <span aria-live="polite">
            {visibleOutlets.length} tempat untuk good times <Arrow diagonal />
          </span>
        </div>
        <div className={styles.outletGrid}>
          {visibleOutlets.map((item) => (
            <article className={styles.outletCard} key={item.id}>
              <div className={styles.outletImage}>
                <Image
                  src={item.image}
                  alt={`Inspirasi suasana interior ${item.name}`}
                  fill
                  sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"
                />
                <span className={styles.imageBadge}>
                  <span /> {item.tables} meja · demo
                </span>
                <span className={styles.imageIndex}>
                  0{outlets.indexOf(item) + 1}
                </span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>{item.label}</p>
                <h3>{item.name}</h3>
                <p className={styles.location}>
                  <span aria-hidden="true">⌖</span> {item.area}
                </p>
                <p className={styles.cardDescription}>{item.description}</p>
                <div className={styles.features}>
                  {item.features.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                  <span>4 pemain / meja</span>
                </div>
                <div className={styles.cardFooter}>
                  <div>
                    <small>Mulai dari</small>
                    <strong>
                      {money(item.price)}
                      <span> / jam</span>
                    </strong>
                  </div>
                  <button
                    onClick={() => chooseOutlet(item.id)}
                    aria-label={`Pilih ${item.name}`}
                  >
                    <Arrow diagonal />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.experience} id="experience">
        <div className={styles.experienceIntro}>
          <p className={styles.eyebrow}>MORE THAN JUST A GAME</p>
          <h2>
            Less scrolling.
            <br />
            <em>More connecting.</em>
          </h2>
          <p>
            Karena momen terbaik nggak terjadi
            <br />
            di layar. Tapi di seberang meja.
          </p>
        </div>
        <div className={styles.experienceItem}>
          <span className={styles.featureIcon}>發</span>
          <h3>Datang. Duduk. Main.</h3>
          <p>
            Meja otomatis dan tile siap main. Kamu tinggal bawa teman dan
            semangat menang.
          </p>
        </div>
        <div className={styles.experienceItem}>
          <span className={styles.featureIcon}>茶</span>
          <h3>A little sip, a little play.</h3>
          <p>
            Teman ngobrol, minuman favorit, dan suasana nyaman buat betah
            berlama-lama.
          </p>
        </div>
        <div className={styles.experienceItem}>
          <span className={styles.featureIcon}>友</span>
          <h3>New here? You’re in.</h3>
          <p>
            Baru kenalan dengan mahjong? Nggak masalah. Semua pemain mulai dari
            ronde pertama.
          </p>
        </div>
      </section>

      <section id="how-it-works" className={styles.how}>
        <div>
          <p className={styles.eyebrow}>LESS PLANNING, MORE PLAYING</p>
          <h2>
            Your table, <em>in three moves.</em>
          </h2>
        </div>
        <div className={styles.steps}>
          {[
            {
              title: "Find your spot",
              text: "Pilih outlet dan suasana favorit circle kamu.",
            },
            {
              title: "Pick your moment",
              text: "Pilih tanggal, lalu klik slot jam di satu atau beberapa meja.",
            },
            {
              title: "Bring your people",
              text: "Periksa rincian meja, jam bermain, dan estimasi pembayaran demo.",
            },
          ].map((step, index) => (
            <div key={step.title}>
              <span>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.bottomCta}>
        <span aria-hidden="true">胡</span>
        <div>
          <p>THE GROUP CHAT CAN WAIT.</p>
          <h2>The table is calling.</h2>
        </div>
        <a href="#booking">
          Let’s make a plan <Arrow diagonal />
        </a>
      </section>
      <footer className={styles.footer}>
        <a href="#" className={styles.brand} aria-label="MahjongHu beranda">
          <Image
            className={styles.brandLogo}
            src="/logo-transparent.webp"
            alt="MahjongHu"
            width={120}
            height={120}
          />
        </a>
        <p>Good tiles. Great company.</p>
        <span>
          © {new Date().getFullYear()} MahjongHu · Public booking demo
        </span>
      </footer>
    </main>
  );
}
