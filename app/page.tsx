"use client";

import Image from "next/image";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import styles from "./page.module.css";
import BookingSchedule from "./booking-schedule";
import { formatRupiah as money } from "../lib/currency";
import { apiRequest, ApiError } from "../lib/api";
import { customerAuthApi, type Customer } from "../lib/customer-auth";
import type { HappyHour, PricingMode, RateTier } from "../lib/outlet";
import type { TableApiRecord } from "../lib/table";

type OutletRecord = {
  id: string;
  name: string;
  city: string;
  address: string;
  openingHour: number;
  closingHour: number;
  rate: number;
  rateTiers: RateTier[];
  pricingMode: PricingMode;
  happyHour: HappyHour | null;
};
type TableRecord = Pick<TableApiRecord, "id" | "outletId" | "name">;
type Outlet = OutletRecord & {
  tables: TableRecord[];
};

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

/** Public venue discovery and booking entry point. */
export default function Home() {
  return (
    <Suspense>
      <BookingPage />
    </Suspense>
  );
}

function BookingPage() {
  const [city, setCity] = useState("All cities");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletId, setOutletId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [discoveryVersion, setDiscoveryVersion] = useState(0);

  useEffect(() => {
    let current = true;
    customerAuthApi
      .me()
      .then(({ user }) => {
        if (current) setCustomer(user);
      })
      .catch(async (cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 401) {
          try {
            await customerAuthApi.logout();
          } catch (logoutError) {
            if (current)
              setAuthError(
                logoutError instanceof Error
                  ? logoutError.message
                  : "Could not clear your member session.",
              );
          }
        } else if (current) {
          setAuthError(
            cause instanceof Error
              ? cause.message
              : "Could not check your member session.",
          );
        }
      })
      .finally(() => {
        if (current) setAuthReady(true);
      });
    return () => {
      current = false;
    };
  }, []);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");
    try {
      await customerAuthApi.requestCode(email.trim());
      setCodeRequested(true);
      setAuthMessage("A sign-in code has been sent to your email.");
    } catch (cause) {
      setAuthError(
        cause instanceof Error ? cause.message : "Could not send the code.",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");
    try {
      await customerAuthApi.verifyCode(email.trim(), code.trim());
      const session = await customerAuthApi.me();
      if (!session.user) throw new Error("Member session unavailable.");
      setCustomer(session.user);
      setCodeRequested(false);
      setCode("");
      setAuthMessage("Signed in. Loading member venues…");
      setOutlets([]);
      setOutletId("");
      setLoading(true);
      setError("");
      setDiscoveryVersion((version) => version + 1);
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Invalid code.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");
    try {
      await customerAuthApi.logout();
      setCustomer(null);
      setCodeRequested(false);
      setCode("");
      setOutlets([]);
      setOutletId("");
      setLoading(true);
      setError("");
      setDiscoveryVersion((version) => version + 1);
    } catch (cause) {
      setAuthError(
        cause instanceof Error ? cause.message : "Could not sign out.",
      );
    } finally {
      setAuthBusy(false);
    }
  }

  useEffect(() => {
    let current = true;
    if (!authReady) return;
    Promise.all([
      apiRequest<OutletRecord[]>("/outlets/public"),
      apiRequest<TableRecord[]>("/tables/public"),
    ])
      .then(([records, tables]) => {
        if (!current) return;
        const loaded = records.map((record) => {
          const outletTables = tables.filter(
            (table) => table.outletId === record.id,
          );
          return {
            ...record,
            tables: outletTables,
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
          setError("Venues could not be loaded. Please try again later.");
      })
      .finally(() => {
        if (current) {
          setLoading(false);
          setAuthMessage("");
        }
      });
    return () => {
      current = false;
    };
  }, [authReady, discoveryVersion]);

  const outlet = outlets.find((item) => item.id === outletId);
  const visibleOutlets = outlets.filter(
    (item) => city === "All cities" || item.city === city,
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
        <a href="#" className={styles.brand} aria-label="MahjongHu home">
          <Image
            className={styles.brandLogo}
            src="/logo-transparent.webp"
            alt="MahjongHu"
            width={120}
            height={120}
            priority
          />
        </a>
        <nav aria-label="Main navigation">
          <a href="#outlets">Find a venue</a>
          <a href="#experience">The experience</a>
          <a href="#how-it-works">How to book</a>
        </nav>
        <a className={styles.navCta} href="#booking">
          Let’s play <Arrow diagonal />
        </a>
      </header>
      <section className={styles.memberAccess} aria-label="Member access">
        {customer ? (
          <div className={styles.memberRow}>
            <p>
              Signed in as <strong>{customer.email}</strong>. Member-only venues
              are available if an owner has granted you access.
            </p>
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void logout()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className={styles.memberRow}>
            <div>
              <strong>Have member access?</strong>
              <p>
                Sign in with an email code to see private venues. You can still
                book public venues without signing in; your friends do not need
                to be members.
              </p>
            </div>
            <form
              onSubmit={codeRequested ? verifyCode : requestCode}
              className={styles.memberForm}
            >
              <label>
                Email{" "}
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCodeRequested(false);
                    setCode("");
                  }}
                  placeholder="email@example.com"
                />
              </label>
              {codeRequested && (
                <label>
                  Email code{" "}
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Sign-in code"
                  />
                </label>
              )}
              <button type="submit" disabled={authBusy}>
                {authBusy
                  ? "Please wait…"
                  : codeRequested
                    ? "Sign in"
                    : "Send code"}
              </button>
              {codeRequested && (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => {
                    setCodeRequested(false);
                    setCode("");
                    setAuthError("");
                  }}
                >
                  Resend code
                </button>
              )}
            </form>
          </div>
        )}
        {authError && (
          <p role="alert" className={styles.memberError}>
            {authError}
          </p>
        )}
        {authMessage && <p role="status">{authMessage}</p>}
      </section>

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
            Put your phone down. Bring your friends together.
            <br />
            Find a table for long conversations, loud laughter,
            <br className={styles.desktopBreak} /> and one more round.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#booking">
              Find your table <Arrow diagonal />
            </a>
            <a className={styles.heroSecondary} href="/cek-booking">
              Check my booking <Arrow diagonal />
            </a>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.miniTiles} aria-hidden="true">
              <i>發</i>
              <i>中</i>
              <i>白</i>
            </span>
            <span>
              For the game. For the good times.
              <br />
              <b>Beginners and pros alike belong here.</b>
            </span>
          </div>
        </div>
        <div
          className={styles.heroArt}
          role="img"
          aria-label="Green mahjong table with tiles and the words meet you at the table"
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
          key={`${outlet.id}:${discoveryVersion}`}
          outlet={{
            id: outlet.id,
            name: outlet.name,
            address: outlet.address,
            tables: outlet.tables.length,
            tableIds: outlet.tables.map((table) => table.id),
            tableNames: outlet.tables.map((table) => table.name),
            rate: outlet.rate,
            rateTiers: outlet.rateTiers,
            pricingMode: outlet.pricingMode ?? "duration",
            happyHour: outlet.happyHour ?? null,
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
            rate: item.rate,
            rateTiers: item.rateTiers,
            pricingMode: item.pricingMode ?? "duration",
            happyHour: item.happyHour ?? null,
            openingHour: item.openingHour,
            closingHour: item.closingHour,
          }))}
          onOutletChange={setOutletId}
        />
      )}

      <section id="outlets" className={styles.outlets}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>IN YOUR CITY, FOR YOUR CREW</p>
            <h2>
              Different places.
              <br />
              <em>Same good energy.</em>
            </h2>
          </div>
          <p>
            Every place has its own story.
            <br />
            Pick the vibe that feels like you.
          </p>
        </div>
        <div className={styles.filters}>
          <div role="group" aria-label="Filter by city">
            {["All cities", ...new Set(outlets.map((item) => item.city))].map(
              (item) => (
                <button
                  key={item}
                  aria-pressed={city === item}
                  className={city === item ? styles.activeFilter : ""}
                  onClick={() => setCity(item)}
                >
                  {item}
                  {item === "All cities" && <span>{outlets.length}</span>}
                </button>
              ),
            )}
          </div>
          <span aria-live="polite">
            {visibleOutlets.length} places for good times <Arrow diagonal />
          </span>
        </div>
        {loading && <p role="status">Loading venues and tables...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && outlets.length === 0 && (
          <p>No active venues yet.</p>
        )}
        <div className={styles.outletGrid}>
          {visibleOutlets.map((item) => (
            <article className={styles.outletCard} key={item.id}>
              <div className={styles.outletImage}>
                <Image
                  src="/mahjong-illustration.svg"
                  alt=""
                  fill
                  sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"
                />
                <span className={styles.imageBadge}>
                  <span /> {item.tables.length} tables
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
                  {item.tables.length} tables available at this venue.
                </p>
                <div className={styles.features}>
                  <span>4 players / table</span>
                </div>
                <div className={styles.cardFooter}>
                  <div>
                    <small>Base rate / table-hour</small>
                    <strong>
                      {money(item.rate)}
                      <span> / hour</span>
                    </strong>
                  </div>
                  <button
                    onClick={() => chooseOutlet(item.id)}
                    aria-label={`Select ${item.name}`}
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
            Because the best moments don’t happen
            <br />
            on a screen. They happen across the table.
          </p>
        </div>
        <div className={styles.experienceItem}>
          <span className={styles.featureIcon}>發</span>
          <h3>Arrive. Sit down. Play.</h3>
          <p>
            Automatic tables and tiles are ready. Just bring your friends and
            your competitive spirit.
          </p>
        </div>
        <div className={styles.experienceItem}>
          <span className={styles.featureIcon}>茶</span>
          <h3>A little sip, a little play.</h3>
          <p>
            Good conversation, your favorite drink, and a welcoming place to
            stay a while.
          </p>
        </div>
        <div className={styles.experienceItem}>
          <span className={styles.featureIcon}>友</span>
          <h3>New here? You’re in.</h3>
          <p>
            New to mahjong? No problem. Every player starts with their first
            round.
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
              text: "Choose a venue and the vibe your crew loves.",
            },
            {
              title: "Pick your moment",
              text: "Choose a date, then pick time slots at one or more tables.",
            },
            {
              title: "Bring your people",
              text: "Review your tables, playing times, and estimated payment.",
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
        <a href="#" className={styles.brand} aria-label="MahjongHu home">
          <Image
            className={styles.brandLogo}
            src="/logo-transparent.webp"
            alt="MahjongHu"
            width={120}
            height={120}
          />
        </a>
        <p>Good tiles. Great company.</p>
        <div className={styles.footerContact}>
          <span>NEED A WEBSITE TOO?</span>
          <a
            href="https://wa.me/62895413315500?text=Hi%2C%20I%27m%20interested%20in%20building%20a%20website."
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with FlowPOS on WhatsApp at 0895 4133 15500"
          >
            Chat with FlowPOS on WhatsApp <Arrow diagonal />
            <small>0895 4133 15500</small>
          </a>
        </div>
        <span>
          © {new Date().getFullYear()} MahjongHu · Public booking demo
        </span>
      </footer>
    </main>
  );
}
