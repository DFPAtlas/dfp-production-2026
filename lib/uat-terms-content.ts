export const UAT_TERMS_VERSION = '1.0';

export const UAT_TERMS_TITLE = 'DFP UAT Tester Terms, Confidentiality and Intellectual Property Agreement';

export const UAT_TERMS_EFFECTIVE_DATE = '2026-07-28T00:00:00Z';

export const UAT_TERMS_INTRO = 'Please read these Terms carefully before joining the Digital Footprint User Acceptance Testing Programme. By signing and accepting them, you enter a binding agreement with Digital Footprint Limited, trading as Digital Footprint ("DFP", "we", "us" or "our"). Do not participate unless you have read, understood and accepted every section.';

export const UAT_LEGAL_ENTITY = 'Digital Footprint Limited, trading as Digital Footprint';

export const UAT_BUSINESS_ADDRESS = '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom';

export const UAT_COMPANY_NUMBER = '12345678';

export const UAT_LEGAL_EMAIL = 'legal@digital-footprint.uk';

export const UAT_SUPPORT_EMAIL = 'uat@digital-footprint.uk';

export interface TermsSection {
  id: number;
  title: string;
  content: string;
  checkboxLabel: string;
}

export const UAT_TERMS_SECTIONS: TermsSection[] = [
  {
    id: 1,
    title: '1. Programme and Eligibility',
    content: `DFP may allow approved people to test websites, software, prototypes, designs and systems. Testing is only for finding bugs, usability or accessibility issues and giving honest feedback. The tester confirms they are at least 18, their application information is accurate, they can enter an agreement, they participate personally unless DFP agrees otherwise in writing and they will follow test instructions. DFP may accept or reject applications. Participation gives no ownership or commercial rights.`,
    checkboxLabel: 'I have read and understood Section 1.',
  },
  {
    id: 2,
    title: '2. DFP Materials',
    content: `"DFP Materials" includes products, code, databases, architecture, AI systems, prompts, workflows, designs, layouts, prototypes, brands, domains, plans, pricing, customer or supplier information, documents, screenshots, recordings, credentials, unreleased features, bugs, vulnerabilities, reports and anything else accessed or learned through testing. Materials may belong to DFP, a project company, client, partner or licensor.`,
    checkboxLabel: 'I have read and understood Section 2.',
  },
  {
    id: 3,
    title: '3. Limited Testing Permission',
    content: `DFP grants temporary, limited, non-exclusive, non-transferable and revocable permission to use DFP Materials only for assigned UAT work. The tester must not use them for another person or business, copy a product, create a competing product, sell or license any part, share an account, publish an unreleased product or use materials outside authorised testing. Permission ends when testing ends or DFP asks the tester to stop.`,
    checkboxLabel: 'I have read and understood Section 3.',
  },
  {
    id: 4,
    title: '4. Ownership and Intellectual Property',
    content: `All copyright, database, design, trade mark, patent, confidentiality, trade secret, domain, software and other IP rights remain owned by DFP, the relevant project company, client or licensor. Access, testing or comments do not make the tester a creator, co-owner, partner or joint developer.`,
    checkboxLabel: 'I have read and understood Section 4.',
  },
  {
    id: 5,
    title: '5. Confidentiality',
    content: `The tester must keep all non-public and commercially sensitive DFP information confidential. Without written permission they must not disclose, post, copy, forward, store insecurely, photograph, record, upload to external AI or file-sharing services, use commercially or let another person view it. They must use reasonable security measures. Confidentiality starts when access is provided and continues after participation, account closure and product launch for as long as the information remains confidential.`,
    checkboxLabel: 'I have read and understood Section 5.',
  },
  {
    id: 6,
    title: '6. No Copying, Selling or Outside Profit',
    content: `The tester must not use anything learned or accessed through UAT to make money outside DFP without written permission. They must not sell a DFP idea, copy a product under another name, build a competing product using confidential information, give materials to competitors, licence or distribute DFP work, claim ownership, register confidential project names or domains, seek investment using a DFP concept, exploit unreleased knowledge for financial advantage or help another person do so. Independently owned general skills remain theirs, but DFP Confidential Information and protected work must not be used.`,
    checkboxLabel: 'I have read and understood Section 6.',
  },
  {
    id: 7,
    title: '7. Tester Contributions',
    content: `A "Tester Contribution" includes any bug report, feedback, suggestion, annotation, recording, document, design change, test result or material created specifically for UAT. In consideration for participation and any payment or reward, the tester assigns to DFP, with full title guarantee, all intellectual property rights they own in each contribution, worldwide for the full duration of those rights, including future rights and extensions.\n\nIf a right cannot immediately be assigned, they grant DFP an exclusive, irrevocable, perpetual, worldwide, transferable, sub-licensable and royalty-free licence. They waive moral rights as far as law permits and will sign reasonable supporting documents. Pre-existing material remains theirs and must be identified before use.`,
    checkboxLabel: 'I have read and understood Section 7 and agree to the assignment.',
  },
  {
    id: 8,
    title: '8. Bugs, Vulnerabilities and Security',
    content: `Bugs and vulnerabilities must be reported only through DFP's approved system. The tester must not publish or demonstrate them, access unnecessary information or another account, download or alter unauthorised data, install harmful software, run denial-of-service or automated scanning, bypass controls, seek administrator access or continue after being told to stop.\n\nAccidental access to restricted or personal information must be reported immediately and not copied, retained or shared. Accounts are personal; credentials must be secured and never shared, sold or transferred. DFP may monitor test activity for security, auditing, fraud prevention and administration.`,
    checkboxLabel: 'I have read and understood Section 8.',
  },
  {
    id: 9,
    title: '9. Test Data and Conduct',
    content: `Use fictional or approved test data unless instructed otherwise. Do not enter real personal, financial, medical or confidential data without written permission. Only access personal data needed for the test and follow DFP's Privacy Notice and instructions.\n\nAct honestly, professionally and lawfully. Do not submit false reports, create faults for rewards, duplicate one bug, manipulate rewards, use multiple accounts, impersonate others, harass people, upload harmful material, disrupt systems, reverse engineer except where the law does not allow exclusion, or test outside scope.`,
    checkboxLabel: 'I have read and understood Section 9.',
  },
  {
    id: 10,
    title: '10. Payments and Rewards',
    content: `Payments, bug bounties, fees, reimbursements and rewards are subject to DFP's payment rules. Submitting a report does not guarantee payment. DFP may verify and reproduce it. Duplicate, invalid, misleading, fraudulent or out-of-scope reports may not qualify. Amounts may depend on severity, originality and usefulness. DFP may reject a discretionary reward but must not withhold money already legally or contractually due.`,
    checkboxLabel: 'I have read and understood Section 10.',
  },
  {
    id: 11,
    title: '11. Tax Responsibility',
    content: `Except where DFP must make deductions or operate PAYE, the tester is responsible for deciding whether payments must be declared and for paying any Income Tax, National Insurance, VAT or other tax due.\n\nThe tester is responsible for registration, Self Assessment, records and professional advice where needed. DFP is not responsible for the tester's personal tax return, tax payments, penalties, interest or accounting costs unless the law places responsibility on DFP.\n\nIf DFP must operate PAYE, make deductions, report payments or give information to HMRC or another authority, DFP may do so. The tester must provide accurate payment and tax information when reasonably requested.`,
    checkboxLabel: 'I have read and understood Section 11 and accept my tax responsibilities where applicable.',
  },
  {
    id: 12,
    title: '12. Status of Participation',
    content: `Participation does not by itself create employment, worker status, agency, partnership, joint venture, franchise or authority to bind DFP. The tester chooses whether to apply for available tests, subject to each test's rules. Nothing removes employment, worker or tax rights and responsibilities that apply by law based on the real relationship.`,
    checkboxLabel: 'I have read and understood Section 12.',
  },
  {
    id: 13,
    title: '13. Lawful Disclosures',
    content: `Confidentiality does not cover information the tester can prove was already lawfully known without restriction, became public without their breach, was lawfully received from an independent third party, was independently developed without DFP Materials or must legally be disclosed.\n\nWhere lawful, notify DFP before compulsory disclosure and reveal only what is required. Nothing prevents reporting suspected crime to police, reporting to an appropriate regulator or statutory body, making a protected disclosure, cooperating with a lawful investigation, obtaining confidential legal advice or exercising a right that cannot legally be restricted.`,
    checkboxLabel: 'I have read and understood Section 13.',
  },
  {
    id: 14,
    title: '14. Ending Participation',
    content: `DFP may suspend or end participation for breach, suspected fraud, security risk, misuse of confidential information, attempted IP exploitation or programme closure.\n\nThe tester must stop access and use, return or permanently delete DFP Materials, remove saved credentials, delete screenshots or recordings when instructed and confirm deletion if requested. Confidentiality, IP, enforcement and tax clauses continue after termination.`,
    checkboxLabel: 'I have read and understood Section 14.',
  },
  {
    id: 15,
    title: '15. Consequences and System Limitations',
    content: `Subject to law, DFP may suspend access, reject dishonest reports, withhold rewards not yet due, require return or deletion, issue a cease-and-desist notice, seek an injunction, damages or unauthorised profits, request destruction of infringing material, recover court-awarded costs, notify rights holders and report suspected unlawful conduct.\n\nNot every breach is criminal, but deliberate or dishonest conduct may have civil or criminal consequences.\n\nUAT systems are unfinished and may fail, lose test data, display errors, change or become unavailable. They must not be used for real transactions, emergencies, financial decisions or important storage. Nothing excludes liability that cannot legally be excluded.`,
    checkboxLabel: 'I have read and understood Section 15.',
  },
  {
    id: 16,
    title: '16. Changes, General Terms, Law and Contact',
    content: `DFP may update these Terms. Material changes require renewed acceptance and the exact accepted version must be recorded. If a provision is invalid, the rest continues and the affected wording is adjusted only as needed.\n\nThese Terms, test instructions, Privacy Notice and payment rules form the UAT agreement. It is governed by the laws of England and Wales, whose courts have jurisdiction except where mandatory law provides otherwise.\n\nLegal entity: ${UAT_LEGAL_ENTITY}\nAddress: ${UAT_BUSINESS_ADDRESS}\nCompany number: ${UAT_COMPANY_NUMBER}\nLegal email: ${UAT_LEGAL_EMAIL}\nUAT support: ${UAT_SUPPORT_EMAIL}`,
    checkboxLabel: 'I have read and understood Section 16.',
  },
];

