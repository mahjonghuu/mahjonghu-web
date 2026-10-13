"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import styles from "./page.module.css";
import BookingSchedule from "./booking-schedule";
import { formatRupiah as money } from "../lib/currency";
import { apiRequest } from "../lib/api";

type OutletRecord = {
  id: string;
  name: string;
  city: string;
  address: string;
  openingHour: number;
  closingHour: number;
};
type TableRecord = { id: string; outletId: string; name: string; rate: number };
type Outlet = OutletRecord & {
  tables: TableRecord[];
  price: number;
  image: string;
};

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

/** Public outlet discovery and live availability preview. No reservation or payment is persisted. */
export default function Home() {
  return (
    <Suspense>
      <BookingPage />
    </Suspense>
  );
}

function BookingPage() {
  const [city, setCity] = useState("Semua kota");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletId, setOutletId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    Promise.all([
      apiRequest<OutletRecord[]>("/outlets/public"),
      apiRequest<TableRecord[]>("/tables/public"),
    ])
      .then(([records, tables]) => {
        if (!current) return;
        const loaded = records.map((record, index) => {
          const outletTables = tables.filter(
            (table) => table.outletId === record.id,
          );
          return {
            ...record,
            tables: outletTables,
            price: outletTables.length
              ? Math.min(...outletTables.map((table) => table.rate))
              : 0,
            image: [
              "/outlet-senopati.jpg",
              "/outlet-pik.jpg",
              "/outlet-bandung.jpg",
            ][index % 3],
          };
        });
        setOutlets(loaded);
        let storedOutletId = "";
        try {
          storedOutletId =
            JSON.parse(
              sessionStorage.getItem("mahjonghu:booking-state") ?? "null",
            )?.outletId ?? "";
        } catch {
          sessionStorage.removeItem("mahjonghu:booking-state");
        }
        setOutletId(
          loaded.some((item) => item.id === storedOutletId)
            ? storedOutletId
            : (loaded[0]?.id ?? ""),
        );
      })
      .catch(() => {
        if (current)
          setError("Data outlet belum dapat dimuat. Coba lagi nanti.");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const outlet = outlets.find((item) => item.id === outletId);
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

      {outlet && (
        <BookingSchedule
          key={outlet.id}
          outlet={{
            id: outlet.id,
            name: outlet.name,
            address: outlet.address,
            tables: outlet.tables.length,
            tableIds: outlet.tables.map((table) => table.id),
            tableNames: outlet.tables.map((table) => table.name),
            tableRates: outlet.tables.map((table) => table.rate),
            price: outlet.price,
            openingHour: outlet.openingHour,
            closingHour: outlet.closingHour,
          }}
          outlets={outlets.map((item) => ({
            id: item.id,
            name: item.name,
            address: item.address,
            tables: item.tables.length,
            tableIds: item.tables.map((table) => table.id),
            tableNames: item.tables.map((table) => table.name),
            tableRates: item.tables.map((table) => table.rate),
            price: item.price,
            openingHour: item.openingHour,
            closingHour: item.closingHour,
          }))}
          onOutletChange={setOutletId}
        />
      )}

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
            {["Semua kota", ...new Set(outlets.map((item) => item.city))].map(
              (item) => (
                <button
                  key={item}
                  aria-pressed={city === item}
                  className={city === item ? styles.activeFilter : ""}
                  onClick={() => setCity(item)}
                >
                  {item}
                  {item === "Semua kota" && <span>{outlets.length}</span>}
                </button>
              ),
            )}
          </div>
          <span aria-live="polite">
            {visibleOutlets.length} tempat untuk good times <Arrow diagonal />
          </span>
        </div>
        {loading && <p role="status">Memuat data outlet dan meja...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && outlets.length === 0 && (
          <p>Belum ada outlet aktif.</p>
        )}
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
                  <span /> {item.tables.length} meja
                </span>
                <span className={styles.imageIndex}>
                  0{outlets.indexOf(item) + 1}
                </span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>{item.city}</p>
                <h3>{item.name}</h3>
                <p className={styles.location}>
                  <span aria-hidden="true">⌖</span> {item.address}
                </p>
                <p className={styles.cardDescription}>
                  {item.tables.length} meja tersedia di outlet ini.
                </p>
                <div className={styles.features}>
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
