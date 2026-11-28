/* Hemline — app
   Single page, routed on the URL hash:
   #home #designers #pieces #exclusive #join  |  #d-<designer slug>  |  #p-<piece slug> */
(function () {
  "use strict";
  const D = window.HEMLINE;
  const view = document.getElementById("view");
  const lookbook = document.getElementById("lookbook");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const designer = (slug) => D.designers.find((d) => d.slug === slug);
  const piece = (slug) => D.pieces.find((p) => p.slug === slug);
  const piecesOf = (slug) => D.pieces.filter((p) => p.designer === slug).sort((a, b) => a.look - b.look);
  const seatOf = (slug) => D.spots.frontRow.seats.find((s) => s.designer === slug);
  const openSeats = () => D.spots.frontRow.seats.filter((s) => s.status === "open");
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  let timers = [];
  const every = (fn, ms) => { fn(); timers.push(setInterval(fn, ms)); };
  const clearTimers = () => { timers.forEach(clearInterval); timers = []; };

  function fabric(pal, angle, look, img, extraClass) {
    const bg = `linear-gradient(${angle}deg, ${pal[0]} 0%, ${pal[1]} 55%, ${pal[2]} 100%)`;
    const lookHtml = look ? `<span class="look"><small>Look</small>${pad(look)}</span>` : "";
    const imgHtml = img ? `<img src="${esc(img)}" alt="">` : "";
    return `<div class="fabric ${extraClass || ""}" style="--sw-bg:${bg}">${imgHtml}${lookHtml}</div>`;
  }
  function spotBadge(d) {
    if (d.spot === "front-row") { const s = seatOf(d.slug); return `<span class="badge fr">Front row${s ? " · seat " + s.seat : ""}</span>`; }
    if (d.spot === "showroom") return `<span class="badge sr">Showroom</span>`;
    return "";
  }
  function pieceCard(p, extra) {
    const d = designer(p.designer);
    const tag = d.spot === "front-row" ? `<span class="pc-tag ex">Front row</span>` : d.spot === "showroom" ? `<span class="pc-tag">Showroom</span>` : `<span class="pc-tag">${esc(p.season)}</span>`;
    return `<a class="pc rv ${extra || ""}" href="#p-${p.slug}" data-tilt>
      <div class="pc-img" style="position:relative">${fabric(p.palette, p.angle, p.look, p.image)}${tag}</div>
      <div class="pc-meta"><div><div class="pc-name">${esc(p.name)}</div><div class="pc-by">${esc(d.label)} · ${esc(p.category)}</div></div><div class="pc-price num">${esc(p.price)}</div></div>
    </a>`;
  }
  const arrow = `<svg class="arr" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h11M9 3l5 5-5 5"/></svg>`;

  /* ---------- views ---------- */
  function homeView() {
    const S = D.site;
    const fr = D.spots.frontRow.seats.filter((s) => s.status === "taken").map((s) => designer(s.designer));
    const latest = D.pieces.filter((p) => p.season === S.season).slice(0, 10);
    const cities = [...new Set(D.designers.map((d) => d.city))];
    const words = ["Independent", "designers,", "shown", "<em>properly.</em>"];
    return `
<section class="hero">
  <canvas class="hero-canvas" id="threads" aria-hidden="true"></canvas>
  <div class="inner">
    <div class="hero-season"><i></i>${esc(S.season)} season · ${openSeats().length} front-row ${openSeats().length === 1 ? "seat" : "seats"} open</div>
    <h1>${words.map((w) => `<span class="w">${w}</span>`).join(" ")}</h1>
    <div class="hero-row">
      <div>
        <p class="lede measure">A hub for small ateliers and one-person labels: a profile that reads like a lookbook, a gallery of your pieces with the fabric and the edition on record, and a few exclusive spots each season for the designers we want everyone to see.</p>
        <div class="hero-actions">
          <a class="btn btn-accent" href="#pieces">See the pieces ${arrow}</a>
          <a class="btn" href="#join">Join as a designer</a>
          <a class="btn btn-ghost" href="#exclusive">Exclusive spots</a>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat"><b class="num">${D.designers.length}</b><span>Designers</span></div>
        <div class="stat"><b class="num">${D.pieces.length}</b><span>Pieces</span></div>
        <div class="stat"><b class="num">${cities.length}</b><span>Cities</span></div>
      </div>
    </div>
  </div>
</section>

<div class="ticker" aria-hidden="true"><div class="ticker-track" id="ticker"></div></div>

<section class="band">
  <div class="inner">
    <div class="band-head rv">
      <div><span class="eyebrow">Front row · ${esc(S.season)}</span><h2>This season's <em>six</em></h2></div>
      <p>Six designers take the front row each season. Three seats are taken, ${openSeats().length} are open and one has a waitlist. <a class="link" href="#exclusive">See the row</a></p>
    </div>
    <div class="fr-grid">
      ${fr.map((d, i) => {
        const p = piecesOf(d.slug)[0];
        return `<a class="fr-card rv rv-d${i}" href="#d-${d.slug}" data-tilt>
          ${fabric(p.palette, p.angle, null, p.image)}
          <div class="fr-veil"></div>
          <span class="fr-seat">Seat ${seatOf(d.slug).seat}</span>
          <span class="fr-go">${arrow}</span>
          <div class="fr-body"><h3>${esc(d.label)}</h3><p>${esc(d.discipline)} · ${esc(d.city)}</p></div>
        </a>`;
      }).join("")}
    </div>
  </div>
</section>

<section class="band">
  <div class="inner">
    <div class="band-head rv">
      <div><span class="eyebrow">New this season</span><h2>${esc(S.season)} <em>pieces</em></h2></div>
      <a class="btn" href="#pieces">All ${D.pieces.length} pieces ${arrow}</a>
    </div>
    <div class="rail">${latest.map((p) => pieceCard(p)).join("")}</div>
  </div>
</section>

<section class="band">
  <div class="inner">
    <div class="band-head rv">
      <div><span class="eyebrow">Directory</span><h2>The <em>designers</em></h2></div>
      <p>Every label on Hemline is independent and makes its own pieces. Pick a discipline or a city, or read them all.</p>
    </div>
    <div class="d-list">${D.designers.slice(0, 5).map((d, i) => designerRow(d, i)).join("")}</div>
    <div style="margin-top:1.6rem"><a class="btn" href="#designers">All designers ${arrow}</a></div>
  </div>
</section>

<section class="band">
  <div class="inner">
    <div class="band-head rv">
      <div><span class="eyebrow">How it works</span><h2>Three <em>steps</em></h2></div>
    </div>
    <div class="steps">
      <div class="step rv"><h3>Apply</h3><p>Tell us about your label, where you make, and send three to six pieces with fabric and edition. We read every application within a week.</p></div>
      <div class="step rv rv-d1"><h3>Show</h3><p>Your profile goes live with your pieces, each on record with its composition, sizes, edition and price. You keep every right to your work.</p></div>
      <div class="step rv rv-d2"><h3>Take a spot</h3><p>When you're ready, take a Showroom spot or apply for one of six Front Row seats. Spots are limited on purpose, so they mean something.</p></div>
    </div>
  </div>
</section>

<section class="band cta-band">
  <div class="inner">
    <div class="rv"><span class="eyebrow" style="color:inherit;opacity:.7">Applications for ${esc(S.nextSeason)} close ${esc(fmtDate(S.applicationsClose))}</span><h2 style="margin-top:1rem">Show your <em>work.</em></h2></div>
    <div class="rv rv-d1"><p class="measure" style="margin-bottom:1.4rem">No listing fee for a profile. Spots are the only thing we charge for, and there are never many of them.</p><div class="hero-actions" style="margin-top:0"><a class="btn btn-accent" href="#join">Apply to join ${arrow}</a><a class="btn" href="#exclusive">See the spots</a></div></div>
  </div>
</section>`;
  }

  function designerRow(d, i) {
    return `<a class="d-row rv" href="#d-${d.slug}">
      <span class="d-idx">${pad(i + 1)}</span>
      <span class="d-name">${esc(d.label)} ${spotBadge(d)}</span>
      <span class="d-sub"><b>${esc(d.discipline)}</b>Since ${d.founded}</span>
      <span class="d-sub city"><b>${esc(d.city)}</b>${esc(d.country)}</span>
      <span class="d-pal" aria-hidden="true">${d.palette.map((c) => `<i style="background:${c}"></i>`).join("")}</span>
    </a>`;
  }

  const dState = { disc: "All", q: "" };
  function designersView() {
    return `<section class="band">
  <div class="inner">
    <div class="band-head"><div><span class="eyebrow">Directory</span><h2>${D.designers.length} independent <em>designers</em></h2></div><p>Front-row and showroom designers are pinned first. Everyone else is in order of joining.</p></div>
    <div class="filters" id="d-filters">
      ${["All", ...D.disciplines].map((x) => `<button class="chip ${dState.disc === x ? "on" : ""}" data-disc="${esc(x)}">${esc(x)}</button>`).join("")}
      <label class="search"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="m11 11 3.5 3.5"/></svg><input id="d-search" type="search" placeholder="Search name or city" value="${esc(dState.q)}" aria-label="Search designers"></label>
    </div>
    <div class="count" id="d-count"></div>
    <div class="d-list" id="d-list"></div>
  </div>
</section>`;
  }
  function renderDesignerList() {
    const rank = { "front-row": 0, showroom: 1 };
    const q = dState.q.trim().toLowerCase();
    const list = D.designers
      .filter((d) => dState.disc === "All" || d.discipline === dState.disc)
      .filter((d) => !q || [d.name, d.label, d.city, d.country].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (rank[a.spot] ?? 2) - (rank[b.spot] ?? 2));
    document.getElementById("d-count").textContent = `${list.length} ${list.length === 1 ? "designer" : "designers"}`;
    document.getElementById("d-list").innerHTML = list.length ? list.map((d, i) => designerRow(d, i)).join("") : `<div class="empty">No designer matches that yet.</div>`;
    bindReveal();
  }

  const pState = { cat: "All", season: "All" };
  function piecesView() {
    const cats = ["All", ...new Set(D.pieces.map((p) => p.category))];
    const seasons = ["All", ...new Set(D.pieces.map((p) => p.season))];
    return `<section class="band">
  <div class="inner">
    <div class="band-head"><div><span class="eyebrow">Gallery</span><h2>Every <em>piece</em></h2></div><p>Each piece is on record with its fabric, edition, sizes and price. Open one to see the full card.</p></div>
    <div class="filters" id="p-filters">
      ${cats.map((x) => `<button class="chip ${pState.cat === x ? "on" : ""}" data-cat="${esc(x)}">${esc(x)}</button>`).join("")}
      <span style="flex-basis:100%;height:0"></span>
      ${seasons.map((x) => `<button class="chip ${pState.season === x ? "on" : ""}" data-season="${esc(x)}">${x === "All" ? "All seasons" : esc(x)}</button>`).join("")}
    </div>
    <div class="count" id="p-count"></div>
    <div class="pieces-grid" id="p-grid"></div>
  </div>
</section>`;
  }
  function renderPieceGrid() {
    const rank = { "front-row": 0, showroom: 1 };
    const list = D.pieces
      .filter((p) => pState.cat === "All" || p.category === pState.cat)
      .filter((p) => pState.season === "All" || p.season === pState.season)
      .sort((a, b) => (rank[designer(a.designer).spot] ?? 2) - (rank[designer(b.designer).spot] ?? 2));
    document.getElementById("p-count").textContent = `${list.length} ${list.length === 1 ? "piece" : "pieces"}`;
    document.getElementById("p-grid").innerHTML = list.length ? list.map((p) => pieceCard(p)).join("") : `<div class="empty" style="grid-column:1/-1">Nothing in that corner of the rail.</div>`;
    bindReveal(); bindTilt();
  }

  function designerView(slug) {
    const d = designer(slug);
    if (!d) return notFound("That designer isn't on Hemline.");
    const ps = piecesOf(slug);
    const hero = ps[0] || { palette: d.palette, angle: 150 };
    const seat = seatOf(slug);
    return `<section class="band">
  <div class="inner">
    <a class="back" href="#designers">${arrow.replace('class="arr"', 'class="arr" style="transform:rotate(180deg)"')} All designers</a>
    <div class="profile-hero">
      <div>
        <span class="eyebrow">${esc(d.discipline)} · ${esc(d.city)}, ${esc(d.country)} ${spotBadge(d)}</span>
        <h1 style="margin:1rem 0 1.4rem;font-size:clamp(2.8rem,7vw,6.5rem)">${esc(d.label)}</h1>
        <p class="lede">${esc(d.bio)}</p>
        <div class="profile-meta">
          <div><span>Designer</span><b>${esc(d.name)}</b></div>
          <div><span>Founded</span><b class="num">${d.founded}</b></div>
          <div><span>Pieces on Hemline</span><b class="num">${ps.length}</b></div>
          <div><span>Contact</span><b class="copyable" data-copy="${esc(d.contact)}" title="Click to copy">${esc(d.contact)}</b></div>
          ${d.socials.instagram ? `<div><span>Instagram</span><b class="copyable" data-copy="${esc(d.socials.instagram)}">${esc(d.socials.instagram)}</b></div>` : ""}
          ${d.socials.site ? `<div><span>Website</span><b>${esc(d.socials.site)}</b></div>` : ""}
        </div>
        ${seat ? `<p style="margin-top:1.5rem" class="muted">Holds front-row seat ${seat.seat} for ${esc(D.site.season)}.</p>` : ""}
      </div>
      <div data-tilt class="pc" style="perspective:1200px"><div class="pc-img">${fabric(hero.palette, hero.angle, hero.look, hero.image)}</div></div>
    </div>
  </div>
</section>
<section class="band">
  <div class="inner">
    <div class="band-head rv"><div><span class="eyebrow">Pieces</span><h2>${esc(d.label)} <em>looks</em></h2></div><a class="btn" href="#pieces">Whole gallery ${arrow}</a></div>
    <div class="pieces-grid">${ps.map((p) => pieceCard(p)).join("") || `<div class="empty" style="grid-column:1/-1">No pieces yet.</div>`}</div>
  </div>
</section>`;
  }

  function exclusiveView() {
    const FR = D.spots.frontRow, SR = D.spots.showroom, S = D.site;
    return `<section class="band">
  <div class="inner">
    <div class="ex-hero">
      <div class="rv">
        <span class="eyebrow">Exclusive spots · ${esc(S.season)} → ${esc(S.nextSeason)}</span>
        <h1 style="margin-top:1rem;font-size:clamp(2.8rem,7vw,6.5rem)">Six seats, <em>one row.</em></h1>
      </div>
      <div class="rv rv-d1">
        <p class="lede">Hemline sells exactly two kinds of placement, and not many of either. The Front Row is six seats a season. The Showroom is a small set of pinned spots that roll month to month. Nothing else on the site is for sale.</p>
        <div class="countdown" id="countdown" aria-label="Time until applications close"></div>
        <p class="muted" style="margin-top:.6rem;font-size:.85rem">until ${esc(S.nextSeason)} front-row applications close, ${esc(fmtDate(S.applicationsClose))}</p>
      </div>
    </div>

    <div class="row-stage rv">
      <div class="runway-label">Runway</div>
      <div class="runway"></div>
      <div class="seats" id="seats">
        ${FR.seats.map((s) => {
          const d = s.designer ? designer(s.designer) : null;
          const st = s.status === "taken" ? "Taken" : s.status === "open" ? "Open" : "Waitlist";
          const inner = d
            ? `<div class="seat-who">${esc(d.label)}<small>${esc(d.discipline)} · ${esc(d.city)}</small></div><div class="seat-pal">${d.palette.map((c) => `<i style="background:${c}"></i>`).join("")}</div>`
            : s.status === "open"
              ? `<div class="seat-who">Your label here<small>${esc(S.nextSeason)} season</small></div><span class="seat-cta">Apply ${arrow}</span>`
              : `<div class="seat-who">Reserved<small>Join the waitlist</small></div><span class="seat-cta">Waitlist ${arrow}</span>`;
          const href = d ? `#d-${d.slug}` : `#join-spot-${s.seat}`;
          return `<a class="seat ${s.status}" href="${href}" data-seat="${s.seat}"><div><div class="seat-n num">${s.seat}</div><span class="seat-st">${st}</span></div><div>${inner}</div></a>`;
        }).join("")}
      </div>
    </div>

    <div class="tiers">
      <div class="tier fr rv">
        <span class="eyebrow">Tier one</span>
        <h3>Front Row <small>${esc(FR.price)}</small></h3>
        <ul>${FR.perks.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div class="tier-foot"><span class="avail num">${openSeats().length} of ${FR.count} seats open</span><a class="btn btn-accent" href="#join-spot">Apply for a seat ${arrow}</a></div>
      </div>
      <div class="tier rv rv-d1">
        <span class="eyebrow">Tier two</span>
        <h3>Showroom <small>${esc(SR.price)}</small></h3>
        <ul>${SR.perks.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <p class="muted" style="font-size:.9rem">Currently held by ${SR.holders.map((h) => `<a class="link" href="#d-${h}">${esc(designer(h).label)}</a>`).join(" and ")}.</p>
        <div class="tier-foot"><span class="avail num">${SR.open} spots open</span><a class="btn" href="#join-spot-showroom">Take a Showroom spot ${arrow}</a></div>
      </div>
    </div>
  </div>
</section>
<section class="band">
  <div class="inner">
    <div class="band-head rv"><div><span class="eyebrow">In the row now</span><h2>Front row <em>${esc(S.season)}</em></h2></div></div>
    <div class="pieces-grid">${FR.seats.filter((s) => s.designer).flatMap((s) => piecesOf(s.designer).slice(0, 2)).map((p) => pieceCard(p)).join("")}</div>
  </div>
</section>`;
  }

  function joinView(mode, seatPick) {
    const spot = mode === "spot";
    const S = D.site;
    const seatOptions = D.spots.frontRow.seats.map((s) => {
      const dis = s.status === "taken";
      const checked = !dis && String(s.seat) === String(seatPick) ? "checked" : "";
      return `<span class="${dis ? "taken" : ""}"><input type="radio" name="spot" id="spot-${s.seat}" value="Front row seat ${s.seat}" ${dis ? "disabled" : ""} ${checked}><label for="spot-${s.seat}">Seat ${s.seat}<small>${s.status}</small></label></span>`;
    }).join("") + `<span><input type="radio" name="spot" id="spot-showroom" value="Showroom" ${seatPick === "showroom" ? "checked" : ""}><label for="spot-showroom">Showroom<small>rolling</small></label></span>`;
    return `<section class="band">
  <div class="inner">
    <div class="filters" style="margin-bottom:2.5rem">
      <a class="chip ${!spot ? "on" : ""}" href="#join">Join as a designer</a>
      <a class="chip ${spot ? "on" : ""}" href="#join-spot">Apply for an exclusive spot</a>
    </div>
    <div class="form-wrap">
      <aside class="rv">
        <span class="eyebrow">${spot ? "Exclusive spot application" : "Designer application"}</span>
        <h2 style="margin-top:1rem">${spot ? "Take a <em>seat.</em>" : "Show your <em>work.</em>"}</h2>
        <ul>
          ${spot
            ? `<li>Front-row seats are for ${esc(S.nextSeason)}; applications close ${esc(fmtDate(S.applicationsClose))}.</li><li>Showroom spots start the first of next month.</li><li>You need a Hemline profile first, or apply for both at once below.</li><li>We confirm by email within five working days.</li>`
            : `<li>No fee to join. We charge only for exclusive spots.</li><li>Independent labels only, with your own production.</li><li>Send three to six pieces to start. You can add more later.</li><li>We reply within a week.</li>`}
        </ul>
      </aside>
      <form id="apply-form" novalidate data-kind="${spot ? "spot" : "join"}">
        <div class="f-grid">
          <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" required autocomplete="name"><span class="f-err"></span></div>
          <div class="field"><label for="f-label">Label name</label><input id="f-label" name="label" required><span class="f-err"></span></div>
          <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" required autocomplete="email"><span class="f-err"></span></div>
          <div class="field"><label for="f-city">City, country</label><input id="f-city" name="city" required placeholder="Jeddah, Saudi Arabia"><span class="f-err"></span></div>
          <div class="field"><label for="f-disc">Discipline</label><select id="f-disc" name="discipline" required><option value="">Choose</option>${D.disciplines.map((x) => `<option>${esc(x)}</option>`).join("")}</select><span class="f-err"></span></div>
          <div class="field"><label for="f-ig">Instagram or website</label><input id="f-ig" name="link" placeholder="@yourlabel"><span class="f-err"></span></div>
          ${spot ? `<div class="field full"><label>Which spot</label><div class="seat-pick" id="seat-pick">${seatOptions}</div><span class="f-err" id="spot-err"></span></div>` : ""}
          <div class="field full"><label for="f-bio">${spot ? "Why this season" : "About the label"}</label><textarea id="f-bio" name="bio" required placeholder="${spot ? "What you'd show in the row and why now." : "What you make, where, how many, and what the pieces are made of."}"></textarea><span class="f-err"></span></div>
          ${spot ? "" : `<div class="field"><label for="f-pieces">Pieces to start with</label><select id="f-pieces" name="pieces"><option>3</option><option>4</option><option>5</option><option>6</option></select><span class="f-err"></span></div>`}
        </div>
        <div class="f-foot">
          <button class="btn btn-accent" type="submit">${spot ? "Send spot application" : "Send application"} ${arrow}</button>
          <p class="f-note">Applications are saved on this device and given a reference. Connect a form service to receive them by email (see the site README).</p>
        </div>
      </form>
    </div>
  </div>
</section>`;
  }
  const notFound = (msg) => `<section class="band"><div class="inner"><div class="empty">${esc(msg)}</div><p style="text-align:center"><a class="btn" href="#home">Back home</a></p></div></section>`;

  /* ---------- lookbook overlay ---------- */
  let lbList = [];
  function openLookbook(slug) {
    const p = piece(slug);
    if (!p) { lookbook.hidden = true; return; }
    const d = designer(p.designer);
    lbList = lbList.length ? lbList : D.pieces.map((x) => x.slug);
    const i = lbList.indexOf(slug);
    const prev = lbList[(i - 1 + lbList.length) % lbList.length], next = lbList[(i + 1) % lbList.length];
    lookbook.innerHTML = `<div class="lb-inner">
      <div class="lb-bar">
        <span class="eyebrow"><span class="num">${pad(i + 1)} / ${pad(lbList.length)}</span><span>${esc(p.season)}</span>${spotBadge(d)}</span>
        <div class="lb-nav">
          <a class="icon-btn" href="#p-${prev}" aria-label="Previous piece"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 8H3M7 3 2 8l5 5"/></svg></a>
          <a class="icon-btn" href="#p-${next}" aria-label="Next piece"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h11M9 3l5 5-5 5"/></svg></a>
          <button class="icon-btn" id="lb-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 3 10 10M13 3 3 13"/></svg></button>
        </div>
      </div>
      <div class="lb-body">
        <div data-tilt class="pc" style="perspective:1400px"><div class="pc-img">${fabric(p.palette, p.angle, p.look, p.image)}</div></div>
        <div>
          <h2 class="lb-title">${esc(p.name)}</h2>
          <p class="lb-by">by <a class="link" href="#d-${d.slug}">${esc(d.label)}</a> · ${esc(d.city)}</p>
          <div class="spec">
            <div><span>Fabric</span><b>${esc(p.fabric)}</b></div>
            <div><span>Colour</span><b>${esc(p.colour)}</b></div>
            <div><span>Edition</span><b>${esc(p.edition)}</b></div>
            <div><span>Sizes</span><b>${esc(p.sizes)}</b></div>
            <div><span>Price</span><b class="num">${esc(p.price)}</b></div>
            <div><span>Made in</span><b>${esc(p.madeIn)}</b></div>
            <div><span>Category</span><b>${esc(p.category)}</b></div>
            <div><span>Look</span><b class="num">${pad(p.look)} · ${esc(p.season)}</b></div>
          </div>
          <p class="lb-notes">${esc(p.notes)}</p>
          <div class="lb-actions">
            <span class="btn copyable" data-copy="${esc(d.contact)}">Enquire: ${esc(d.contact)}</span>
            <a class="btn" href="#d-${d.slug}">Designer profile ${arrow}</a>
          </div>
        </div>
      </div>
    </div>`;
    lookbook.hidden = false;
    document.body.style.overflow = "hidden";
    lookbook.scrollTop = 0;
    document.getElementById("lb-close").onclick = closeLookbook;
    bindTilt(lookbook); bindCopy(lookbook);
    lookbook.querySelector(".icon-btn").focus({ preventScroll: true });
  }
  function closeLookbook() {
    if (lookbook.hidden) return;
    lookbook.hidden = true; document.body.style.overflow = "";
    if (location.hash.startsWith("#p-")) location.hash = lastRoute || "pieces";
  }
  document.addEventListener("keydown", (e) => {
    if (lookbook.hidden) return;
    if (e.key === "Escape") closeLookbook();
    if (e.key === "ArrowRight") lookbook.querySelector('[aria-label="Next piece"]').click();
    if (e.key === "ArrowLeft") lookbook.querySelector('[aria-label="Previous piece"]').click();
  });
  lookbook.addEventListener("click", (e) => { if (e.target === lookbook) closeLookbook(); });

  /* ---------- router ---------- */
  let current = null, lastRoute = "home";
  function route() {
    const h = (location.hash || "#home").slice(1);
    if (h.startsWith("p-")) {
      if (!current) { current = "pieces"; mount(piecesView(), "pieces", "pieces", () => { renderPieceGrid(); bindPieceFilters(); }); }
      lbList = current === "pieces" ? [...document.querySelectorAll("#p-grid .pc")].map((a) => a.getAttribute("href").slice(3)) : (current.startsWith("d-") ? piecesOf(current.slice(2)).map((p) => p.slug) : D.pieces.map((p) => p.slug));
      openLookbook(h.slice(2));
      return;
    }
    closeLookbookSilently();
    lastRoute = h;
    let html, name = h;
    if (h === "home" || h === "") html = homeView();
    else if (h === "designers") html = designersView();
    else if (h === "pieces") html = piecesView();
    else if (h === "exclusive") html = exclusiveView();
    else if (h === "join") html = joinView("join");
    else if (h.startsWith("join-spot")) { const m = h.match(/^join-spot-(.+)$/); html = joinView("spot", m ? m[1] : ""); name = "join"; }
    else if (h.startsWith("d-")) html = designerView(h.slice(2));
    else html = notFound("There's nothing at that address.");
    mount(html, name, h, () => {
      if (h === "designers") { renderDesignerList(); bindDesignerFilters(); }
      if (h === "pieces") { renderPieceGrid(); bindPieceFilters(); }
      if (h === "home" || h === "") { buildTicker(); startThreads(); }
      if (h === "exclusive") startCountdown();
      if (h.startsWith("join")) bindForm();
    });
  }
  function closeLookbookSilently() { lookbook.hidden = true; document.body.style.overflow = ""; }
  function mount(html, name, fullHash, after) {
    clearTimers(); stopThreads();
    const swap = () => {
      view.innerHTML = html;
      current = fullHash || name;
      view.classList.remove("leaving"); view.classList.add("entering");
      setTimeout(() => view.classList.remove("entering"), 600);
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      setActive(name); bindReveal(); bindTilt(); bindCopy();
      document.getElementById("mobile-nav").hidden = true;
      document.getElementById("menu-btn").setAttribute("aria-expanded", "false");
      if (after) after();
    };
    if (view.innerHTML && !reduced) { view.classList.add("leaving"); setTimeout(swap, 240); } else swap();
  }
  function setActive(name) {
    document.querySelectorAll("[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === name));
  }

  /* ---------- filters ---------- */
  function bindDesignerFilters() {
    document.getElementById("d-filters").addEventListener("click", (e) => {
      const b = e.target.closest("[data-disc]"); if (!b) return;
      dState.disc = b.dataset.disc;
      document.querySelectorAll("#d-filters [data-disc]").forEach((x) => x.classList.toggle("on", x === b));
      renderDesignerList();
    });
    document.getElementById("d-search").addEventListener("input", (e) => { dState.q = e.target.value; renderDesignerList(); });
  }
  function bindPieceFilters() {
    document.getElementById("p-filters").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      if (b.dataset.cat) { pState.cat = b.dataset.cat; document.querySelectorAll("#p-filters [data-cat]").forEach((x) => x.classList.toggle("on", x === b)); }
      if (b.dataset.season) { pState.season = b.dataset.season; document.querySelectorAll("#p-filters [data-season]").forEach((x) => x.classList.toggle("on", x === b)); }
      renderPieceGrid();
    });
  }

  /* ---------- forms ---------- */
  function bindForm() {
    const form = document.getElementById("apply-form"); if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll(".field").forEach((f) => {
        const input = f.querySelector("input,select,textarea"); if (!input || !input.required) return;
        const err = f.querySelector(".f-err"); let msg = "";
        if (!input.value.trim()) msg = "Needed";
        else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = "That email doesn't look right";
        f.classList.toggle("err", !!msg); err.textContent = msg; if (msg) ok = false;
      });
      const spotErr = document.getElementById("spot-err");
      if (spotErr) { const chosen = form.querySelector('input[name="spot"]:checked'); spotErr.textContent = chosen ? "" : "Pick a seat or the Showroom"; if (!chosen) ok = false; }
      if (!ok) { form.querySelector(".err input, .err select, .err textarea")?.focus(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      data.kind = form.dataset.kind; data.submitted = new Date().toISOString();
      const ref = "HL-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      data.ref = ref;
      try { const all = JSON.parse(localStorage.getItem("hemline.submissions") || "[]"); all.push(data); localStorage.setItem("hemline.submissions", JSON.stringify(all)); } catch (_) {}
      form.outerHTML = `<div class="done"><span class="eyebrow">Reference ${ref}</span><h3>Received, ${esc(data.name.split(" ")[0])}.</h3><p>${data.kind === "spot" ? `Your application for <b>${esc(data.spot)}</b> is saved on this device.` : `Your application for <b>${esc(data.label)}</b> is saved on this device.`} Nothing has been emailed yet: this site has no form service connected. The README explains how to add one so applications reach ${esc(D.site.contactEmail)}.</p><p><a class="link" href="#pieces">Back to the pieces</a></p></div>`;
    });
  }

  /* ---------- ambient: ticker, countdown, threads ---------- */
  function buildTicker() {
    const S = D.site;
    const items = [
      `${S.season} season live`,
      `${openSeats().length} front-row seats open for ${S.nextSeason}`,
      `Applications close ${fmtDate(S.applicationsClose)}`,
      ...D.pieces.filter((p) => p.season === S.season).slice(0, 6).map((p) => `${p.name} · ${designer(p.designer).label}`),
      `${[...new Set(D.designers.map((d) => d.city))].join(" · ")}`,
      `Show ${fmtDate(S.showDate)}`
    ];
    const html = items.map((t) => `<span class="ticker-item">${esc(t)}</span>`).join("");
    document.getElementById("ticker").innerHTML = html + html;
  }
  function startCountdown() {
    const el = document.getElementById("countdown"); if (!el) return;
    const end = new Date(D.site.applicationsClose).getTime();
    every(() => {
      let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
      el.innerHTML = [[d, "days"], [h, "hours"], [m, "min"], [s, "sec"]].map(([v, l]) => `<div><b>${pad(v)}</b><span>${l}</span></div>`).join("");
    }, 1000);
  }

  let raf = null, threadsCanvas = null, pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
  function startThreads() {
    threadsCanvas = document.getElementById("threads"); if (!threadsCanvas) return;
    const c = threadsCanvas, ctx = c.getContext("2d");
    const hero = c.parentElement;
    let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    const N = 16, threads = [];
    const rgb = () => getComputedStyle(document.documentElement).getPropertyValue("--thread").trim() || "239,232,220";
    const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b8303f";
    function size() { w = hero.clientWidth; h = hero.clientHeight; c.width = w * dpr; c.height = h * dpr; c.style.width = w + "px"; c.style.height = h + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    for (let i = 0; i < N; i++) threads.push({ y: (i + 0.5) / N, amp: 18 + Math.random() * 40, freq: 0.6 + Math.random() * 1.2, speed: 0.15 + Math.random() * 0.35, phase: Math.random() * Math.PI * 2, acc: i === 5 || i === 11 });
    const onMove = (e) => { const r = hero.getBoundingClientRect(); pointer.tx = e.clientX - r.left; pointer.ty = e.clientY - r.top; };
    const onLeave = () => { pointer.tx = -1e4; pointer.ty = -1e4; };
    hero.addEventListener("pointermove", onMove); hero.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(size); ro.observe(hero);
    let t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.08; pointer.y += (pointer.ty - pointer.y) * 0.08;
      ctx.clearRect(0, 0, w, h);
      const col = rgb(), acc = accent();
      const steps = Math.max(24, Math.floor(w / 18));
      for (const th of threads) {
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const x = (s / steps) * w;
          let y = th.y * h + Math.sin(x / w * Math.PI * 2 * th.freq + t * th.speed + th.phase) * th.amp + Math.sin(x / w * 7 + t * 0.4 + th.phase) * 6;
          const dx = x - pointer.x, dy = y - pointer.y, dist = Math.hypot(dx, dy);
          if (dist < 220) { const f = (1 - dist / 220); y += (dy / (dist || 1)) * f * f * 90; }
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = th.acc ? acc : `rgba(${col},0.16)`;
        ctx.globalAlpha = th.acc ? 0.55 : 1;
        ctx.lineWidth = th.acc ? 1.2 : 0.8;
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (!reduced) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    threadsCanvas._cleanup = () => { hero.removeEventListener("pointermove", onMove); hero.removeEventListener("pointerleave", onLeave); ro.disconnect(); };
  }
  function stopThreads() { if (raf) cancelAnimationFrame(raf); raf = null; if (threadsCanvas && threadsCanvas._cleanup) threadsCanvas._cleanup(); threadsCanvas = null; }
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; } else if (threadsCanvas && !raf && !reduced) startThreads(); });

  /* ---------- micro-interactions ---------- */
  let io = null;
  function bindReveal() {
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".rv:not(.in)").forEach((el) => io.observe(el));
  }
  function bindTilt(root) {
    if (reduced || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    (root || document).querySelectorAll("[data-tilt]:not([data-tilt-bound])").forEach((card) => {
      card.setAttribute("data-tilt-bound", "1");
      const img = card.querySelector(".pc-img") || card;
      const fab = card.querySelector(".fabric");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        img.style.setProperty("--ry", (px * 10) + "deg"); img.style.setProperty("--rx", (-py * 10) + "deg");
        if (fab) { fab.style.setProperty("--shx", (px * 60) + "px"); fab.style.setProperty("--shy", (py * 60) + "px"); }
      });
      card.addEventListener("pointerleave", () => { img.style.setProperty("--ry", "0deg"); img.style.setProperty("--rx", "0deg"); if (fab) { fab.style.setProperty("--shx", "0px"); fab.style.setProperty("--shy", "0px"); } });
    });
  }
  function bindCopy(root) {
    (root || document).querySelectorAll(".copyable:not([data-copy-bound])").forEach((el) => {
      el.setAttribute("data-copy-bound", "1");
      el.addEventListener("click", () => {
        const text = el.dataset.copy || el.textContent;
        const done = () => toast("Copied " + text);
        const fallback = () => { try { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Select and copy"); } catch (_) {} };
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
      });
    });
  }
  let toastEl = null, toastT = null;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  // cursor glow
  const glow = document.querySelector(".cursor-glow");
  if (glow && !reduced && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    let gx = 0, gy = 0, tx = 0, ty = 0, on = false;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; if (!on) { on = true; glow.classList.add("on"); } });
    (function loop() { gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12; glow.style.transform = `translate(${gx}px,${gy}px)`; requestAnimationFrame(loop); })();
  }

  // header: mobile menu
  const menuBtn = document.getElementById("menu-btn"), mobileNav = document.getElementById("mobile-nav");
  menuBtn.addEventListener("click", () => { const open = mobileNav.hidden; mobileNav.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open)); });

  // footer + nav fill
  document.getElementById("foot-tagline").textContent = D.site.tagline;
  document.getElementById("foot-email").textContent = D.site.contactEmail; document.getElementById("foot-email").dataset.copy = D.site.contactEmail;
  document.getElementById("foot-ig").textContent = D.site.instagram;
  document.getElementById("foot-season").textContent = `${D.site.name} · ${D.site.season} · ${new Date().getFullYear()}`;
  document.getElementById("nav-open-count").textContent = openSeats().length || "";
  bindCopy();

  window.addEventListener("hashchange", route);
  route();
})();