export const UAT_FINAL_DECLARATIONS = [
  'I confirm I am at least 18.',
  'I have read and understood the whole agreement.',
  'I understand DFP, its clients or licensors own the products and materials tested.',
  'I will not copy, disclose, sell, distribute or commercially exploit DFP Materials.',
  'I will keep unreleased products, bugs, systems and business information confidential.',
  'I understand misuse may lead to termination and legal action.',
  'I assign my rights in Tester Contributions as stated in Section 7.',
  'I understand my tax responsibilities in Section 11.',
  'I have read and agree to the DFP Privacy Notice.',
  'I intend my electronic signature to bind me to this agreement.',
];

export function getTermsContentHash(): string {
  const content = JSON.stringify({
    title: UAT_TERMS_TITLE,
    version: UAT_TERMS_VERSION,
    effectiveAt: UAT_TERMS_EFFECTIVE_DATE,
    intro: UAT_TERMS_INTRO,
    sections: UAT_TERMS_SECTIONS,
    declarations: UAT_FINAL_DECLARATIONS,
    legalEntity: UAT_LEGAL_ENTITY,
    businessAddress: UAT_BUSINESS_ADDRESS,
    companyNumber: UAT_COMPANY_NUMBER,
    legalEmail: UAT_LEGAL_EMAIL,
    supportEmail: UAT_SUPPORT_EMAIL,
  });
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'sha256-' + Math.abs(hash).toString(16).padStart(8, '0');
}

export const UAT_TERMS_READING_TIME = '15–20 minutes';

export const UAT_TOTAL_SECTIONS = UAT_TERMS_SECTIONS.length;

export const TERMS_CONTENT_JSON = JSON.stringify({
  title: UAT_TERMS_TITLE,
  version: UAT_TERMS_VERSION,
  effectiveAt: UAT_TERMS_EFFECTIVE_DATE,
  intro: UAT_TERMS_INTRO,
  sections: UAT_TERMS_SECTIONS,
  declarations: UAT_FINAL_DECLARATIONS,
  legalEntity: UAT_LEGAL_ENTITY,
  businessAddress: UAT_BUSINESS_ADDRESS,
  companyNumber: UAT_COMPANY_NUMBER,
  legalEmail: UAT_LEGAL_EMAIL,
  supportEmail: UAT_SUPPORT_EMAIL,
});