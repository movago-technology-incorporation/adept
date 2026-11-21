// Free Unsplash photos (Unsplash License) — see CREDITS.md. Static imports give
// Next.js the dimensions and an automatic blur placeholder.
import accountant from "./accountant.jpg";
import calculator from "./calculator.jpg";
import consult from "./consult.jpg";
import documents from "./documents.jpg";
import hero from "./hero.jpg";
import reports from "./reports.jpg";
import smallBusiness from "./small-business.jpg";
import team from "./team.jpg";

export const photos = { accountant, calculator, consult, documents, hero, reports, smallBusiness, team };
export type PhotoKey = keyof typeof photos;
