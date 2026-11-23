import "server-only";
import { join } from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  ENGAGEMENT_STEPS,
  FIRM_LEGAL_NAME,
  FIRM_TAGLINE,
  INCLUDED,
  NEXT_STEPS,
  PACKAGES,
  PROPOSAL_INTRO,
  engagementOpening,
  engagementSections,
  longDate,
  money,
  pkg,
  qboText,
  type ProposalDetails,
  type Section,
} from "./proposal-template";

// Signed Proposal + Engagement Letter PDF (saved to the client's documents and emailed).

const cwd = process.cwd();
Font.register({ family: "Cormorant", src: join(cwd, "src/assets/fonts/CormorantGaramond-Bold.ttf"), fontWeight: 700 });
Font.register({
  family: "SourceSans",
  fonts: [
    { src: join(cwd, "src/assets/fonts/SourceSans3-Regular.ttf"), fontWeight: 400 },
    { src: join(cwd, "src/assets/fonts/SourceSans3-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((w) => [w]);

const NAVY = "#0b1a2e";
const GOLD = "#b8914a";
const SAND = "#f3ede2";
const MUTED = "#5d6675";

const s = StyleSheet.create({
  page: { fontFamily: "SourceSans", fontSize: 10, color: "#1c2533", paddingBottom: 56 },
  band: { backgroundColor: NAVY, color: "#fff", paddingHorizontal: 44, paddingTop: 30, paddingBottom: 26 },
  bandTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoTile: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  firm: { fontSize: 8, letterSpacing: 2, color: "#ecdcb6", fontWeight: 600, textTransform: "uppercase" },
  tagline: { fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  title: { fontFamily: "Cormorant", fontWeight: 700, fontSize: 30, marginTop: 18 },
  body: { paddingHorizontal: 44, paddingTop: 22 },
  meta: { flexDirection: "row", backgroundColor: SAND, paddingHorizontal: 44, paddingVertical: 12, gap: 24 },
  metaLabel: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 1 },
  metaValue: { fontWeight: 600, color: NAVY, marginTop: 2 },
  h2: { fontFamily: "Cormorant", fontWeight: 700, fontSize: 18, color: NAVY, marginBottom: 6 },
  eyebrow: { fontSize: 8, letterSpacing: 1.6, color: GOLD, fontWeight: 600, textTransform: "uppercase", marginTop: 16, marginBottom: 6 },
  h3: { fontWeight: 600, color: NAVY, marginTop: 10, marginBottom: 3 },
  p: { lineHeight: 1.5, marginBottom: 4 },
  li: { flexDirection: "row", marginBottom: 2.5 },
  dot: { width: 10, color: GOLD },
  liText: { flex: 1, lineHeight: 1.45 },
  pkgRow: { flexDirection: "row", gap: 8 },
  pkg: { flex: 1, backgroundColor: "#f8f5ef", borderRadius: 8, padding: 10 },
  pkgOn: { flex: 1, backgroundColor: NAVY, color: "#fff", borderRadius: 8, padding: 10 },
  pkgName: { fontFamily: "Cormorant", fontWeight: 700, fontSize: 16 },
  box: { backgroundColor: SAND, borderRadius: 8, padding: 12, marginTop: 6 },
  invest: { backgroundColor: NAVY, color: "#fff", borderRadius: 8, padding: 14, flexDirection: "row", gap: 16, marginTop: 6 },
  sigRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  sig: { flex: 1, backgroundColor: "#f8f5ef", borderRadius: 8, padding: 12 },
  sigName: { fontFamily: "Cormorant", fontWeight: 700, fontSize: 20, color: NAVY, marginTop: 6 },
  footer: { position: "absolute", bottom: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: MUTED },
});

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((it) => (
        <View key={it} style={s.li} wrap={false}>
          <Text style={s.dot}>•</Text>
          <Text style={s.liText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

function Sec({ section }: { section: Section }) {
  return (
    <View wrap={false}>
      <Text style={s.h3}>{section.heading}</Text>
      {section.blocks.map((b, i) =>
        b.kind === "list" ? <Bullets key={i} items={b.items} /> : <Text key={i} style={s.p}>{b.text}</Text>,
      )}
    </View>
  );
}

function Band({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <View style={s.band}>
      <View style={s.bandTop}>
        <View>
          <Text style={s.firm}>{FIRM_LEGAL_NAME}</Text>
          <Text style={s.tagline}>{FIRM_TAGLINE}</Text>
        </View>
        <View style={s.logoTile}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={join(cwd, "public/adept-logo.png")} style={{ width: 70, height: 31 }} />
        </View>
      </View>
      {kicker ? <Text style={{ marginTop: 14, color: "rgba(255,255,255,0.7)" }}>{kicker}</Text> : null}
      <Text style={s.title}>{title}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>{FIRM_LEGAL_NAME} | Confidential Client Document</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

export async function renderProposalPdf(d: ProposalDetails, date: string, signed: { name: string; at: string; ip: string }) {
  const chosen = pkg(d.package);
  const fee = money(d.monthlyFee);
  // dateStyle/timeStyle can't be combined with timeZoneName, so the zone is spelled out.
  const signedAt = `${new Date(signed.at).toLocaleString("en-CA", { dateStyle: "long", timeStyle: "short", timeZone: "America/Edmonton" })} Mountain Time`;

  const doc = (
    <Document title={`Proposal and Engagement Letter — ${d.businessName || d.clientName}`} author={FIRM_LEGAL_NAME}>
      <Page size="LETTER" style={s.page}>
        <Band title="Business Bookkeeping Proposal" />
        <View style={s.meta}>
          <View>
            <Text style={s.metaLabel}>Prepared for</Text>
            <Text style={s.metaValue}>{d.businessName || d.clientName}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Date</Text>
            <Text style={s.metaValue}>{longDate(date)}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Prepared by</Text>
            <Text style={s.metaValue}>
              {d.preparedBy}, {FIRM_LEGAL_NAME}
            </Text>
          </View>
        </View>
        <View style={s.body}>
          <Text style={s.h2}>{PROPOSAL_INTRO.headline}</Text>
          <Text style={s.p}>{PROPOSAL_INTRO.body}</Text>
          {d.note.trim() ? <Text style={[s.box, s.p]}>{d.note.trim()}</Text> : null}

          <Text style={s.eyebrow}>Recommended service</Text>
          <View style={s.pkgRow}>
            {PACKAGES.map((p) => {
              const on = p.id === d.package;
              return (
                <View key={p.id} style={on ? s.pkgOn : s.pkg}>
                  <Text style={{ fontSize: 7.5, color: on ? "#ecdcb6" : MUTED, textTransform: "uppercase", letterSpacing: 1 }}>{on ? "Recommended for you" : "Package"}</Text>
                  <Text style={[s.pkgName, { color: on ? "#fff" : NAVY }]}>{p.name}</Text>
                  <Text style={{ fontWeight: 600, color: on ? "#ecdcb6" : NAVY }}>{on && fee ? `${fee} / month` : p.price}</Text>
                  <Text style={{ fontSize: 8.5, marginTop: 3, color: on ? "rgba(255,255,255,0.7)" : MUTED }}>{p.bestFit}</Text>
                </View>
              );
            })}
          </View>
          <Text style={[s.p, { color: MUTED, fontSize: 8.5, marginTop: 5 }]}>{PROPOSAL_INTRO.pricingNote}</Text>

          <Text style={s.eyebrow}>Included in your ongoing service</Text>
          <Bullets items={INCLUDED} />

          <View style={s.box} wrap={false}>
            <Text style={[s.eyebrow, { marginTop: 0 }]}>QuickBooks Online</Text>
            <Text style={s.p}>{qboText(d)}</Text>
            {d.qboPlan !== "Not applicable" ? (
              <Text style={{ color: NAVY }}>
                QBO plan: {d.qboPlan} · Subscription: {d.qboPaidBy === "adept" ? "Included in the monthly fee" : "Client-paid"}
              </Text>
            ) : null}
          </View>

          <Text style={s.eyebrow}>How the engagement works</Text>
          {ENGAGEMENT_STEPS.map((sec) => (
            <Sec key={sec.heading} section={sec} />
          ))}

          <Text style={s.eyebrow}>Investment & payment</Text>
          <View style={s.invest} wrap={false}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 8.5 }}>Monthly professional fee</Text>
              <Text style={{ fontFamily: "Cormorant", fontWeight: 700, fontSize: 18 }}>{fee}</Text>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 8.5 }}>+ applicable taxes · {chosen.name}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 8.5 }}>Payment terms</Text>
              <Text style={{ fontWeight: 600, marginTop: 3 }}>{d.paymentTerms}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 8.5 }}>One-time onboarding / clean-up</Text>
              <Text style={{ fontWeight: 600, marginTop: 3 }}>{money(d.onboardingFee) ? `${money(d.onboardingFee)} + taxes` : "None"}</Text>
            </View>
          </View>

          <Text style={s.eyebrow}>Next step: make it official</Text>
          <Bullets items={NEXT_STEPS} />
          <Text style={[s.p, { marginTop: 8, color: NAVY, fontWeight: 600 }]}>
            Client decision: Accepted recommended package — {signed.name}, {signedAt}
          </Text>
        </View>
        <Footer />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Band title="Bookkeeping Engagement Letter" kicker={longDate(d.effectiveDate)} />
        <View style={s.body}>
          <Text style={{ fontWeight: 600, color: NAVY }}>{d.clientName}</Text>
          {d.businessName ? <Text>{d.businessName}</Text> : null}
          {d.clientContact ? <Text style={{ color: MUTED }}>{d.clientContact}</Text> : null}
          <Text style={[s.p, { marginTop: 12 }]}>Dear {d.clientName},</Text>
          <Text style={s.p}>{engagementOpening()}</Text>
          {engagementSections(d).map((sec) => (
            <Sec key={sec.heading} section={sec} />
          ))}

          <View style={s.sigRow} wrap={false}>
            <View style={s.sig}>
              <Text style={{ fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Client / authorized signatory</Text>
              <Text style={s.sigName}>{signed.name}</Text>
              <Text style={{ marginTop: 4 }}>Name: {signed.name}</Text>
              <Text>Date: {signedAt}</Text>
              <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 4 }}>Signed electronically · IP {signed.ip}</Text>
            </View>
            <View style={s.sig}>
              <Text style={{ fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>{FIRM_LEGAL_NAME}</Text>
              <Text style={s.sigName}>{d.preparedBy}</Text>
              <Text style={{ marginTop: 4 }}>Name: {d.preparedBy}</Text>
              <Text>Date: {signedAt}</Text>
            </View>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
