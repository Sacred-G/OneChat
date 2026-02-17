const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
} = require("docx");

// Per docx-js.md:
// - Never use \n for line breaks (use separate Paragraphs)
// - Use proper lists via numbering config (no unicode bullets)

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 24 }, // 12pt
      },
    },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        run: { size: 56, bold: true, color: "000000", font: "Arial" },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 } },
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, color: "000000", font: "Arial" }, // 14pt
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Centered Support Service", bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("15120 Atkinson Ave Suite 10, Gardena, CA 90249")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Office: (424) 277-9828")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Employment Agreement for Direct Support Staff")] }),
        new Paragraph({ children: [new TextRun("")] }),

        new Paragraph({
          children: [
            new TextRun(
              "This Employment Agreement (\"Agreement\") is entered into on _________________, by and between Centered Support Service, a vendored supported living agency providing services under California Title 17 regulations, located at 15120 AtkinsonAve Suite 10, Gardena, CA 90249 (\"Employer\" or \"Agency\"), and _________________________ (\"Employee\"), residing at _________________________."
            ),
          ],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Employment Status and Regulatory Framework")] }),
        new Paragraph({ children: [new TextRun("Employee is hired as a non-exempt employee under California law, specifically as a Direct Support Staff (DSS) providing Supported Living Services (SLS) to consumers in their own homes. This Agency operates under California Title 17 regulations as a vendored provider through Regional Center Purchase of Service (POS) agreements. Title 22 does not apply to supported living services.")] }),
        new Paragraph({ children: [new TextRun("This position is subject to California Industrial Welfare Commission (IWC) Wage Order 15 for Household Occupations. Where Employee's duties meet the \"personal attendant\" definition (at least 80% of time spent supervising, feeding, dressing, or assisting consumers with activities of daily living due to age, disability, or similar needs, with no more than 20% on general housework), certain exemptions apply, including from standard meal and rest break requirements. If duties do not meet this threshold in a given workweek, Employee falls back to standard non-exempt rules under applicable Wage Orders and the California Labor Code.")] }),
        new Paragraph({ children: [new TextRun("Employment is at-will, meaning either party may terminate the relationship at any time, with or without cause or notice, subject to applicable law.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Scope of Duties")] }),
        new Paragraph({ children: [new TextRun("Employee's primary duties include providing person-centered supported living services to consumers in their own homes, in accordance with each consumer's Individual Service Plan (ISP) and the principles of the Lanterman Developmental Disabilities Services Act. Duties include:")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Assisting with activities of daily living (ADLs), including bathing, dressing, grooming, toileting, mobility assistance, and medication observation (but not administration).")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Supervising consumers to ensure safety and well-being while promoting independence and self-determination.")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Preparing and serving meals, light meal cleanup, and limited housekeeping directly related to consumer care.")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Accompanying consumers on community activities, errands, or appointments as specified in the ISP.")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Documenting consumer care through progress notes that reflect services provided and progress toward ISP goals.")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Adhering to professional conduct standards, including using appropriate, respectful, person-first language; maintaining professional boundaries; and respecting consumer rights to dignity, privacy, and informed choice.")]}),
        new Paragraph({ children: [new TextRun("Duties shall not include significant general housework (e.g., cleaning unrelated to consumer care) to maintain personal attendant status where applicable. Employee agrees to perform duties in compliance with Agency policies, consumer ISPs, Title 17 regulations, Regional Center POS standards, HIPAA, and California confidentiality statutes.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Consumer Rights and Person-Centered Services")] }),
        new Paragraph({ children: [new TextRun("Employee acknowledges and agrees to uphold all consumer rights as required under Title 17 and the Lanterman Act, including:")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Right to dignity and respect in all interactions")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Right to make informed choices about services and daily activities")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Right to privacy and confidentiality")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Right to be free from abuse, neglect, and exploitation")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Right to file grievances without retaliation")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Right to participate in person-centered planning")]}),
        new Paragraph({ children: [new TextRun("Employee must use person-first language (e.g., \"consumer with autism\" rather than \"autistic consumer\") and refer to individuals as \"consumers\" rather than clients, patients, or residents.")] }),

        // Remaining sections kept as paragraphs to keep script size manageable; content preserved.
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Work Hours and Schedule")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Employment may be full-time (typically 30-40 hours per week) or part-time (less than 30 hours per week), based on Agency needs and Employee availability.")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Schedules are variable and assigned by the Agency, potentially including evenings, weekends, or holidays. No live-in or 24-hour shifts.")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Employee may have standby or on-call periods, during which Employee must be available to respond within 30 minutes. Standby/on-call time is compensable if it significantly restricts Employee's personal activities (per California law); otherwise, only actual callback time is paid. Callback pay includes a minimum of 2 hours at the regular rate if called in.")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("All hours worked must be accurately recorded via the CareTrack Pro timekeeping system, including start/end times, overtime, and on-duty meals (if applicable). No off-the-clock work is permitted.")]}),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Compensation")] }),
        new Paragraph({ children: [new TextRun("Base Pay: $19.00 per hour, or the highest applicable local minimum wage based on the city where work is performed. Pay will automatically increase if local/state minimums exceed $19.00.")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("No differentials for overnight, weekend, or holiday shifts; flat rate applies.")]}),
        new Paragraph({ children: [new TextRun("Overtime: If qualifying as a personal attendant under Wage Order 15 and the Domestic Worker Bill of Rights (Labor Code §1454), overtime at 1.5 times the regular rate for hours over 9 per day or 45 per week. If not qualifying, standard overtime applies: 1.5 times for hours over 8 per day or 40 per week, and the first 8 hours on the 7th consecutive day; double time for hours over 12 per day or over 8 on the 7th day.")] }),
        new Paragraph({ children: [new TextRun("Pay Frequency: Bi-weekly via direct deposit.")] }),
        new Paragraph({ children: [new TextRun("Deductions: Standard payroll deductions for taxes, benefits, etc., as required by law.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Meal and Rest Breaks")] }),
        new Paragraph({ children: [new TextRun("Where Employee qualifies as a personal attendant, meal and rest breaks are not required by law. However, to ensure compliance in all scenarios, the Agency provides:")] }),
        new Paragraph({ children: [new TextRun("Rest Breaks: 10-minute net paid rest period for every 4 hours worked (or major fraction thereof), taken in the middle of the work period where feasible. If not provided or interrupted, Employee receives 1 hour of premium pay at the regular rate per violation.")] }),
        new Paragraph({ children: [new TextRun("Meal Periods: For non-personal attendant shifts, a 30-minute unpaid, off-duty meal by the end of the 5th hour (waivable by mutual consent if shift ≤6 hours total); second meal by end of 10th hour (waivable if shift ≤12 hours and first meal taken). If not provided/relieved, 1 hour premium pay per violation.")] }),
        new Paragraph({ children: [new TextRun("For sole-caregiver shifts where duties prevent relief (e.g., cannot leave consumer unattended), see the attached On-Duty Meal Period Agreement. Record all breaks via CareTrack Pro")]}),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Training Requirements (Title 17 Compliance)")] }),
        new Paragraph({ children: [new TextRun("Per Title 17 regulations, Employee must complete orientation training within 7 days of hire. Required training includes:")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Consumer rights and dignity (2 hours)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Mandated reporter training – abuse/neglect reporting requirements (2 hours)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Person-centered planning overview (2 hours)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Emergency procedures and safety (2 hours)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Documentation requirements and systems (2 hours)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Confidentiality and HIPAA compliance (1 hour)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Shadow experienced DSS (minimum 8 hours)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Medication observation training, if applicable (4 hours)")]}),
        new Paragraph({ children: [new TextRun("Annual Refresher Training: Consumer rights (2 hours), Mandated reporting (1 hour), CPR/First Aid recertification, Confidentiality/HIPAA (1 hour), Emergency procedures (1 hour), Person-centered planning (2 hours).")]}),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Medication Observation (Eight Rights)")] }),
        new Paragraph({ children: [new TextRun("Direct Support Staff observe but do NOT administer medications in supported living settings. When observing medication self-administration, Employee must verify the Eight Rights:")] }),
        ...[
          "Right Consumer – Confirm identity",
          "Right Medication – Check prescription label matches",
          "Right Dose – Verify amount is correct",
          "Right Time – Confirm scheduled time",
          "Right Route – Oral, topical, etc. as prescribed",
          "Right Documentation – Record observation immediately",
          "Right to Refuse – Consumer may decline; document refusal",
          "Right Reason – Understand why medication is prescribed",
        ].map((t, idx) =>
          new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun(`${idx + 1}. ${t}`)] })
        ),
        new Paragraph({ children: [new TextRun("Medication errors must be reported immediately to supervisor. Employee must complete medication observation training before providing this support.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Professional Conduct")] }),
        new Paragraph({ children: [new TextRun("Employee agrees to comply with the Agency's standards of conduct as outlined in the Employee Handbook, including but not limited to:")] }),
        new Paragraph({ children: [new TextRun("No Weapons: Strictly prohibited while on duty, including firearms, knives (except for meal prep in care plans), tasers, pepper spray, or any object intended to harm.")] }),
        new Paragraph({ children: [new TextRun("Appropriate Language: Use respectful, person-first language; avoid labels, profanity, sarcasm, or condescending tones. Speak age-appropriately and listen to consumer preferences.")] }),
        new Paragraph({ children: [new TextRun("No Visitors or Unauthorized Interactions: No friends, family, or unauthorized persons at consumer homes; no transporting or engaging consumers outside approved settings unless specified in the ISP.")] }),
        new Paragraph({ children: [new TextRun("Dress Code: Clothing must be clean, non-revealing, and free of offensive messages; maintain hygiene standards.")] }),
        new Paragraph({ children: [new TextRun("Cell Phone Use: Prohibited while driving (no handheld devices; hands-free only if safe and necessary—pull over for calls if possible).")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("10. Incident Reporting (Title 17 Requirements)")] }),
        new Paragraph({ children: [new TextRun("Employee must report incidents according to Title 17 timeframes:")] }),
        new Paragraph({ children: [new TextRun("Immediate: Life-threatening situations, hospitalization, death")] }),
        new Paragraph({ children: [new TextRun("Within 24 Hours: Serious injury, suspected abuse/neglect, law enforcement involvement")] }),
        new Paragraph({ children: [new TextRun("Within 7 Days: Minor incidents requiring documentation")] }),
        new Paragraph({ children: [new TextRun("As a mandated reporter under California law, Employee must immediately report suspected abuse, neglect, or exploitation to the appropriate authorities, including Regional Center, Community Care Licensing (when applicable), and law enforcement (when criminal activity is suspected).")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("11. Reimbursements")] }),
        new Paragraph({ children: [new TextRun("Pursuant to Labor Code §2802, Employee will be reimbursed for necessary business expenses:")] }),
        new Paragraph({ children: [new TextRun("Mileage: If using personal vehicle for consumer-related travel (e.g., community activities, errands as specified in ISP), reimbursed at the IRS standard rate (70 cents per mile for 2025, adjusted annually), in excess of normal commute miles. Employee must maintain a valid driver's license and auto insurance at least at the minimum required by law; responsible for all traffic/parking violations.")] }),
        new Paragraph({ children: [new TextRun("Phone: If personal phone is required for work (e.g., communication, CareTrack Pro app), Employee's hourly rate includes an integrated phone allowance to compensate for reasonable business use of personal devices for work communication and the CareTrack Pro timekeeping application. This compensation is included in the base hourly rate and is not paid separately.")] }),
        new Paragraph({ children: [new TextRun("No reimbursement for routine commuting. No impairment (alcohol/drugs) while driving on Agency business.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("12. Benefits and Leave")] }),
        new Paragraph({ children: [new TextRun("Paid Sick Leave: Employee receives 48 hours of paid sick leave front-loaded on their date of hire and on each anniversary date thereafter. Unused sick leave does not carry over. Use for qualifying reasons under California law and applicable local ordinances.")] }),
        new Paragraph({ children: [new TextRun("PTO: Eligibility and accrual as per Employee Handbook.")] }),
        new Paragraph({ children: [new TextRun("Other Benefits: Supplemental Insurance: Employee will be automatically enrolled in AFLAC supplemental insurance coverage. Premiums are deducted from Employee's paycheck. Employee may opt out of coverage during onboarding or during the annual open enrollment period. Details regarding plan options, coverage levels, and premium amounts are provided during onboarding.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("13. Confidentiality and HIPAA Compliance")] }),
        new Paragraph({ children: [new TextRun("Employee agrees to maintain the confidentiality of all consumer information, including medical records, in strict compliance with HIPAA, California Confidentiality of Medical Information Act (CMIA), and Agency policies. Disclosure is limited to authorized personnel or as required by law. Employee will complete HIPAA training upon hire and annually. Some consumer behaviors may stem from medical conditions (e.g., intellectual disabilities, behavioral support needs); Employee must de-escalate professionally without retaliation. Breach may result in immediate termination and legal action.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("14. Documentation and Recordkeeping")] }),
        new Paragraph({ children: [new TextRun("Employee must:")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Accurately record all hours worked, breaks, and expenses via CareTrack Pro")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Complete progress notes within 24 hours of service delivery that document services provided and consumer progress toward ISP goals")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Use objective, descriptive language in all documentation")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Ensure documentation supports billing for services authorized by Regional Center")]}),
        new Paragraph({ children: [new TextRun("Falsification of records is grounds for immediate termination. Employer maintains records per California wage and hour laws (e.g., Labor Code §1174), available for inspection.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("15. Pre-Hire Requirements")] }),
        new Paragraph({ children: [new TextRun("Employee acknowledges completion of the following prior to beginning work:")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Background clearance (Live Scan fingerprinting)")]}),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Criminal record clearance")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("TB test/clearance")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Valid driver's license and auto insurance (if driving required)")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("CPR/First Aid certification")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun("Reference checks (minimum 3)")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("16. Termination")] }),
        new Paragraph({ children: [new TextRun("At-will employment: May be terminated by either party at any time. Upon termination, final pay issued per Labor Code §201-203 (immediate if Employer-initiated; within 72 hours if Employee quits without notice). Employee must return all Agency property.")] }),
        new Paragraph({ children: [new TextRun("Grounds for Immediate Termination: Consumer abuse or neglect, HIPAA violations, fraud or theft, violence or threats, intoxication on duty, falsification of records.")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("17. Integration and Acknowledgment")] }),
        new Paragraph({ children: [new TextRun("This Agreement integrates with the Agency's Employee Handbook, which Employee acknowledges receiving and agrees to follow. Any conflicts resolved in favor of law. This is the entire agreement; modifications in writing only. Employee acknowledges understanding of Title 17 requirements, consumer rights, and the person-centered service philosophy of supported living services.")] }),

        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SIGNATURES", bold: true })] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("Employee: _____________________________________________")] }),
        new Paragraph({ children: [new TextRun("Printed Name: _____________________________________________")] }),
        new Paragraph({ children: [new TextRun("Date: _____________________________________________")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ children: [new TextRun("Employer: _____________________________________________")] }),
        new Paragraph({ children: [new TextRun("Printed Name/Title: _____________________________________________")] }),
        new Paragraph({ children: [new TextRun("Date: _____________________________________________")] }),
        new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Centered Support Service")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("15120 Atkinson Ave Suite 10, Gardena, CA 90249")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Office: (424) 277-9828")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Employment Agreement for Direct Support Staff – Title 17 Compliant")] }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Centered_Support_Service_Employment_Agreement_DSS_docxjs.docx", buffer);
});
