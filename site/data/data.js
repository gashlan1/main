/* Hemline — site data.
   Everything the site shows lives here. Add a designer or a piece by adding an object.
   Sample designers and pieces below are fictional placeholders. */
window.HEMLINE = {
  site: {
    name: "Hemline",
    tagline: "A hub for independent clothing and fashion designers.",
    season: "AW26",
    nextSeason: "SS27",
    applicationsClose: "2027-01-15T23:59:00Z",
    showDate: "2027-02-20T18:00:00Z",
    contactEmail: "hello@hemline.example",
    instagram: "@hemline.hub"
  },

  disciplines: ["Womenswear", "Menswear", "Couture", "Knitwear", "Tailoring", "Accessories", "Streetwear", "Bridal"],

  designers: [
    {
      slug: "aya-khalil", name: "Aya Khalil", label: "Aya Khalil Atelier",
      city: "Jeddah", country: "Saudi Arabia", discipline: "Couture", founded: 2019,
      spot: "front-row",
      bio: "Hand-draped eveningwear built on a single uncut length of silk. Aya trained in pattern cutting in Milan and returned home to work with weavers in Al-Ahsa. Each gown is made to measure, numbered, and never repeated.",
      palette: ["#6B1E2B", "#C98B6A", "#F0E4D4"],
      socials: { instagram: "@ayakhalil.atelier", site: "ayakhalil.example" },
      contact: "studio@ayakhalil.example",
      pieces: 4
    },
    {
      slug: "tomas-reinholt", name: "Tomás Reinholt", label: "REINHOLT",
      city: "Copenhagen", country: "Denmark", discipline: "Tailoring", founded: 2016,
      spot: "front-row",
      bio: "Soft tailoring with no shoulder padding and a half-canvas chest, cut for people who cycle to work. Reinholt uses deadstock wool from Yorkshire mills and keeps every jacket in production for five years.",
      palette: ["#2B2F3A", "#8A8F9C", "#D8D4CA"],
      socials: { instagram: "@reinholt.cph" },
      contact: "order@reinholt.example",
      pieces: 3
    },
    {
      slug: "nia-okafor", name: "Nia Okafor", label: "OKAFOR Knit",
      city: "Lagos", country: "Nigeria", discipline: "Knitwear", founded: 2021,
      spot: "showroom",
      bio: "Fully fashioned knitwear in undyed cotton and recycled cashmere, programmed on a single Shima Seiki machine in a studio in Yaba. Nia publishes the stitch count of every piece.",
      palette: ["#D9A441", "#4A3A2A", "#F5EFE0"],
      socials: { instagram: "@okafor.knit" },
      contact: "hi@okaforknit.example",
      pieces: 3
    },
    {
      slug: "lucie-marchetti", name: "Lucie Marchetti", label: "Marchetti",
      city: "Lyon", country: "France", discipline: "Womenswear", founded: 2018,
      spot: null,
      bio: "Workwear silhouettes in jacquard silks from the last Lyon weavers. Lucie cuts everything in-house in a 40 m² atelier above a boulangerie and sells in editions of twenty.",
      palette: ["#3A5A4A", "#B9C5B0", "#E9E6DC"],
      socials: { instagram: "@marchetti.lyon", site: "marchetti.example" },
      contact: "atelier@marchetti.example",
      pieces: 3
    },
    {
      slug: "ken-arai", name: "Ken Arai", label: "ARAI",
      city: "Osaka", country: "Japan", discipline: "Menswear", founded: 2014,
      spot: "front-row",
      bio: "Oversized outerwear in 21 oz Okayama selvedge and waxed cotton. Ken designs around one idea per season and shows it in a single look, photographed in his own neighbourhood.",
      palette: ["#1C2233", "#4F5B7A", "#C4B8A4"],
      socials: { instagram: "@arai.osaka" },
      contact: "info@arai.example",
      pieces: 3
    },
    {
      slug: "sofia-brandao", name: "Sofia Brandão", label: "Brandão",
      city: "Porto", country: "Portugal", discipline: "Accessories", founded: 2020,
      spot: "showroom",
      bio: "Vegetable-tanned leather bags with a single seam and brass hardware cast in Guimarães. Sofia repairs anything she has made, for life, free.",
      palette: ["#7A4A2A", "#C2956A", "#EFE3D0"],
      socials: { instagram: "@brandao.porto" },
      contact: "sofia@brandao.example",
      pieces: 2
    },
    {
      slug: "dmitri-volkov", name: "Dmitri Volkov", label: "VOLKOV",
      city: "Berlin", country: "Germany", discipline: "Streetwear", founded: 2022,
      spot: null,
      bio: "Technical layers in recycled nylon ripstop with taped seams, made in runs of fifty in Kreuzberg. Volkov drops twice a year, at midnight, and never restocks.",
      palette: ["#161616", "#5E5E62", "#D1D1CF"],
      socials: { instagram: "@volkov.bln" },
      contact: "drop@volkov.example",
      pieces: 3
    },
    {
      slug: "mei-lin-chau", name: "Mei-Lin Chau", label: "Chau Bridal",
      city: "Melbourne", country: "Australia", discipline: "Bridal", founded: 2017,
      spot: null,
      bio: "Minimal bridal in heavy silk crêpe and organza, designed to be worn again as separates. Mei-Lin makes twelve dresses a year, each with a hidden embroidered date.",
      palette: ["#B8A99A", "#E8DED2", "#FBF8F3"],
      socials: { instagram: "@chau.bridal", site: "chaubridal.example" },
      contact: "appointments@chaubridal.example",
      pieces: 2
    }
  ],

  /* categories: Dress, Outerwear, Tailoring, Knit, Trousers, Shirt, Bag, Skirt */
  pieces: [
    { slug: "aya-01", designer: "aya-khalil", look: 1, name: "Nahr gown", category: "Dress", season: "AW26",
      fabric: "100% mulberry silk charmeuse, 22 momme", colour: "Oxblood", edition: "1 of 1", sizes: "Made to measure",
      price: "SAR 18,500", madeIn: "Jeddah", palette: ["#6B1E2B", "#A3283A", "#2A0C12"], angle: 160,
      notes: "Draped from one 7 m length with no cut lines through the body. Hem weighted with hand-sewn brass chain." },
    { slug: "aya-02", designer: "aya-khalil", look: 2, name: "Dune cape", category: "Outerwear", season: "AW26",
      fabric: "Wool and silk twill, Al-Ahsa handloom", colour: "Sand", edition: "1 of 3", sizes: "One size",
      price: "SAR 9,800", madeIn: "Jeddah", palette: ["#C98B6A", "#E6C7A8", "#8A5A3F"], angle: 20,
      notes: "Floor length, single front closure in horn." },
    { slug: "aya-03", designer: "aya-khalil", look: 3, name: "Lantern dress", category: "Dress", season: "SS26",
      fabric: "Silk organza, 8 layers", colour: "Bone", edition: "1 of 2", sizes: "Made to measure",
      price: "SAR 14,200", madeIn: "Jeddah", palette: ["#F0E4D4", "#D9C3AC", "#B99B80"], angle: 200,
      notes: "Each layer hemmed by hand; 61 hours of work." },
    { slug: "aya-04", designer: "aya-khalil", look: 4, name: "Qamar column", category: "Dress", season: "AW26",
      fabric: "Double-faced silk satin", colour: "Ink", edition: "1 of 1", sizes: "Made to measure",
      price: "SAR 16,000", madeIn: "Jeddah", palette: ["#1B1420", "#3A2A3F", "#6B1E2B"], angle: 120,
      notes: "Bias cut, open back, no fastenings." },

    { slug: "rein-01", designer: "tomas-reinholt", look: 1, name: "Cykel jacket", category: "Tailoring", season: "AW26",
      fabric: "Deadstock Yorkshire wool flannel, 380 g", colour: "Slate", edition: "Made to order", sizes: "44 to 56",
      price: "DKK 7,900", madeIn: "Copenhagen", palette: ["#2B2F3A", "#4A5061", "#8A8F9C"], angle: 150,
      notes: "Half-canvas, unpadded shoulder, extra-high armhole for riding. Action pleat at back." },
    { slug: "rein-02", designer: "tomas-reinholt", look: 2, name: "Nørrebro trouser", category: "Trousers", season: "AW26",
      fabric: "Wool gabardine", colour: "Chalk", edition: "Made to order", sizes: "44 to 56",
      price: "DKK 3,400", madeIn: "Copenhagen", palette: ["#D8D4CA", "#B5B0A4", "#8A8F9C"], angle: 30,
      notes: "Single reverse pleat, side adjusters, 3 cm turn-up." },
    { slug: "rein-03", designer: "tomas-reinholt", look: 3, name: "Havn coat", category: "Outerwear", season: "AW26",
      fabric: "Melton wool, 720 g", colour: "Navy", edition: "Edition of 30", sizes: "44 to 56",
      price: "DKK 11,500", madeIn: "Copenhagen", palette: ["#1F2638", "#2B2F3A", "#556080"], angle: 170,
      notes: "Raglan sleeve, storm collar, horn buttons." },

    { slug: "oka-01", designer: "nia-okafor", look: 1, name: "Yaba cardigan", category: "Knit", season: "AW26",
      fabric: "Recycled cashmere, 12 gauge, 41,200 stitches", colour: "Turmeric", edition: "Edition of 40", sizes: "XS to XL",
      price: "NGN 480,000", madeIn: "Lagos", palette: ["#D9A441", "#E8C170", "#9A6F22"], angle: 45,
      notes: "Fully fashioned, no cut edges, linked by hand." },
    { slug: "oka-02", designer: "nia-okafor", look: 2, name: "Undyed crew", category: "Knit", season: "AW26",
      fabric: "Undyed Nigerian cotton, 7 gauge", colour: "Natural", edition: "Open edition", sizes: "XS to XL",
      price: "NGN 190,000", madeIn: "Lagos", palette: ["#F5EFE0", "#E3D8C0", "#C9B897"], angle: 200,
      notes: "Rib-to-rib construction; wash cold, dry flat." },
    { slug: "oka-03", designer: "nia-okafor", look: 3, name: "Mesh skirt", category: "Skirt", season: "SS26",
      fabric: "Mercerised cotton, open-work mesh", colour: "Cocoa", edition: "Edition of 25", sizes: "XS to L",
      price: "NGN 260,000", madeIn: "Lagos", palette: ["#4A3A2A", "#6E5742", "#A68B6D"], angle: 110,
      notes: "Knitted to shape with a slip lining." },

    { slug: "mar-01", designer: "lucie-marchetti", look: 1, name: "Ouvrière jacket", category: "Outerwear", season: "AW26",
      fabric: "Lyon silk jacquard, cotton backed", colour: "Forest", edition: "Edition of 20", sizes: "34 to 44",
      price: "EUR 1,450", madeIn: "Lyon", palette: ["#3A5A4A", "#56765F", "#1E3328"], angle: 140,
      notes: "Chore-coat pattern, three patch pockets, corozo buttons." },
    { slug: "mar-02", designer: "lucie-marchetti", look: 2, name: "Croix-Rousse trouser", category: "Trousers", season: "AW26",
      fabric: "Silk and wool jacquard", colour: "Sage", edition: "Edition of 20", sizes: "34 to 44",
      price: "EUR 890", madeIn: "Lyon", palette: ["#B9C5B0", "#D8DFD0", "#8A9A84"], angle: 20,
      notes: "Wide leg, high rise, back button fastening." },
    { slug: "mar-03", designer: "lucie-marchetti", look: 3, name: "Canut shirt", category: "Shirt", season: "SS26",
      fabric: "Silk habotai", colour: "Chalk", edition: "Edition of 20", sizes: "34 to 44",
      price: "EUR 620", madeIn: "Lyon", palette: ["#E9E6DC", "#D6D2C4", "#B9C5B0"], angle: 190,
      notes: "Dropped shoulder, mother-of-pearl buttons." },

    { slug: "arai-01", designer: "ken-arai", look: 1, name: "Kōjō parka", category: "Outerwear", season: "AW26",
      fabric: "21 oz Okayama selvedge denim, waxed", colour: "Indigo", edition: "Edition of 60", sizes: "S to XXL",
      price: "JPY 128,000", madeIn: "Osaka", palette: ["#1C2233", "#2E3A5C", "#4F5B7A"], angle: 160,
      notes: "Oversized, fishtail hem, copper hardware. Will fade." },
    { slug: "arai-02", designer: "ken-arai", look: 2, name: "Nakazakicho trouser", category: "Trousers", season: "AW26",
      fabric: "14 oz selvedge denim", colour: "Raw indigo", edition: "Open edition", sizes: "28 to 38",
      price: "JPY 42,000", madeIn: "Osaka", palette: ["#2A3147", "#1C2233", "#6A7290"], angle: 90,
      notes: "Straight leg, chain-stitched hem." },
    { slug: "arai-03", designer: "ken-arai", look: 3, name: "Hanten vest", category: "Outerwear", season: "SS26",
      fabric: "Waxed cotton canvas", colour: "Tan", edition: "Edition of 40", sizes: "S to XXL",
      price: "JPY 58,000", madeIn: "Osaka", palette: ["#C4B8A4", "#A8987E", "#7B6B55"], angle: 30,
      notes: "Four pockets, snap front." },

    { slug: "bran-01", designer: "sofia-brandao", look: 1, name: "Ribeira tote", category: "Bag", season: "AW26",
      fabric: "Vegetable-tanned Portuguese leather, 2.4 mm", colour: "Cognac", edition: "Edition of 100", sizes: "38 × 32 × 14 cm",
      price: "EUR 540", madeIn: "Porto", palette: ["#7A4A2A", "#A3673A", "#4A2C18"], angle: 135,
      notes: "One seam, brass feet, unlined. Lifetime repair." },
    { slug: "bran-02", designer: "sofia-brandao", look: 2, name: "Douro belt", category: "Bag", season: "AW26",
      fabric: "Bridle leather, cast brass buckle", colour: "Oak", edition: "Open edition", sizes: "75 to 110 cm",
      price: "EUR 160", madeIn: "Porto", palette: ["#C2956A", "#8E6A48", "#EFE3D0"], angle: 15,
      notes: "Buckle cast in Guimarães." },

    { slug: "vol-01", designer: "dmitri-volkov", look: 1, name: "Shell 07", category: "Outerwear", season: "AW26",
      fabric: "Recycled nylon ripstop, 3-layer, taped seams", colour: "Black", edition: "Edition of 50", sizes: "S to XL",
      price: "EUR 690", madeIn: "Berlin", palette: ["#161616", "#2C2C30", "#5E5E62"], angle: 150,
      notes: "Helmet-compatible hood, pit zips. Drop 14 Dec, 00:00 CET." },
    { slug: "vol-02", designer: "dmitri-volkov", look: 2, name: "Cargo 07", category: "Trousers", season: "AW26",
      fabric: "Cordura nylon, articulated knee", colour: "Graphite", edition: "Edition of 50", sizes: "S to XL",
      price: "EUR 390", madeIn: "Berlin", palette: ["#3A3A3E", "#5E5E62", "#1E1E20"], angle: 60,
      notes: "Eight pockets, bonded hems." },
    { slug: "vol-03", designer: "dmitri-volkov", look: 3, name: "Base layer 07", category: "Shirt", season: "AW26",
      fabric: "Merino and recycled polyester", colour: "Ash", edition: "Edition of 50", sizes: "S to XL",
      price: "EUR 140", madeIn: "Berlin", palette: ["#D1D1CF", "#A9A9A8", "#6E6E70"], angle: 200,
      notes: "Flatlock seams, thumb loops." },

    { slug: "chau-01", designer: "mei-lin-chau", look: 1, name: "Yarra dress", category: "Dress", season: "SS27",
      fabric: "Heavy silk crêpe, 40 momme", colour: "Ivory", edition: "1 of 12", sizes: "Made to measure",
      price: "AUD 6,800", madeIn: "Melbourne", palette: ["#FBF8F3", "#E8DED2", "#C9BBA9"], angle: 180,
      notes: "Column dress and detachable organza overskirt. Hidden embroidered date at hem." },
    { slug: "chau-02", designer: "mei-lin-chau", look: 2, name: "Fitzroy separates", category: "Dress", season: "SS27",
      fabric: "Silk organza and crêpe", colour: "Oyster", edition: "1 of 12", sizes: "Made to measure",
      price: "AUD 5,200", madeIn: "Melbourne", palette: ["#E8DED2", "#B8A99A", "#F6F1EA"], angle: 40,
      notes: "Camisole and bias skirt, wearable apart." }
  ],

  /* Exclusive spots. "front-row": six per season. "showroom": pinned placements, rolling. */
  spots: {
    frontRow: {
      count: 6,
      perks: [
        "Home-page takeover for the whole season",
        "A twelve-look lookbook feature with an editor's note",
        "Pinned first in the directory and the gallery",
        "A dedicated newsletter send to the Hemline list",
        "Front-row seat at the seasonal show"
      ],
      price: "From EUR 1,800 per season",
      seats: [
        { seat: 1, status: "taken", designer: "aya-khalil" },
        { seat: 2, status: "taken", designer: "ken-arai" },
        { seat: 3, status: "taken", designer: "tomas-reinholt" },
        { seat: 4, status: "open" },
        { seat: 5, status: "open" },
        { seat: 6, status: "waitlist" }
      ]
    },
    showroom: {
      perks: [
        "Pinned in the directory under your discipline",
        "Showroom badge on your profile and pieces",
        "Two pieces featured in the gallery each month"
      ],
      price: "EUR 240 per month, rolling",
      open: 4,
      holders: ["nia-okafor", "sofia-brandao"]
    }
  }
};
