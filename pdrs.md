
MCP- WC RATING APP
The application processes medical reports to calculate permanent disability ratings for California workers' compensation cases. When a user uploads a PDF medical report, the system converts it to text and provides this as context to an AI assistant. The assistant extracts essential data points such as impairment numbers, WPI values, occupation codes, and dates of injury. The assistant uses integrated tools including a code interpreter for calculations and vision capabilities for analyzing PDRS charts and tables. Following California workers' compensation guidelines, it applies the appropriate FEC multiplier, occupation adjustments, and age modifications. For multiple impairments, it implements Combined Values Chart formulas. The assistant returns its analysis and calculations in a structured JSON format containing the extracted data, calculation steps, rating strings, and final disability percentages. This JSON output maps directly to the calculator interface for clear presentation to users. Key technical requirements include robust PDF text extraction, accurate AI context handling, proper tool integration, precise JSON formatting, and comprehensive error validation. This ensures consistent application of guidelines while maintaining calculation accuracy and processing efficiency.
Show more




PDRS Data Extraction Script
Last message 1 year ago
Frontend Development for Backend Architecture
Last message 1 year ago
Enhanced PDF Extractor for Workers' Comp Documents
Last message 1 year ago
Flexible AI-Powered Rating Combiner Application
Last message 1 year ago
Workers Compensation Rating Calculator
Last message 1 year ago
Memory
Only you
Project memory will show here after a few chats.

Instructions
Add instructions to tailor Claude’s responses

Files
5% of project capacity used

2005PDRS.pdf
5,647 lines

pdf



AITest_Redacted.pdf
1,251 lines

pdf



system-architecture.ts
51 lines

ts



frontend-implementation.tsx
103 lines

tsx



ai-integration.py
88 lines

py



enhanced-pdf-extractor.py
169 lines

py



backend-implementation.py
72 lines

py



pdr-data-manager.py
145 lines

py



pdr-reference-system.py
136 lines

py



rating-calculator.py
157 lines

py



ai-integration.py
88 lines

py


Claude
2005PDRS.pdf
177.17 KB •5,647 lines
•
Formatting may be inconsistent from source

ARNOLD SCHWARZENEGGER
GOVERNOR OF CALIFORNIA
SCHEDULE FOR RATING
PERMANENT DISABILITIES
UNDER THE PROVISIONS OF THE
LABOR CODE OF THE STATE OF CALIFORNIA
Compiled and Published by
STATE OF CALIFORNIA
LABOR AND WORKFORCE DEVELOPMENT AGENCY
DEPARTMENT OF INDUSTRIAL RELATIONS
DIVISION OF WORKERS’ COMPENSATION
ANDREA LYNN HOCH
Administrative Director
January 2005

AUTHORITY
Labor Code section 4660, amended effective April 19, 2004, provides:
4660(a) In determining the percentages of permanent disability, account shall be taken of the nature of the physical injury or
disfigurement, the occupation of the injured employee, and his or her age at the time of the injury, consideration being given to
an employee's diminished future earning capacity.
(b)(1) For purposes of this section, the "nature of the physical injury or disfigurement" shall incorporate the descriptions and
measurements of physical impairments and the corresponding percentages of impairments published in the American Medical
Association (AMA) Guides to the Evaluation of Permanent Impairment (5th Edition).
(2) For purposes of this section, an employee's diminished future earning capacity shall be a numeric formula based on
empirical data and findings that aggregate the average percentage of long-term loss of income resulting from each type of
injury for similarly situated employees. The administrative director shall formulate the adjusted rating schedule based on
empirical data and findings from the Evaluation of California's Permanent Disability Rating Schedule, Interim Report
(December 2003), prepared by the RAND Institute for Civil Justice, and upon data from additional empirical studies.
(c) The Administrative Director shall amend the schedule for the determination of the percentage of permanent disability in
accordance with this section at least once every five years. This schedule shall be available for public inspection and, without
formal introduction in evidence, shall be prima facie evidence of the percentage of permanent disability to be attributed to each
injury covered by the schedule.
(d) The schedule shall promote consistency, uniformity, and objectivity. The schedule and any amendment thereto or revision
thereof shall apply prospectively and shall apply to and govern only those permanent disabilities that result from compensable
injuries received or occurring on and after the effective date of the adoption of the schedule, amendment or revision, as the fact
may be. For compensable claims arising before January 1, 2005, the schedule as revised pursuant to changes made in
legislation enacted during the 2003-04 Regular and Extraordinary Sessions shall apply to the determination of permanent
disabilities when there has been either no comprehensive medical-legal report or no report by a treating physician indicating

the existence of permanent disability, or when the employer is not required to provide the notice required by Section 4061 to
the injured worker.
(e) On or before January 1, 2005, the administrative director shall adopt regulations to implement the changes made to this
section by the act that added this subdivision.
Pursuant to this authority, the Administrative Director has adopted this revised Schedule for Rating Permanent Disabilities.

TABLE OF CONTENTS
Section Page
1 Introduction and Instructions 1-1
2 Impairment Number/Earning Capacity Adjustment 2-1
3 Occupations and Group Numbers 3-1
4 Occupational Variants 4-1
5 Occupational Adjustment 5-1
6 Age Adjustment 6-1
7 Examples 7-1
8 Combined Values Chart 8-1

1-1
SECTION 1 - INTRODUCTION AND INSTRUCTIONS
I. Introduction ...................................................................................................... 1-2
II. Rating Procedures
A. Use of the AMA Guides .......................................................................... 1-3
B. Calculation of Rating
1. Impairment Number..................................................................... 1-4
2. Impairment Standard.................................................................... 1-4
3. Adjustment for Diminished Future Earning Capacity ................. 1-5
4. Occupational Grouping................................................................ 1-8
5. Occupational Variant ................................................................... 1-9
6. Occupational Adjustment............................................................. 1-9
7. Age Adjustment ........................................................................... 1-9
8. Final Permanent Disability Rating............................................... 1-9
9. Rating Formula ............................................................................ 1-9
C. Additional Rating Procedures
1. Formula for Combining Impairments and Disabilities .............. 1-10
2. Adjusting AMA Impairments and Combining Ratings ............. 1-11
3. Rating Impairment Based on Pain ............................................. 1-12
4. Rating Psychiatric Impairment .................................................. 1-12

1-2
SECTION 1 – INTRODUCTION AND INSTRUCTIONS
I. INTRODUCTION
This Schedule for Rating Permanent Disabilities
(hereinafter referred to as the “Schedule”) has been adopted by
the Administrative Director pursuant to Labor Code section
4660. In accordance with this section, the schedule shall be
amended at least once every five years.
The extent of permanent disability that results from an
industrial injury can be assessed once an employee's condition
becomes permanent and stationary. Permanent and stationary
is defined as the point in time when the employee has reached
maximal medical improvement (MMI), meaning his or her
condition is well stabilized and unlikely to change substantially
in the next year with or without medical treatment. (AMA
Guides, p. 2.)
The calculation of a permanent disability rating is
initially based on a evaluating physician’s impairment rating,
in accordance with the medical evaluation protocols and rating
procedures set forth in the American Medical Association
(AMA) Guides to the Evaluation of Permanent Impairment, 5
th
Edition (hereinafter referred to as the “AMA Guides”), which
is hereby incorporated by reference.
Initial impairment ratings are consolidated by body part
(see Adjusting AMA Impairments and Combining Ratings on
page 1-11) and converted to a whole person impairment rating
(hereinafter referred to as “impairment standard”). The
impairment standard is then adjusted to account for diminished
future earning capacity, occupation and age at the time of
injury to obtain a final permanent disability rating.
A permanent disability rating can range from 0% to
100%. Zero percent signifies no reduction of earning capacity,
while 100% represents permanent total disability. A rating
between 0% and 100% represents permanent partial disability.
Permanent total disability represents a level of disability at
which an employee has sustained a total loss of earning

1-3
capacity. Some impairments are conclusively presumed to be
totally disabling. (Lab. Code, §4662.)
Each rating corresponds to a fixed number of weeks of
compensation. Compensation is paid based on the number of
weeks and the weekly compensation rate, in accordance with
Labor Code section 4658.
II RATING PROCEDURES
A. Use of the AMA Guides
The AMA Guides are used by evaluating physicians to
determine the extent of an individual’s impairment. The AMA
Guides use different scales to describe impairment for different
parts and regions of the body. For example, finger impairment
is measured using a finger scale that can range from 0% to
100%. Other commonly used scales in the AMA Guides are the
hand, upper extremity, foot, lower extremity and whole person
scales.
The scales that correspond to different body regions are
equivalent to a percentage of the whole person scale; therefore
these scales are converted to the whole person scale to
determine the appropriate impairment rating. For example, an
upper extremity impairment in the range of 0% to 100% is
equivalent to a whole person impairment in the range of 0% to
60%. The upper extremity impairment is converted to a whole
person impairment by multiplying by .6.
When combining two or more ratings to create a
composite rating, the ratings must be expressed in the same
scale. (See Formula for combining impairments and
disabilities on page 1-10.)
The whole person impairment scale is referred to as
WPI (whole person impairment). The upper and lower
extremity scales are referred to as UE (upper extremity) and LE
(lower extremity), respectively.
A final permanent disability rating is obtained only
after the impairment rating obtained from an evaluating
physician is adjusted for diminished future earning capacity,
occupation and age at the time of injury.

1-4
B. Calculation of Rating
This schedule utilizes an impairment number and an
impairment standard. The impairment standard is then
modified to reflect diminished future earning capacity, the
occupation and the age at the time of injury.
1. Impairment Number
The impairment number identifies the body part, organ
system and/or nature of the injury and takes the form of
“xx.xx.xx.xx”. The first two digits correspond to the chapter
number in the AMA Guides which address the body part/organ
system. Subsequent pairs of digits further refine the
identification of the impairment.
For example, soft tissue lesion of the neck rated under
the range of motion (ROM) method would be represented as
follows:
15. 01. 02. 02
Spine Neck ROM method Soft tissue lesion
Under Section 2 of the Permanent Disability Rating
Schedule, an appropriate impairment number can be found for
most impairments.
2. Impairment Standard
After identification of the appropriate disability
number(s), the next step is to calculate all relevant impairment
standard(s) for the impairments being evaluated. An
impairment standard is a whole person impairment rating under
the AMA Guides, provided by the evaluating physician.
If an impairment based on an objective medical
condition is not addressed by the AMA Guides, physicians
should use clinical judgment, comparing measurable
impairment resulting from the unlisted objective medical
condition to measurable impairment resulting from similar
objective medical conditions with similar impairment of
function in performing activities of daily living. (AMA Guides,
p. 11.)

1-5
A single injury can result in multiple impairments of
several parts of the body. For example, an injury to the arm
could result in limited elbow range of motion and shoulder
instability. Multiple impairments must be combined in a
prescribed manner to produce a final overall rating. (See,
Adjusting AMA Impairments and Combining Ratings on page
1-11.)
It is not always appropriate to combine all impairment
standards resulting from a single injury, since two or more
impairments may have a duplicative effect on the function of
the injured body part. The AMA Guides provide some
direction on what impairments can be used in combination.
Lacking such guidance, it is necessary for the evaluating
physician to exercise his or her judgment in avoiding
duplication.
The impairment standard is assumed to represent the
degree of impairment for a theoretical average worker, i.e., a
worker with average occupational demands on all parts of the
body and at the average age of 39.
3. Adjustment for Diminished Future Earning Capacity
The adjustment for diminished future earning capacity
(FEC) is applied to the impairment standard in accordance with
procedures outlined in section 2 of the Schedule. An
impairment must be expressed using the whole person
impairment scale before applying the FEC adjustment.
The methodology and FEC Adjustment table is
premised on a numerical formula based on empirical data and
findings that aggregate the average percentage of long-term
loss of income resulting from each type of injury for similarly
situated employees. The empirical data was obtained from the
interim report, “Evaluation of California’s Permanent
Disability Rating Schedule (December 2003), prepared by the
RAND Institute for Justice. The result is that the injury
categories are placed into different ranges (based on the ratio of
standard ratings to proportional wage losses). Each of these
ranges will generate a FEC adjustment between 10% and 40%
for each injury category.

1-6
(a) Summary of Methodology:
1. RAND data was used to establish the ratio of average
California standard ratings to proportional wage losses for each
of 22 injury categories. (Data for Adjusting Disability Ratings
to Reflect Diminished Future Earnings and Capacity in
Compliance with SB 899, December 2004, RAND Institute for
Civil Justice, Seabury, Reville, Neuhauser.) These ratios are
listed in Table B below.
2. The range of the ratios for all injury categories is .45 to
1.81. This numeric range was divided into eight evenly spaced
ranges. (See the Range of Ratios columns in Table A below.)
Each injury category will fall within one of these eight ranges,
based on its rating/wage loss ratio.
3. A series of FEC adjustment factors were established to
correspond to the eight ranges described above. (See column 4
of Table A below
.) The smallest adjustment factor is 1.1000
which will result in a 10% increase when applied to the AMA
whole person impairment rating. The largest is 1.4000 which
will result in a 40% increase. The six intermediate adjustment
factors are determined by dividing the difference between 1.1
and 1.4 into seven equal amounts.
4. The formula for calculating the maximum and
minimum adjustment factors is ([1.81/a] x .1) +1 where a
equals the minimum or maximum rating/loss ratio from Table
B below. AMA whole person impairment ratings for injury
categories that correspond to a greater relative loss of earning
capacity will receive a higher FEC adjustment. For example, a
psychiatric impairment receives a higher FEC adjustment
because RAND data shows that a relatively high wage loss
corresponds to the average psychiatric standard permanent
disability rating. A hand impairment would receive a lower
FEC adjustment because RAND data shows a relatively low
wage loss relative to the average psychiatric standard
permanent disability rating.
The FEC rank and adjustment factors that correspond to
relative earnings for the eight evenly-divided ranges are listed
below 
in Table A. The ratio of earnings to losses and the
corresponding rank for each injury category are listed below 
in
Table B. To adjust an impairment standard for earning

1-7
capacity, multiply it by the appropriate adjustment factor from
Table B A and round to the nearest whole number percentage.
Alternatively, a table is provided at the end of Section 2 of the
Schedule which provides the earning capacity adjustment for
all impairment standards and FEC ranks.
Table A
Range of Ratios
Low High FEC Rank Adjustment
Factor
1.647 1.810 One 1.100000
1.476 1.646 Two 1.1429857
1.305 1.475 Three 1.185714
1.134 1.304 Four 1.2286571
0.963 1.133 Five 1.271429
0.792 0.962 Six 1.3143286
0.621 0.791 Seven 1.357143
0.450 0.620 Eight 1.400000
Table B
Part of the Body
Ratio of
Rating
over
Losses
FEC
Rank
Hand/fingers 1.810 One
Vision 1.810 One
Knee 1.570 Two
Other 1.530 Two
Ankle 1.520 Two
Elbow 1.510 Two
Loss of grasping power 1.280 Four
Wrist 1.210 Four
Toe(s) 1.110 Five
Spine Thoracic 1.100 Five
General lower extremity 1.100 Five
Spine Lumbar 1.080 Five
Spine Cervical 1.060 Five
Hip 1.030 Five
General upper extremity 1.000 Five
Heart disease 0.970 Five
General Abdominal 0.950 Six
PT head syndrome 0.930 Six
Lung disease 0.790 Seven
Shoulder 0.740 Seven
Hearing 0.610 Eight
Psychiatric 0.450 Eight
The FEC Rank for the "Other" category is based on average
ratings and proportional earning losses for the following
impairments:

1-8
Impaired rib cage
Cosmetic disfigurement
General chest impairment
Facial disfigurement or impairment
Impaired mouth or jaw
Speech impairment
Impaired nose
Impaired nervous system
Vertigo
Impaired smell
Paralysis
Mental Deterioration
Epilepsy
Skull aperture
4. Occupational Grouping
After the rating is adjusted for diminished future
earning capacity, it is then modified to take into account the
requirements of the specific occupation that the employee was
engaged in when injured.
The Schedule divides the labor market into 45
numbered occupational groups. Each group is assigned a three-
digit code called an occupational group number. The first digit
of the code refers to the arduousness of the duties, ranking jobs
from 1 to 5 in ascending order of physical arduousness; the
second digit separates occupations into broad categories
sharing common characteristics; the third digit differentiates
between occupations within these groups. (See Occupational
Group Chart in Section 3B of the Schedule for a breakdown of
all occupational groups.)
To identify the appropriate occupational group number,
look up the occupation in the list contained in Section 3A of
the Schedule. Each job title is listed along with its
corresponding group number. The appropriate occupation can
generally be found listed under a scheduled or alternative job
title. If the occupation cannot be found, an appropriate
occupational group is determined by analogy to a listed
occupation(s) based on a comparison of duties. (The table
Occupational Group Characteristics in Section 3C of the
Schedule provides a description of each occupational group to
facilitate the determination of a group number.)

1-9
5. Occupational Variant
Section 4 of the Schedule contains tables that cross-
reference impairment numbers and occupational group
numbers to produce an "occupational variant," which is
expressed as a letter. These tables are designed so that variant
"F" represents average demands on the injured body part for
the particular impairment being rated, with letters "E", "D" and
"C" representing progressively lesser demands, and letters "G"
through "J" reflecting progressively higher demands.
6. Occupational Adjustment
After the rating has been adjusted for diminished future
earning capacity, the rating is adjusted next for occupation by
reference to tables found in Section 5 of the Schedule. To use
this section, find the earning capacity-adjusted rating in the
column entitled "Rating" and then read across the table to the
column headed with the appropriate occupational variant. The
intersection of the row and column contains the occupation-
adjusted rating.
7. Age Adjustment
Finally, the rating is adjusted to account for the
worker's age on the date of injury. Section 6 of the Schedule
contains tables for determining the age adjustment. To use this
section, find the occupation-adjusted rating in the column
entitled "Rating" and read across the table to the column with
the injured worker's age on the date of injury.
8. Final Permanent Disability Rating
The number identified on the age adjustment table
represents the final overall permanent disability rating
percentage for a single impairment. (See Subdivisions C.1. and
C.2. on pages 10 and 11 to combine multiple impairments and
disabilities.)
9. Rating Formula
The final rating is generally expressed as a rating
formula, as in the following example:
15.01.02.02 – 8 - [5]10 - 470H – 13 – 11%

1-10
Each component is described below:
15.01.02.02 – Impairment number for cervical spine,
soft tissue lesion
8% – Impairment standard
10% – Rating after adjustment for earning capacity
based on FEC rank 5
470 – Occupational group number for Furniture
assembler, heavy
H – Occupational variant
13% – Rating after occupational adjustment
11% – Rating after adjustment for age of 30
C. Additional Rating Procedures
1. Formula for Combining Impairments and Disabilities
Impairments and disabilities are generally combined
using the following formula where “a” and “b” are the decimal
equivalents of the impairment or disability percentages:
a + b(1-a)
For example, the result of combining 15% and 25%
would be calculated as follows:
.25 + .15(1-.25)
.25 + .15(.75)
.25 + .1125 = .3625 = 36%
Impairment ratings must be expressed in the same scale
to be combined. For example, it would be inappropriate to
combine 15% UE with 20% WPI. Likewise, one cannot
combine an impairment rating with a disability rating.
Except as specified in the section below, when
combining three or more ratings on the same scale into a single
rating, combine the two largest ratings first, rounding the result
to the nearest whole percent. Then combine that result with the
next larger rating, and so on, until all ratings are combined.
Each successive calculation result must be rounded before
performing the next.

1-11
2. Adjusting AMA Impairments and Combining Ratings
As used here, the term “adjusting” refers to adjusting an
AMA impairment rating for diminished future earning
capacity, occupation and age.
Except as specified below, all impairments are
converted to the whole person scale, adjusted, and then
combined to determine a final overall disability rating.
Multiple impairments involving the hand or foot are
combined using standard AMA Guides protocols. The
resulting impairment is converted to whole person impairment
and adjusted before being combined with other impairments of
the same extremity.
Multiple impairments such as those involving a single
part of an extremity, e.g. two impairments involving a shoulder
such as shoulder instability and limited range of motion, are
combined at the upper extremity level, then converted to whole
person impairment and adjusted before being combined with
other parts of the same extremity. Note that some impairments
of the same body part may not be combined because of
duplication.
Impairments with disability numbers in the 16.01 and
17.01 series are converted to whole person impairment and
adjusted before being combined with any other impairment of
the same extremity.
Impairments of an individual extremity are adjusted and
combined at the whole person level with other impairments of
the same extremity before being combined with impairments of
other body parts. For example, an impairment of the left knee
and ankle would be combined before further combination with
an impairment of the opposing leg or the back.
The composite rating for an extremity (after
adjustments) may not exceed the amputation value of the
extremity adjusted for earning capacity, occupation and age.
The occupational variant used to rate an entire extremity shall
be the highest variant of the involved individual impairments.

1-12
3. Rating Impairment Based on Pain
Pursuant to Chapter 18 of the AMA Guides, a whole
person impairment rating based on the body or organ rating
system of the AMA Guides (Chapters 3 through 17) may be
increased by 0% 
up to 3% WPI if the burden of the worker’s
condition has been increased by pain-related impairment in
excess of the pain component already incorporated in the WPI
rating in Chapters 3-17. (AMA Guides, p. 573.)
A physician may perform a formal pain-related
impairment assessment if deemed necessary to justify the
increase of an impairment rating based on the body or organ
rating system. (See Section 18.3f of the AMA Guides starting
on page 575.)
The maximum allowance for pain resulting from a
single injury is 3% WPI regardless of the number of
impairments resulting from that injury.
The addition of up to 3% for pain is to be made at the
whole person level. For example, if an elbow impairment were
to be increased by 3% for pain, the rating for the elbow would
first be converted to the whole person scale, and then
increased. The resultant rating would then be adjusted for
diminished future earning capacity, occupation and age.
In the case of multiple impairments, the evaluating
physician shall, when medically justifiable, attribute the pain in
whole number increments to the appropriate impairments. The
additional percentage added for pain will be applied to the
respective impairments as described in the preceding
paragraph.
4. Rating Psychiatric Impairment
Psychiatric impairment shall be evaluated by the
physician using the Global Assessment of Function (GAF)
scale shown below. The resultant GAF score shall then be
converted to a whole person impairment rating using the GAF
conversion table below.

1-13
(a) Instructions for Determining a GAF score:
STEP 1: Starting at the top level of the GAF scale,
evaluate each range by asking "is either the
individual's symptom severity OR level of
functioning worse than what is indicated in the
range description?"
STEP 2: Keep moving down the scale until the range that
best matches the individual's symptom severity
OR the level of functioning is reached,
whichever is worse.
STEP 3: Look at the next lower range as a double-check
against having stopped prematurely. This range
should be too severe on both symptom severity
and level of functioning. If it is, the appropriate
range has been reached (continue with step 4).
If not, go back to step 2 and continue moving
down the scale.
STEP 4: To determine the specific GAF rating within the
selected 10 point range, consider whether the
individual is functioning at the higher or lower
end of the 10 point range. For example,
consider an individual who hears voices that do
not influence his behavior (e.g., someone with
long-standing Schizophrenia who accepts his
hallucinations as part of his illness). If the
voices occur relatively infrequently (once a
week or less) a rating of 39 or 40 might be most
appropriate. In contrast, if the individual hears
voices almost continuously, a rating of 31 or 32
would be more appropriate.
(b) Global Assessment of Functioning (GAF) Scale
Consider psychological, social, and occupational
functioning on a hypothetical continuum of mental health-
illness. Do not include impairment in functioning due to
physical (or environmental) limitations.

1-14
Code
91 – 100 Superior functioning in a wide range of
activities, life's problems never seem to get out
of hand, is sought out by others because of his
or her many positive qualities. No symptoms.
81 – 90 Absent or minimal symptoms (e.g., mild anxiety
before an exam), good functioning in all areas,
interested and involved in a wide range of
activities, socially effective, generally satisfied
with life, no more than everyday problems or
concerns (e.g., an occasional argument with
family members).
71 – 80 If symptoms are present, they are transient and
expectable reactions to psychosocial stressors
(e.g., difficulty concentrating after family
argument); no more than slight impairment in
social, occupational, or school functioning (e.g.,
temporarily falling behind in schoolwork).
61 – 70 Some mild symptoms (e.g., depressed mood and
mild insomnia) OR some difficulty in social,
occupational, or school functioning (e.g.,
occasional truancy, or theft within the
household), but generally functioning pretty
well, has some meaningful interpersonal
relationships.
51 – 60 Moderate symptoms (e.g., flat affect and
circumstantial speech, occasional panic attacks)
OR moderate difficulty in social, occupational,
or school functioning (e.g.. few friends,
conflicts with peers or co-workers).
41 – 50 Serious symptoms (e.g., suicidal ideation,
severe obsessional rituals, frequent shoplifting)
OR any serious impairment in social,
occupational, or school functioning (e.g., no
friends, unable to keep a job).

1-15
31 – 40 Some impairment in reality testing or
communication (e.g., speech is at times
illogical, obscure, or irrelevant) OR major
impairment in several areas, such as work or
school, family relations, judgment thinking, or
mood (e.g.. depressed man avoids friends,
neglects family, and is unable to work; child
frequently beats up younger children, is defiant
at home and is failing at school).
21 – 30 Behavior is considerably influenced by
delusions or hallucinations OR serious
impairment in communication or judgment (e.g.,
sometimes incoherent, acts grossly
inappropriately, suicidal preoccupation) OR
inability to function in almost all areas (e.g.,
stays in bed all day; no job, home or friends).
11 – 20 Some danger of hurting self or others (e.g.,
suicide attempts without clear expectation of
death; frequently violent; manic excitement) OR
occasionally fails to maintain minimal personal
hygiene (e.g., smears feces) OR gross
impairment in communication (e.g., largely
incoherent or mute).
1 – 10 Persistent danger of severely hurting self or
others (e.g., recurrent violence) OR persistent
inability to maintain minimal personal hygiene
OR serious suicidal act with clear expectation of
death.
0 Inadequate information.
(c) Converting the GAF Score to a Whole Person
Impairment
Locate the GAF score in the table below and read
across to determine the corresponding whole person
impairment (WPI) rating.

1-16
GAF WPI
1 90
2 89
3 89
4 88
5 87
6 87
7 86
8 85
9 84
10 84
11 83
12 82
13 82
14 81
15 80
16 80
17 79
18 78
19 78
20 77
21 76
22 76
23 75
24 74
25 73
26 73
27 72
28 71
29 71
30 70
31 69
32 67
33 65
GAF WPI
34 63
35 61
36 59
37 57
38 55
39 53
40 51
41 48
42 46
43 44
44 42
45 40
46 38
47 36
48 34
49 32
50 30
51 29
52 27
53 26
54 24
55 23
56 21
57 20
58 18
59 17
60 15
61 14
62 12
63 11
64 9
65 8
66 6
GAF WPI
67 5
68 3
69 2
70 0
71 0
72 0
73 0
74 0
75 0
76 0
77 0
78 0
79 0
80 0
81 0
82 0
83 0
84 0
85 0
86 0
87 0
88 0
89 0
90 0
91 0
92 0
93 0
94 0
95 0
96 0
97 0
98 0
99 0
GAF WPI
100 0

2-1
SECTION 2 – IMPAIRMENT NUMBER/EARNING CAPACITY ADJUSTMENT
Category Body Part/Function Page
03 Cardiovascular System – Heart & Aorta ................................................. 2-2
04 Cardiovascular System – Systemic & Pulmonary Arteries ..................... 2-2
05 Respiratory System.................................................................................. 2-2
06 Digestive System ..................................................................................... 2-2
07 Urinary & Reproductive Systems............................................................ 2-2
08 Skin .......................................................................................................... 2-2
09 Hematopoietic System ............................................................................. 2-2
10 Endocrine System .................................................................................... 2-2
11 Ear, Nose & Throat.................................................................................. 2-2
12 Visual System .......................................................................................... 2-2
13 Central & Peripheral Nervous System..................................................... 2-2
14 Mental & Behavioral Disorders............................................................... 2-3
15 Spine ........................................................................................................ 2-3
16 Upper Extremities.................................................................................... 2-4
17 Lower Extremities ................................................................................... 2-4
18 Pain .......................................................................................................... 2-5
Use this section to determine an impairment number and a future earning capacity (FEC)
rank for each body part being evaluated. Then use the table at the end of this section to
adjust the impairment standard for earning capacity. If the impairment is not addressed
by the AMA Guides, choose the closest applicable impairment number, and replace the
last pair of digits with the number 99. For example, a condition that was analogized to a
spinal cord disorder affecting the respiratory system (impairment no. 13.10.01.00) would
take the impairment number 13.10.01.99.

FEC FEC
# Impairment Rank Impairment Impairment# Rank Impairment
2-2
03 – CARDIOVASCULAR SYSTEM – HEART & AORTA
03.01.00.00 5 Valvular Heart Disease
03.02.00.00 5 Coronary Heart Disease
03.03.00.00 5 Congenital Heart Disease
03.04.00.00 5 Cardiomyopathies
03.05.00.00 5 Pericardial Heart Disease
03.06.00.00 5 Arrhythmia
04 – CARDIOVASCULAR SYSTEM – SYSTEMIC & PULMONARY
ARTERIES
04.01.00.00 5 Hypertensive Cardiovascular Disease
04.02.00.00 5 Aortic Disease
04.03.01.00 5 Peripheral Vascular Disease, Upper Extremities
04.03.02.00 5 Peripheral Vascular Disease, Lower Extremities
04.04.00.00 7 Pulmonary Circulation Disease
05 – RESPIRATORY SYSTEM
05.01.00.00 7 Asthma
05.02.00.00 7 Respiratory Disorders
05.03.00.00 7 Cancer
06 – DIGESTIVE SYSTEM
06.01.00.00 6 Upper Digestive Tract
06.02.00.00 6 Colon, Rectum, Anus
06.03.00.00 6 Enterocutaneous Fistulas
06.04.00.00 6 Liver/Biliary Tract
06.05.00.00 6 Hernias
07 – URINARY & REPRODUCTIVE SYSTEMS
07.01.00.00 2 Upper Urinary Tract
07.02.00.00 2 Urinary Diversion
07.03.00.00 2 Bladder
07.04.00.00 2 Urethra
07.05.00.00 2 Reproductive System
08 – SKIN
08.01.00.00 2 Disfigurement
08.02.00.00 2 Scars & Skin Grafts
08.03.00.00 2 Contact Dermatitis
08.04.00.00 2 Latex Allergy
08.05.00.00 2 Skin Cancer
09 – HEMATOPOIETIC SYSTEM
09.01.00.00 2 Hematopoietic Impairment
10 – ENDOCRINE SYSTEM
10.01.00.00 2 Diabetes Mellitus
11 – EAR, NOSE & THROAT
11.01.01.00 8 Ear – Hearing Impairment
11.01.02.00 8 Ear – Vestibular Disorder
11.02.01.00 2 Face/cosmetic
11.02.02.00 2 Face/eye/cosmetic
11.03.01.00 2 Nose/Throat/Related Structures – Respiration
11.03.02.00 2 Nose/Throat/Related Structures – Mastication &
Deglutition
11.03.03.00 2 Nose/Throat/Related Structures – Olfaction & Taste
11.03.04.00 2 Nose/Throat/Related Structures – Voice & Speech
12 – VISUAL SYSTEM
12.01.00.00 1 Visual Acuity
12.02.00.00 1 Visual Field
12.03.00.00 1 Visual System
13 – CENTRAL & PERIPHERAL NERVOUS SYSTEM
13.01.00.00 6 Consciousness Disorder
13.02.00.00 2 Episodic Neurologic Disorder
13.03.00.00 6 Arousal Disorder
13.04.00.00 2 Cognitive Impairment

FEC FEC
# Impairment Rank Impairment Impairment# Rank Impairment
2-3
13.05.00.00 2 Language Disorder
13.06.00.00 8 Behavioral/Emotional Disorder
13.07.01.00 2 Cranial Nerve – Olfactory
13.07.02.00 1 Cranial Nerve – Optic
13.07.03.00 2 Cranial Nerve – Oculomotor, Trochlear & Abducens
13.07.04.00 2 Cranial Nerve – Trigeminal
13.07.05.00 2 Cranial Nerve – Facial
13.07.06.01 8 Cranial Nerve – Vestibulocochlear – Vertigo
13.07.06.02 8 Cranial Nerve – Vestibulocochlear – Tinnitus
13.07.07.00 2 Cranial Nerve – Glossopharyngeal & Valgus
13.07.08.00 2 Cranial Nerve – Spinal Accessory
13.07.09.00 2 Cranial Nerve – Hypoglossal
13.08.00.00 5 Station, Gait, Movement
13.09.00.00 5 Upper Extremities
13.10.01.00 7 Spinal Cord Disorder – Respiratory
13.10.02.00 2 Spinal Cord Disorder – Urinary
13.10.03.00 2 Spinal Cord Disorder – Anorectal
13.10.04.00 2 Spinal Cord Disorder – Sexual
13.11.01.01 5 Chronic Pain – Upper Extremities – Causalgia
13.11.01.02 5 Chronic Pain – Upper Extremities – Post-traumatic
Neuralgia
13.11.01.03 5 Chronic Pain – Upper Extremities – Reflex
Sympathetic Dystrophy
13.11.02.01 5 Chronic Pain – Lower Extremities – Causalgia
13.11.02.02 5 Chronic Pain – Lower Extremities – Post-traumatic
Neuralgia
13.11.02.03 5 Chronic Pain – Lower Extremities – Reflex
Sympathetic Dystrophy
13.12.01.01 5 Peripheral Nerve System – Spine – Sensory
13.12.01.02 5 Peripheral Nerve System – Spine – Motor
13.12.02.01 5 Peripheral Nerve System – Upper Extremity – Sensory
13.12.02.02 5 Peripheral Nerve System – Upper Extremity – Motor
13.12.03.01 5 Peripheral Nerve System – Lower Extremity – Sensory
13.12.03.02 5 Peripheral Nerve System – Lower Extremity – Motor
14 – MENTAL & BEHAVIORIAL DISORDERS
14.01.00.00 8 Psychiatric – Mental and Behavioral
15 – SPINE
15.01.01.00 5 Cervical – Diagnosis-related Estimate (DRE)
15.01.02.01 5 Cervical – Range of Motion (ROM) – Fracture
15.01.02.02 5 Cervical – Range of Motion – Soft Tissue Lesion
15.01.02.03 5 Cervical – Range of Motion – Spondylolysis, no
operation
15.01.02.04 5 Cervical – Range of Motion – Stenosis, with operation
15.01.02.05 5 Cervical – Range of Motion – Nerve Root/Spinal Cord-
Sensory
15.01.02.06 5 Cervical – Range of Motion – Nerve Root/Spinal Cord
– Motor
15.02.01.00 5 Thoracic – Diagnosis-related Estimate
15.02.02.01 5 Thoracic – Range of Motion – Fracture
15.02.02.02 5 Thoracic – Range of Motion – Soft Tissue Lesion
15.02.02.03 5 Thoracic – Range of Motion – Spondylolysis, no
operation
15.02.02.04 5 Thoracic – Range of Motion – Stenosis, with operation
15.02.02.05 5 Thoracic – Range of Motion – Nerve Root/Spinal Cord
– Sensory
15.02.02.06 5 Thoracic – Range of Motion – Nerve Root/Spinal Cord
– Motor
15.03.01.00 5 Lumbar – Diagnosis-related Estimate
15.03.02.01 5 Lumbar – Range of Motion – Fracture
15.03.02.02 5 Lumbar – Range of Motion – Soft Tissue Lesion
15.03.02.03 5 Lumbar – Range of Motion – Spondylolysis, no
operation
15.03.02.04 5 Lumbar – Range of Motion – Stenosis, with operation
15.03.02.05 5 Lumbar – Range of Motion – Nerve Root/Spinal Cord
– Sensory
15.03.02.06 5 Lumbar – Range of Motion – Nerve Root/Spinal Cord
– Motor
15.04.01.00 5 Corticospinal Tract – One Upper Extremity
15.04.02.00 5 Corticospinal Tract – Two Upper Extremities
15.04.03.00 5 Corticospinal Tract – Station/Gait Disorder

FEC FEC
# Impairment Rank Impairment Impairment# Rank Impairment
2-4
15.04.04.00 2 Corticospinal Tract – Bladder Impairment
15.04.05.00 2 Corticospinal Tract – Anorectal Impairment
15.04.06.00 2 Corticospinal Tract – Sexual Impairment
15.04.07.00 7 Corticospinal Tract – Respiratory Impairment
15.05.01.00 5 Pelvic – Healed Fracture
15.05.02.00 5 Pelvic – Healed Fracture with Displacement
15.05.03.00 5 Pelvic – Healed Fracture with Deformity
16 – UPPER EXTREMITIES
16.01.01.01 5 Arm – Amputation/Deltoid insertion proximally
16.01.01.02 5 Arm – Amputation/Bicipital insertion proximally
16.01.01.03 5 Arm – Amputation/Wrist proximally
16.01.01.04 5 Arm – Amputation/All fingers at MP joint proximally
16.01.02.01 5 Arm – Peripheral neuropathy – Brachial plexus
16.01.02.02 4 Arm – Peripheral neuropathy –
Entrapment/compression – Carpal tunnel
16.01.02.03 5 Arm – Peripheral neuropathy –
Entrapment/compression – Other
16.01.02.04 5 Arm – Peripheral neuropathy – CRPS I
16.01.02.05 5 Arm – Peripheral neuropathy – CRPS II
16.01.03.00 5 Arm – Peripheral vascular
16.01.04.00 4 Arm – Grip/pinch strength
16.01.05.00 5 Arm – Other
16.02.01.00 7 Shoulder – Range of motion
16.02.02.00 7 Shoulder – Other
16.03.01.00 2 Elbow/forearm – Range of motion
16.03.02.00 2 Elbow/forearm – Other
16.04.01.00 4 Wrist – Range of motion
16.04.02.00 4 Wrist – Other
16.05.01.00 1 Hand/multiple fingers – Range of motion
16.05.02.00 1 Hand/multiple fingers – Amputation
16.05.03.00 1 Hand/multiple fingers – Sensory
16.05.04.00 1 Hand/multiple fingers – Other
16.06.01.01 1 Thumb – Range of motion
16.06.01.02 1 Thumb – Amputation
16.06.01.03 1 Thumb – Sensory
16.06.01.04 1 Thumb – Other
16.06.02.01 1 Index – Range of motion
16.06.02.02 1 Index – Amputation
16.06.02.03 1 Index – Sensory
16.06.02.04 1 Index – Other
16.06.03.01 1 Middle – Range of motion
16.06.03.02 1 Middle – Amputation
16.06.03.03 1 Middle – Sensory
16.06.03.04 1 Middle – Other
16.06.04.01 1 Ring – Range of motion
16.06.04.02 1 Ring – Amputation
16.06.04.03 1 Ring – Sensory
16.06.04.04 1 Ring – Other
16.06.05.01 1 Little – Range of motion
16.06.05.02 1 Little – Amputation
16.06.05.03 1 Little – Sensory
16.06.05.04 1 Little – Other
17 – LOWER EXTREMITIES
17.01.01.00 5 Leg – Limb Length
17.01.02.01 5 Leg – Amputation/Knee proximally
17.01.02.02 5 Leg – Amputation/MTP joint proximally
17.01.03.00 5 Leg – Skin Loss
17.01.04.00 5 Leg – Peripheral Nerve
17.01.05.00 5 Leg – Vascular
17.01.06.00 5 Leg – Causalgia/RSD
17.01.07.00 5 Leg – Gait Derangement
17.01.08.00 5 Leg – Other
17.02.10.00 5 Pelvis – Diagnosis-based estimate (DBE) – Fracture
17.03.01.00 5 Hip – Muscle Atrophy
17.03.02.00 5 Hip – Ankylosis
17.03.03.00 5 Hip – Arthritis
17.03.04.00 5 Hip – Range of Motion

FEC FEC
# Impairment Rank Impairment Impairment# Rank Impairment
2-5
17.03.05.00 5 Hip – Muscle Strength
17.03.06.00 5 Hip – Other
17.03.10.01 5 Hip – Diagnosis-based Estimate – Hip/Replacement
17.03.10.02 5 Hip – Diagnosis-based Estimate – Hip/Femoral Neck
Fracture
17.03.10.03 5 Hip – Diagnosis-based Estimate – Hip/Arthroplasty
17.03.10.04 5 Hip – Diagnosis-based Estimate – Trochanteric bursitis
17.04.10.00 5 Femur – Diagnosis-based Estimate – Fracture
17.05.01.00 2 Knee – Muscle Atrophy
17.05.02.00 2 Knee – Ankylosis
17.05.03.00 2 Knee – Arthritis
17.05.04.00 2 Knee – Range of Motion
17.05.05.00 2 Knee – Muscle Strength
17.05.06.00 2 Knee – Other
17.05.10.01 2 Knee – Diagnosis-based Estimate –
Subluxation/dislocation
17.05.10.02 2 Knee – Diagnosis-based Estimate – Fracture
17.05.10.03 2 Knee – Diagnosis-based Estimate – Patellectomy
17.05.10.04 2 Knee – Diagnosis-based Estimate – Menisectomy
17.05.10.05 2 Knee – Diagnosis-based Estimate – Cruciate/collateral
Ligament
17.05.10.06 2 Knee – Diagnosis-based Estimate – Plateau Fracture
17.05.10.07 2 Knee – Diagnosis-based Estimate –
Supra/Intercondylar Fracture
17.05.10.08 2 Knee – Diagnosis-based Estimate – Total Replacement
17.05.10.09 2 Knee – Diagnosis-based Estimate – Proximal Tibial
osteotomy
17.06.10.00 5 Tibia/fibula – Diagnosis-based Estimate – fracture
17.07.01.00 2 Ankle – Muscle Atrophy
17.07.02.00 2 Ankle – Ankylosis
17.07.03.00 2 Ankle – Arthritis
17.07.04.00 2 Ankle – Range of Motion
17.07.05.00 2 Ankle – Muscle Strength
17.07.06.00 2 Ankle – Other
17.07.10.01 2 Ankle – Diagnosis-based Estimate – Ligament
Instability
17.07.10.02 2 Ankle – Diagnosis-based Estimate – Fracture
17.08.01.00 2 Foot – Muscle Atrophy
17.08.02.00 2 Foot – Ankylosis
17.08.03.00 2 Foot – Arthritis
17.08.04.00 2 Foot – Range of Motion
17.08.05.00 2 Foot – Muscle Strength
17.08.06.00 2 Foot – Other
17.08.10.01 2 Foot – Diagnosis-based Estimate – Hind Foot Fracture
17.08.10.02 2 Foot – Diagnosis-based Estimate – Loss of Tibia
17.08.10.03 2 Foot – Diagnosis-based Estimate – Intra-articular
Fracture
17.08.10.04 2 Foot – Diagnosis-based Estimate – Calvus
17.08.10.05 2 Foot – Diagnosis-based Estimate – Rocker Bottom
17.08.10.06 2 Foot – Diagnosis-based Estimate – Avascular Necrosis
17.08.10.07 2 Foot – Diagnosis-based Estimate – Metatarsal fracture
17.09.01.00 5 Toes – Muscle Atrophy
17.09.02.00 5 Toes – Ankylosis
17.09.03.00 5 Toes – Arthritis
17.09.04.00 5 Toes – Range of Motion
17.09.05.00 5 Toes – Muscle Strength
17.09.06.00 5 Toes – Amputation
17.09.07.00 5 Toes – Other
18 – PAIN
18.00.00.00 Variable Pain – use FEC rank for involved body part.

2-6
FUTURE EARNING CAPACITY (FEC) ADJUSTMENT TABLE 
Directions: To adjust for earning capacity, look up the
impairment standard in the top row (bolded numbers), and
read down to the entry corresponding to the applicable
future earning capacity rank
FEC AMA Whole Person Impairment Standard
Rank 
1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
One 
1 2 3 4 6 7 8 9 10 11 12 13 14 15 17 18 19 20 21 22
Two 
1 2 3 5 6 7 8 9 10 11 13 14 15 16 17 18 19 21 22 23
Three 
1 2 4 5 6 7 8 9 11 12 13 14 15 17 18 19 20 21 23 24
Four 
1 2 4 5 6 7 9 10 11 12 14 15 16 17 18 20 21 22 23 25
Five 
1 3 4 5 6 8 9 10 11 13 14 15 17 18 19 20 22 23 24 25
Six 
1 3 4 5 7 8 9 11 12 13 14 16 17 18 20 21 22 24 25 26
Seven 
1 3 4 5 7 8 10 11 12 14 15 16 18 19 20 22 23 24 26 27
Eight 
1 3 4 6 7 8 10 11 13 14 15 17 18 20 21 22 24 25 27 28
FEC AMA Whole Person Impairment Standard
Rank 
21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40
One 
23 24 25 26 28 29 30 31 32 33 34 35 36 37 39 40 41 42 43 44
Two 
24 25 26 27 29 30 31 32 33 34 35 37 38 39 40 41 42 43 45 46
Three 
25 26 27 28 30 31 32 33 34 36 37 38 39 40 42 43 44 45 46 47
Four 
26 27 28 29 31 32 33 34 36 37 38 39 41 42 43 44 45 47 48 49
Five 
27 28 29 31 32 33 34 36 37 38 39 41 42 43 45 46 47 48 50 51
Six 
28 29 30 32 33 34 35 37 38 39 41 42 43 45 46 47 49 50 51 53
Seven 
29 30 31 33 34 35 37 38 39 41 42 43 45 46 48 49 50 52 53 54
Eight 
29 31 32 34 35 36 38 39 41 42 43 45 46 48 49 50 52 53 55 56

2-7
FEC AMA Whole Person Impairment Standard
Rank 
41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60
One 
45 46 47 48 50 51 52 53 54 55 56 57 58 59 61 62 63 64 65 66
Two 
47 48 49 50 51 53 54 55 56 57 58 59 61 62 63 64 65 66 67 69
Three 
49 50 51 52 53 55 56 57 58 59 60 62 63 64 65 66 68 69 70 71
Four 
50 52 53 54 55 57 58 59 60 61 63 64 65 66 68 69 70 71 72 74
Five 
52 53 55 56 57 58 60 61 62 64 65 66 67 69 70 71 72 74 75 76
Six 
54 55 57 58 59 60 62 63 64 66 67 68 70 71 72 74 75 76 78 79
Seven 
56 57 58 60 61 62 64 65 67 68 69 71 72 73 75 76 77 79 80 81
Eight 
57 59 60 62 63 64 66 67 69 70 71 73 74 76 77 78 80 81 83 84
FEC AMA Whole Person Impairment Standard
Rank 
61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80
One 
67 68 69 70 72 73 74 75 76 77 78 79 80 81 83 84 85 86 87 88
Two 
70 71 72 73 74 75 77 78 79 80 81 82 83 85 86 87 88 89 90 91
Three 
72 74 75 76 77 78 79 81 82 83 84 85 87 88 89 90 91 92 94 95
Four 
75 76 77 79 80 81 82 84 85 86 87 88 90 91 92 93 95 96 97 98
Five 
78 79 80 81 83 84 85 86 88 89 90 92 93 94 95 97 98 99 100 100
Six 
80 81 83 84 85 87 88 89 91 92 93 95 96 97 99 100 100 100 100 100
Seven 
83 84 86 87 88 90 91 92 94 95 96 98 99 100 100 100 100 100 100 100
Eight 
85 87 88 90 91 92 94 95 97 98 99 100 100 100 100 100 100 100 100 100
FEC AMA Whole Person Impairment Standard
Rank 
81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100
One 
89 90 91 92 94 95 96 97 98 99 100 100 100 100 100 100 100 100 100 100
Two 
93 94 95 96 97 98 99 100 100 100 100 100 100 100 100 100 100 100 100 100
Three 
96 97 98 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100
Four 
100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100
Five 
100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100
Six 
100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100
Seven 
100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100
Eight 
100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100

3-1
SECTION 3 - OCCUPATIONS AND GROUP NUMBERS
Section 3 contains two parts. Part A contains an alphabetized list of occupations with their scheduled
occupational group numbers. Find the occupation in the alphabetical list and record the associated
group number. Note that some occupations may have more than one title and that all variations may not
be listed. Also note that some titles may appear more than once, but pertain to different industries. Care
should be taken to ensure that the industry designated also matches the occupation under consideration.
Part B contains an occupational group chart which illustrates the overall system for classifying
occupations into groups. Part C contains a description and sample occupations of each group. This
information may be useful if the occupation cannot be located in Part A. Simply determine the basic
functions and activities of the occupation under consideration and relate it to a comparable scheduled
occupation to determine the appropriate group number.
After establishing the occupation and group number, turn to Section 4 to determine the occupational
variant.

Group Occupation Industry Group Occupation Industry
No. No.
3-2
PART A – LIST OF OCCUPATIONS AND GROUP NUMBERS
111 ABSTRACTOR profess. & kin.
110 ACADEMIC DEAN education
110 ACCOUNT EXECUTIVE business ser.
111 ACCOUNT INFORMATION CLERK utilities
111 ACCOUNTANT profess. & kin.
111 ACCOUNTANT, PROPERTY profess. & kin.
111 ACCOUNTING CLERK clerical
590 ACROBAT amuse. & rec.
210 ACTOR amuse. & rec.
310 ACUPRESSURIST medical ser.
211 ADDRESSING MACHINE OPERATOR clerical
111 ADMINISTRATIVE ANALYST any industry
211 ADMINISTRATIVE CLERK clerical
212 ADMINISTRATOR, HEALTH CARE
FACILITY
medical ser.
111 ADMISSIONS EVALUATOR education
212 AIR ANALYST profess. & kin.
481 AIR CONDITIONING INSTALLER
SERV., WINDOW UNIT
construction
480 AIR HAMMER OPERATOR construction
212 AIR TRAFFIC CONTROL SPECIALIST,
TOWER
government ser.
380 AIRCRAFT BODY REPAIRER air trans.
380 AIRCRAFT BONDED STRUCTURES
REPAIRER
aircraft mfg.
460 AIRCRAFT SERVICE WORKER air trans.
341 AIRCRAFT SERVICE ATTENDANT air trans.
380 AIRFRAME AND POWER PLANT
MECHANIC
aircraft mfg.
213 AIRLINE TRANSPORTATION AGENT air trans.
213 AIRPLANE INSPECTOR air trans.
250 AIRPLANE PILOT, COMMERCIAL air trans.
322 AIRPLANE FLIGHT ATTENDANT air trans.
380 ALARM SERVICE TECHNICIAN business ser.
111 ALARM SIGNAL OPERATOR any industry
560 AMBULANCE ATTENDANT medical ser.
560 AMBULANCE DRIVER medical ser.
340 AMUSEMENT PARK ATTENDANT amuse. & rec.
210 AMUSEMENT PARK ENTERTAINER amuse. & rec.
220 ANESTHESIOLOGIST medical ser.
310 ANGIOGRAM TECHNOLOGIST medical ser.
491 ANIMAL KEEPER amuse. & rec.
390 ANIMAL TRAINER amuse. & rec.
491 ANIMAL RIDE ATTENDANT amuse. & rec.
210 ANNOUNCER radio-tv broad.
460 ANODIZER any industry
380 ANTENNA INSTALLER any industry
380 ANTENNA INSTALLER, SATELLITE
COMMUNICATIONS
any industry
110 APPEALS REFEREE government ser.
111 APPOINTMENT CLERK clerical
212 APPRAISER, ART any industry
212 APPRAISER, BUSINESS EQPT. any industry
213 APPRAISER, REAL ESTATE real estate
330 ARBOR PRESS OPERATOR any industry
370 ARC CUTTER welding
212 ARCHITECT profess. & kin.
111 ARCHIVIST profess. & kin.
320 ARMATURE BANDER any industry
350 ARMORED CAR DRIVER business ser.
390 ARMORED CAR GUARD business ser.
111 ART DIRECTOR motion picture
221 ARTIFICIAL FLOWER MAKER button & notion
220 ARTIFICIAL PLASTIC EYE MAKER optical goods
480 ASPHALT RAKER construction
351 ASPHALT SURFACE HEATER
OPERATOR
construction
351 ASPHALT DISTRIBUTOR TENDER construction
351 ASPHALT PAVING MACHINE
OPERATOR
construction
120 ASSEMBLER jewelry-silver.
221 ASSEMBLER house. appl.
221 ASSEMBLER, ELECTRIC MOTOR elec. equip.
370 ASSEMBLER, INTERNAL
COMBUSTION ENGINE
engine-turbine
370 ASSEMBLER, MOTOR VEHICLE auto. mfg.
221 ASSEMBLER, MUSICAL
INSTRUMENTS
musical inst.

Group Occupation Industry Group Occupation Industry
No. No.
3-3
320 ASSEMBLER, OFFICE MACHINES office machines
221 ASSEMBLER, PRODUCTION any industry
120 ASSEMBLER, SEMICONDUCTOR electron. comp.
221 ASSEMBLER, SMALL PRODUCTS any industry
380 ASSEMBLER, SUBASSEMBLY aircraft mfg.
380 ASSEMBLER-INSTALLER, GENERAL aircraft mfg.
590 ATHLETE, PROFESSIONAL amuse. & rec.
390 ATHLETIC TRAINER amuse. & rec.
111 ATTENDANCE CLERK education
111 AUCTION CLERK retail trade
210 AUCTIONEER retail trade
212 AUDIO OPERATOR radio-tv broad.
221 AUDIO VIDEO REPAIRER any industry
251 AUDIOVISUAL PRODUCTION
SPECIALIST
profess. & kin.
111 AUDIT CLERK clerical
111 AUDITOR profess. & kin.
251 AUDITOR, FIELD profess. & kin.
330 AUTOCLAVE OPERATOR aircraft mfg.
370 AUTOMATED EQUIPMENT
INSTALLER
machinery mfg.
370 AUTOMOBILE ASSEMBLER auto. mfg.
340 AUTOMOBILE DETAILER automotive ser.
111 AUTOMOBILE LOCATOR retail trade
321 AUTOMOBILE UPHOLSTERER automotive ser.
340 AUTOMOBILE WASHER & POLISHER automotive ser.
460 AUTOMOBILE WRECKER wholesale tr.
370 AUTOMOBILE ACCESSORIES
INSTALLER
automotive ser.
370 AUTOMOBILE BODY REPAIRER automotive ser.
214 AUTOMOBILE REPAIR SERVICE
ESTIMATOR
automotive ser.
370 AUTOMOBILE SERVICE STATION
MECHANIC
automotive ser.
321 AUTO PAINTER any industry
380 AWNING MAKER tex. prod., nec.
240 BABYSITTER domestic ser.
460 BAGGAGE HANDLER r.r. trans.
212 BAGGAGE SCREENER, AIRPO air transport.
214 BAGGER retail trade;
groceries
490 BAILIFF government ser.
322 BAKER hotel & rest.
460 BAKER HELPER bakery products
420 BAKER bakery products
322 BAKERY SUPERVISOR bakery products
330 BAND-SAWING MACHINE
OPERATOR
fabrication, nec
230 BAND SAWMILL OPERATOR saw. & plan.
211 BANK CLERK financial
290 BARBER personal ser.
330 BARREL ASSEMBLER wood. container
460 BARREL FILLER beverage
322 BARTENDER hotel & rest.
221 BASKET MAKER wood. container
230 BATCH STILL OPERATOR chemical
321 BATTERY ASSEMBLER, DRY CELL elec. equip.
321 BATTERY REPAIRER any industry
290 BEAUTICIAN personal ser.
230 BED LASTER boot & shoe
491 BEEKEEPER agriculture
360 BELLHOP hotel & rest.
221 BENCH WORKER optical goods
330 BENDING MACHINE OPERATOR any industry
493 BICYCLE MESSENGER business ser.
320 BICYCLE REPAIRER any industry
480 BILLBOARD & SIGN ERECTOR fabrication, nec
480 BILLBOARD ERECTOR HELPER construction
112 BILLING CLERK clerical
213 BILLPOSTER business ser.
230 BINDERY WORKER print. & pub.
212 BIOCHEMIST profess. & kin.
110 BIOLOGY SPECIMEN TECHNICIAN profess. & kin.
320 BIOMEDICAL EQUIPMENT
TECHNICIAN
profess. & kin.
430 BLACKSMITH forging
460 BLACKSMITH HELPER forging
480 BLASTER mining;
construction
332 BLENDER petrol. refin.
240 BLIND AIDE personal ser.
330 BLISTER MACHINE OPERATOR any industry
220 BLOCKER AND CUTTER, CONTACT
LENS
optical goods

Group Occupation Industry Group Occupation Industry
No. No.
3-4
221 BLOCKER, HAND hat & cap
230 BLUEPRINTING MACHINE
OPERATOR
any industry
380 BOAT REPAIRER ship-boat mfg.
380 BOAT RIGGER retail trade
380 BOATBUILDER, WOOD ship-boat mfg.
390 BODYGUARD personal ser.
332 BOILER OPERATOR any industry
332 BOILER TENDER any industry
430 BOILERMAKER struct. metal
460 BOILERMAKER HELPER struct. metal
111 BONDING AGENT business ser.
322 BONER, MEAT meat products
221 BOOK REPAIRER any industry
320 BOOKBINDER print. & pub.
112 BOOKKEEPER clerical
112 BOOKKEEPER, GENERAL LEDGER clerical
351 BOOM CONVEYOR OPERATOR any industry
330 BORING MACHINE OPERATOR woodworking
230 BOTTLE PACKER beverage
390 BOUNCER amuse. & rec.
390 BOUNTY HUNTER business ser.
221 BOW MAKER any industry
493 BOWLER, PROFESSIONAL amuse. and rec.
331 BOWLING BALL MOLDER toy-sport equip.
321 BOX MAKER, PAPERBOARD any industry
321 BOX MAKER, WOOD wood. container
230 BOX PRINTING MACHINE OPERATOR any industry
230 BOX BLANK MACHINE OPERATOR wood. container
460 BOX FOLDING MACHINE OPERATOR paper goods
321 BOX SPRING MAKER furniture
211 BRAILLE OPERATOR print. & pub.
111 BRAILLE PROOFREADER nonprofit org.
370 BRAKE REPAIRER automotive ser.
330 BRAKE PRESS OPERATOR any industry
330 BRAZING MACHINE OPERATOR welding
330 BREAD WRAPPING MACHINE
OPERATOR
any industry
332 BREWERY CELLAR WORKER beverage
331 BRICK AND TILE MAKING MACHINE
OPERATOR
brick & tile
481 BRICKLAYER construction
481 BRICKLAYER APPRENTICE construction
480 BRICKLAYER HELPER construction
482 BRIDGE MAINTENANCE WORKER construction
482 BRIDGE WORKER construction
331 BRIQUETTE MACHINE OPERATOR fabrication, nec
330 BROACHING MACHINE OPERATOR,
PRODUCTION
machine shop
321 BROOM STITCHER fabrication, nec
492 BUCKER logging
111 BUDGET ANALYST government ser.
321 BUFFER any industry
230 BUFFING MACHINE TENDER,
AUTOMATIC
any industry
480 BUILDING CLEANER, OUTSIDE any industry
213 BUILDING INSPECTOR government ser.
213 BUILDING INSPECTOR insurance
380 BUILDING MAINTENANCE REPAIRER any industry
351 BULLDOZER OPERATOR any industry
380 BURGLAR ALARM
INSTALLER/REPAIRER
business ser.
330 BURNING MACHINE OPERATOR welding
250 BUS DRIVER motor trans.
322 BUS PERSON hotel & rest.
110 BUSINESS MANAGER amuse. & rec.
111 BUSINESS REPRESENTATIVE, LABOR
UNION
profess. & kin.
420 BUTCHER, ALL-ROUND meat products
322 BUTCHER, MEAT hotel & rest.
240 BUTLER domestic ser.
460 BUTTERMAKER dairy products
230 BUTTONHOLE AND BUTTON SEWING
MACHINE OPERATOR
garment
320 CABINETMAKER woodworking
320 CABLE ASSEMBLER AND SWAGER aircraft mfg.
350 CABLE CAR OPERATOR r.r. transportation
380 CABLE INSTALLER-REPAIRER utilities
380 CABLE MAINTAINER utilities
480 CABLE PULLER construction
380 CABLE SPLICER construction
481 CABLE TELEVISION INSTALLER radio-tv broad.
380 CABLE TESTER tel. & tel.
120 CAD DESIGNER profess. & kindred

Group Occupation Industry Group Occupation Industry
No. No.
3-5
360 CADDIE amuse. & rec.
322 CAFETERIA ATTENDANT hotel & rest.
480 CAGER mine & quarry
221 CAKE DECORATOR bakery products
120 CALLIGRAPHER profess. & kin.
360 CAMERA OPERATOR motion picture
220 CAMERA REPAIRER photo. appar.
390 CAMP COUNSELOR amuse. & rec.
340 CAMPGROUND ATTENDANT amuse. & rec.
230 CAN-FILLING AND CLOSING
MACHINE TENDER
can. & preserv.
221 CANDLEMAKER fabrication, nec
331 CANDY MAKER sugar & conf.
221 CANER furniture
230 CANNERY WORKER, HAND OR
MACHINE
can. & preserv.
420 CANVAS REPAIRER any industry
230 CAP-LINING MACHINE OPERATOR any industry
320 CAPACITOR ASSEMBLER elec. equip.
211 CARD DEALER amusement and rec.
322 CAR HOP hotel & rest.
460 CARBIDE POWDER PROCESSOR machine shop
110 CARDIAC MONITOR TECHNICIAN medical ser.
212 CARDIOPULMONARY
TECHNOLOGIST
medical ser.
240 CARDROOM ATTENDANT amuse. & rec.
360 CARGO AGENT air trans.
380 CARPENTER construction
380 CARPENTER APPRENTICE construction
480 CARPENTER HELPER construction
380 CARPENTER, ACOUSTICAL construction
380 CARPENTER, MAINTENANCE any industry
380 CARPENTER, RAILCAR railroad equip.
481 CARPENTER, ROUGH construction
380 CARPENTER, SHIP ship-boat mfg.
480 CARPET CUTTER retail trade
481 CARPET LAYER retail trade
321 CARPET SEWER carpet & rug
230 CARPET WEAVER carpet & rug
480 CARPET LAYER HELPER retail trade
120 CARTOGRAPHER prof. & kindred
330 CARTON-FORMING MACHINE
OPERATOR
any industry
460 CARTON-FORMING MACHINE
TENDER
paper goods
120 CARTOONIST, MOTION PICTURES motion picture
111 CASEWORKER social ser.
320 CASH REGISTER SERVICER any industry
111 CASHIER clerical
214 CASHIER-CHECKER retail trade
230 CASING MACHINE OPERATOR meat products
330 CASTER smelt. & refin.
331 CASTER jewelry-silver.
320 CASTING REPAIRER any industry
322 CATERER personal ser.
491 CATTLE HERDER agriculture
480 CAULKER construction
330 CELLOPHANE BAG MACHINE
OPERATOR
paper goods
481 CEMENT MASON construction
480 CEMENT SPRAYER, NOZZLE construction
480 CEMENT MASON HELPER construction
480 CEMENTER, OILWELL petrol. & gas
331 CENTER MACHINE OPERATOR sugar & conf.
380 CENTRAL OFFICE REPAIRER tel. & tel.
331 CENTRIFUGAL EXTRACTOR
OPERATOR
any industry
230 CENTRIFUGE OPERATOR, PLASMA
PROCESSING
medical ser.
230 CENTRIFUGE SEPARATOR
OPERATOR
chemical
110 CEPHALOMETRIC ANALYST medical ser.
331 CERAMIC COATER, MACHINE any industry
460 CHAIN OFFBEARER saw. & plan.
492 CHAIN SAW OPERATOR logging
331 CHAR CONVEYOR TENDER sugar & conf.
230 CHARGE PREPARATION
TECHNICIAN
electron. comp.
492 CHASER logging
250 CHAUFFEUR any industry
111 CHECK CASHIER business ser.
360 CHECKER laundry & rel.
214 CHECKER, GROCERY retail trade

Group Occupation Industry Group Occupation Industry
No. No.
3-6
360 CHECKER, UNLOADER clerical
360 CHECKER, WAREHOUSE retail trade
240 CHECKROOM ATTENDANT any industry
322 CHEESE CUTTER dairy products
322 CHEESEMAKER dairy products
322 CHEF DE FROID hotel & rest.
212 CHEMICAL ENGINEER profess. & kin.
212 CHEMICAL LABORATORY
TECHNICIAN
profess. & kin.
230 CHEMICAL PREPARER chemical
212 CHEMIST profess. & kin.
240 CHILD MONITOR domestic ser.
111 CHILD SUPPORT OFFICER government ser.
340 CHILD-CARE ATTENDANT,
HANDICAPPED
education
340 CHILDREN'S INSTITUTION
ATTENDANT
any industry
341 CHIMNEY SWEEP any industry
460 CHIPPER, ROUGH any industry
311 CHIROPRACTOR medical ser.
311 CHIROPRACTOR ASSISTANT medical ser.
460 CHOCOLATE PRODUCTION
MACHINE OPERATOR
sugar & conf.
560 CHOKE SETTER logging
492 CHOPPER logging
491 CHRISTMAS TREE FARM WORKER forestry
320 CHUCKING LATHE OPERATOR machine shop
330 CIRCULAR SAWYER, STONE stonework
212 CIVIL ENGINEER profess. & kin.
251 CLAIM ADJUSTER, FIELD insurance; business
ser.
111 CLAIM ADJUSTER, INSIDE insurance
111 CLAIMS CLERK insurance
221 CLAY MODELER any industry
340 CLEANER, COMMERCIAL OR
INSTITUTIONAL
any industry
340 CLEANER, EQUIPMENT any industry
340 CLEANER, HOSPITAL medical ser.
340 CLEANER, LABORATORY
EQUIPMENT
any industry
341 CLEANER, WINDOW any industry
210 CLERGY MEMBER profess. & kin.
111 CLERK, ADVERTISING SPACE print. & pub.
111 CLERK, ANIMAL HOSPITAL medical ser.
112 CLERK, BILLING clerical
111 CLERK, COLLECTION clerical
111 CLERK, CONTRACT, AUTOMOBILE retail trade
111 CLERK, COURT government ser.
111 CLERK, CREDIT clerical
111 CLERK, ELECTION government ser.
214 CLERK, FILE clerical
211 CLERK, GENERAL clerical
211 CLERK, INVENTORY CONTROL clerical
214 CLERK, SALES retail trade
360 CLERK, SHIPPING clerical
112 CLERK, STATISTICAL clerical
111 CLERK, WIRE TRANSFER financial
112 CLERK-TYPIST clerical
110 CLINICAL PSYCHOLOGIST profess. & kin.
330 CLOTH PRINTER any industry
221 CLOTH TESTER, QUALITY textile
390 COACH, PROFESSIONAL ATHLETES amuse. & rec.
331 COATER OPERATOR any industry
331 COATING MACHINE OPERATOR paper & pulp
320 COBBLER boot & shoe
322 COFFEEMAKER hotel & rest.
230 COFFEE ROASTER food prep., nec
230 COIL WINDER elec. equip.
221 COIL WINDER, REPAIR any industry
214 COIN COUNTER AND WRAPPER clerical
251 COIN MACHINE COLLECTOR business ser.
370 COIN MACHINE SERVICE REPAIRER svc. ind. mach.
111 COLLECTION CLERK clerical
251 COLLECTOR, OUTSIDE clerical
230 COLOR PRINTER OPERATOR photofinishing
111 COLUMNIST/COMMENTATOR print. & pub.
111 COMMUNITY ORGANIZATION
WORKER
social serv.
250 COMMUNITY SERVICE OFFICER,
PATROL
social serv.
240 COMPANION domestic ser.
221 COMPOSITOR, TYPESETTER print. & pub.
230 COMPOUNDER petrol. refin.
360 COMPRESSED GAS PLANT WORKER chemical

Group Occupation Industry Group Occupation Industry
No. No.
3-7
332 COMPRESSOR OPERATOR any industry
112 COMPUTER KEYBOARD OPERATOR clerical
230 COMPUTER OPERATOR, MAINFRAME clerical
111 COMPUTER PROCESSING
SCHEDULER
clerical
112 COMPUTER PROGRAMMER profess. & kin.
320 COMPUTER REPAIRER office machines
111 COMPUTER SECURITY SPECIALIST profess. & kin.
320 COMPUTER SET-UP PERSON business serv.
111 COMPUTER SUPPORT ANALYST profess. & kin.
351 CONCRETE PAVING MACHINE
OPERATOR
construction
480 CONCRETE STONE FINISHER concrete prod.
480 CONCRETE VIBRATOR OPERATOR construction
340 CONDUCTOR, ALL RAILS r.r. trans.
213 CONDUCTOR, PASSENGER CAR r.r. trans.
370 CONSTRUCTION EQUIPMENT
MECHANIC
construction
110 CONSULTANT, EDUCATION education
230 CONTACT LENS MOLDER optical goods
330 CONTOUR BAND SAW OPERATOR,
VERTICAL
machine shop
213 CONTRACTOR construction
120 CONTROLS DESIGNER profess. & kin.
360 CONVEYOR FEEDER-OFFBEARER any industry
360 CONVEYOR TENDER any industry
370 CONVEYOR MAINTENANCE
MECHANIC
any industry
360 CONVEYOR SYSTEM OPERATOR any industry
322 COOK domestic ser.
322 COOK any industry
322 COOK ASSISTANT hotel & rest.
322 COOK, CHIEF hotel & rest.
322 COOK, FAST FOOD hotel & rest.
322 COOK, PASTRY hotel & rest.
322 COOK, SPECIALTY hotel & rest.
110 COORDINATOR, SKILL-TRAINING
PROGRAM
government ser.
111 COPY READER print. & pub.
111 COPY WRITER profess. & kin.
112 COPYIST any industry
480 CORE DRILL OPERATOR any industry
330 COREMAKER paper goods
331 COREMAKER, FLOOR foundry
490 CORRECTION OFFICER government ser.
290 COSMETOLOGIST personal ser.
110 COUNSELOR profess. & kin.
390 COUNSELOR, CAMP amuse. & rec.
322 COUNTER ATTENDANT, CAFETERIA hotel & rest.
250 COURIER any industry
111 COURT CLERK government ser.
112 COURT REPORTER clerical
491 COWPUNCHER agriculture
360 CRANE FOLLOWER any industry
360 CRANE HOOKER any industry
351 CRANE OPERATOR any industry
360 CRATE MAKER any industry
111 CREDIT AUTHORIZER clerical
111 CREDIT CLERK clerical
111 CREDIT COUNSELOR profess. & kin.
460 CREMATOR personal ser.
111 CREW SCHEDULER air trans.
230 CRIMPING MACHINE OPERATOR any industry
330 CROSSBAND LAYER millwork-plywood
460 CRUSHER OPERATOR concrete prod.
112 CRYPTOGRAPHIC MACHINE
OPERATOR
clerical
330 CRYSTAL GROWER comm. equip.
330 CRYSTAL SLICER electron. comp.
212 CURATOR museums
211 CURRENCY COUNTER financial
340 CUSTODIAN any industry
360 CUSTODIAN, ATHLETIC EQUIPMENT amuse. & rec.
211 CUSTODIAN, PROPERTY government ser.
211 CUSTOMER SERVICE CLERK retail trade
213 CUSTOMER SERVICE
REPRESENTATIVE
utilities
112 CUSTOMER SERVICE
REPRESENTATIVE – INSIDE
utilities
212 CUSTOMS BROKER financial
330 CUT-OFF SAW OPERATOR woodworking
330 CUT-OFF SAW OPERATOR, METAL machine shop
230 CUTTER photofinishing
330 CUTTER OPERATOR any industry

Group Occupation Industry Group Occupation Industry
No. No.
3-8
230 CUTTER, MACHINE any industry
230 CUTTING MACHINE OPERATOR,
AUTOMATED
aircraft mfg.
460 CUTTING MACHINE OPERATOR textile
330 CUTTING MACHINE TENDER any industry
460 CYLINDER FILLER chemical
460 CYLINDER PRESS FEEDER print. & pub.
120 CYTOTECHNOLOGIST medical ser.
460 DAIRY PROCESSING EQUIPMENT
OPERATOR
dairy products
590 DANCER amuse. & rec.
111 DATA BASE ADMINISTRATOR profess. & kin.
380 DATA COMMUNICATIONS
INSTALLER
any industry
112 DATA ENTRY CLERK clerical
221 DECAL APPLIER any industry
491 DECKHAND water trans., fishing
& hunt.
331 DECONTAMINATOR, RADIOACTIVE
MATERIAL
any industry
221 DECORATOR bakery products
380 DECORATOR, SPECIAL EVENT any industry
480 DECORATOR, STREET AND
BUILDING
any industry
322 DELI CUTTER-SLICER retail trade
250 DELIVERER, CAR RENTAL automotive ser.
250 DELIVERER, FLORAL
ARRANGEMENTS
retail trade
213 DELIVERER, NON-DRIVING clerical
250 DELIVERER, PIZZA retail trade
212 DEMONSTRATOR retail trade
212 DENTAL ASSISTANT medical ser.
220 DENTAL HYGIENIST medical ser.
220 DENTAL LABORATORY TECHNICIAN protective dev.
220 DENTIST medical ser.
490 DEPUTY, COURT government ser.
480 DERRICK WORKER, WELL SERVICE petrol. & gas
230 DESIGN PRINTER, BALLOON rubber goods
490 DETECTIVE government ser.
390 DETECTIVE, STORE retail trade
212 DIALYSIS TECHNICIAN medical ser.
330 DIE CASTING MACHINE OPERATOR foundry
330 DIE CUTTER any industry
120 DIE DESIGNER machine shop
320 DIE MAKER machine shop
320 DIE SINKER machine shop
322 DIETARY AIDE, HOSPITAL SERVICES medical ser.
212 DIETITIAN, CLINICAL profess. & kin.
322 DINING ROOM ATTENDANT hotel & rest.
351 DINKEY OPERATOR any industry
221 DIPPER jewelry-silver.
331 DIPPER any industry
110 DIRECTOR, FUNDRAISING nonprofit org.
110 DIRECTOR, MOTION PICTURE motion picture
212 DIRECTOR, RECREATION CENTER social ser.
110 DIRECTOR, REGULATORY AGENCY government ser.
110 DIRECTOR, RESEARCH AND
DEVELOPMENT
any industry
110 DIRECTOR, SERVICE retail trade
210 DIRECTOR, SOCIAL hotel & rest.
112 DIRECTORY ASSISTANCE OPERATOR tel. & tel.
322 DISHWASHER, HAND OR MACHINE hotel & rest.
111 DISPATCHER, MOTOR VEHICLE clerical
380 DISPLAY MAKER fabrication, nec
330 DISPLAY SCREEN FABRICATOR electron. comp.
360 DISPLAYER, MERCHANDISE retail trade
460 DISTILLERY WORKER, GENERAL beverage
221 DISTRESSER furniture
480 DITCH DIGGER construction
492 DIVER any industry
230 DIVIDING MACHINE OPERATOR bakery products
111 DOCUMENT PREPARER,
MICROFILMING
business ser.
491 DOG CATCHER government ser.
491 DOG GROOMER personal ser.
251 DOG LICENSER nonprofit org.
560 DOLLY PUSHER radio-tv broad.
390 DOUBLE motion picture
460 DOUGH BRAKE MACHINE
OPERATOR
bakery products
322 DOUGH MOLDER, HAND bakery products
322 DOUGHNUT MAKER bakery products
330 DOWEL MACHINE OPERATOR woodworking
120 DRAFTER, ARCHITECTURAL profess. & kin.

Group Occupation Industry Group Occupation Industry
No. No.
3-9
120 DRAFTER, ASSISTANT profess. & kin.
120 DRAFTER, CIVIL profess. & kin.
120 DRAFTER, ELECTRICAL profess. & kin.
120 DRAFTER, ELECTROMECHANISMS
DESIGN
profess. & kin.
120 DRAFTER, LANDSCAPE profess. & kin.
120 DRAFTER, MECHANICAL profess. & kin.
351 DRAGLINE OPERATOR any industry
380 DRAPERY HANGER retail trade
110 DRAWINGS CHECKER, ENGINEERING profess. & kin.
221 DRESSMAKER any industry
230 DRIER OPERATOR food prep., nec
331 DRIER OPERATOR chemical
330 DRILL PRESS OPERATOR machine shop
330 DRILL PRESS OPERATOR,
NUMERICAL CONTROL
machine shop
321 DRILLER, HAND any industry
240 DRIVE-IN THEATER ATTENDANT amuse. & rec.
251 DRIVER'S LICENSE EXAMINER government ser.
350 DRIVER, NEWSPAPER DELIVERY wholesale tr.
430 DROPHAMMER OPERATOR aircraft mfg.
430 DRUM STRAIGHTENER any industry
340 DRY CLEANER laundry & rel.
331 DRY-PRESS OPERATOR brick & tile
380 DRY WALL APPLICATOR construction
481 DUCT INSTALLER construction
330 DYNAMITE PACKING MACHINE
OPERATOR
chemical
212 ECHOCARDIOGRAPH TECHNICIAN medical ser.
110 EDITOR, MANAGING, NEWSPAPER print. & pub.
111 EDITOR, NEWSPAPER print. & pub.
111 EDITOR, PUBLICATIONS print. & pub.
112 EDITORIAL WRITER print. & pub.
221 EGG CANDLER any industry
380 ELECTRIC METER INSTALLER utilities
221 ELECTRIC MOTOR ASSEMBLER elec. equip.
320 ELECTRIC MOTOR CONTROL UNIT
ASSEMBLER
elec. equip.
320 ELECTRIC SIGN ASSEMBLER fabrication, nec
212 ELECTRICAL ENGINEER profess. & kin.
212 ELECTRICAL TECHNICIAN profess. & kin.
221 ELECTRICAL APPLIANCE REPAIRER,
SMALL
any industry
370 ELECTRICAL APPLIANCE SERVICER any industry
460 ELECTRICAL APPLIANCE UNCRATER any industry
221 ELECTRICAL INSTRUMENT
REPAIRER
any industry
380 ELECTRICIAN construction
380 ELECTRICIAN ship-boat mfg.
380 ELECTRICIAN APPRENTICE construction
380 ELECTRICIAN HELPER any industry
370 ELECTRICIAN, AUTOMOTIVE automotive ser.
380 ELECTRICIAN, MAINTENANCE any industry
380 ELECTRICIAN, POWERHOUSE utilities
460 ELECTROLESS PLATER, PRINTED
CIRCUIT BOARD PANELS
electron. comp.
290 ELECTROLOGIST personal ser.
220 ELECTROMECHANICAL TECHNICIAN inst. & app.
320 ELECTROMEDICAL EQUIPMENT
REPAIRER
any industry
212 ELECTROMYOGRAPHIC TECHNICIAN medical ser.
221 ELECTRONIC COMPONENT
PROCESSOR
electron. comp.
221 ELECTRONICS ASSEMBLER comm. equip.
212 ELECTRONICS TECHNICIAN profess. & kin.
221 ELECTRONICS TESTER comm. equip.
212 ELECTRONICS DESIGN ENGINEER profess. & kin.
351 ELEVATING GRADER OPERATOR construction
482 ELEVATOR CONSTRUCTOR construction
380 ELEVATOR EXAMINER AND
ADJUSTER
any industry
460 ELEVATOR OPERATOR, FREIGHT any industry
380 ELEVATOR REPAIRER any industry
111 ELIGIBILITY WORKER government ser.
420 EMBALMER personal ser.
331 EMBOSSER any industry
230 EMBOSSING PRESS OPERATOR print. & pub.
460 EMERGENCY MEDICAL TECHNICIAN medical ser.
111 EMPLOYEE RELATIONS SPECIALIST profess. & kin.
111 EMPLOYMENT INTERVIEWER profess. & kin.
320 ENGINE LATHE OPERATOR machine shop
213 ENGINEER, AERONAUTICAL TEST aircraft mfg.
111 ENGINEER, AERONAUTICAL DESIGN aircraft mfg.

Group Occupation Industry Group Occupation Industry
No. No.
3-10
212 ENGINEER, AGRICULTURAL profess. & kin.
212 ENGINEER, AUTOMOTIVE auto. mfg.
111 ENGINEER, BIOMEDICAL profess. & kin.
212 ENGINEER, CHEMICAL profess. & kin.
212 ENGINEER, CIVIL profess. & kin.
111 ENGINEER, ELECTRO-OPTICAL profess. & kin.
212 ENGINEER, ELECTRONICS DESIGN profess. & kin.
212 ENGINEER, FACTORY LAY-OUT profess. & kin.
213 ENGINEER, FIELD SERVICE profess. & kin.
212 ENGINEER, MECHANICAL profess. & kin.
111 ENGINEER, NUCLEAR profess. & kin.
111 ENGINEER, PACKAGING profess. & kin.
111 ENGINEER, POWER DISTRIBUTION utilities
111 ENGINEER, PRODUCT SAFETY profess. & kin.
212 ENGINEER, RAILROAD profess. & kin.
213 ENGINEER, SOILS profess. & kin.
320 ENGRAVER, HAND, HARD METALS engraving
120 ENGRAVER, HAND, SOFT METALS engraving; jewelry
230 ENGRAVER, MACHINE engraving
213 ENVIRONMENTAL ANALYST profess. & kin.
111 EQUAL OPPORTUNITY
REPRESENTATIVE
government ser.
340 EQUIPMENT CLEANER any industry
370 EQUIPMENT INSTALLER, VEHICLES any industry
111 ESCROW OFFICER profess. & kin.
111 ESTATE PLANNER insurance
213 ESTIMATOR/CRUISER forestry
221 ETCHED CIRCUIT PROCESSOR electron. comp.
221 ETCHER engraving
320 ETCHER, HAND print. & pub.
370 EVAPORATIVE COOLER INSTALLER any industry
111 EXAMINER government ser.
390 EXERCISE PHYSIOLOGIST medical ser.
491 EXERCISER, HORSE amuse. & rec.
380 EXHIBIT BUILDER museums
111 EXPEDITER clerical
360 EXPEDITER, MATERIAL clerical
380 EXPERIMENTAL AIRCRAFT
MECHANIC
aircraft mfg.
213 EXTERMINATOR business ser.
480 EXTERMINATOR, TERMITE business ser.
213 EXTRA, ACTOR amuse. & rec.;
motion picture
330 EXTRUDER OPERATOR rubber goods
220 EYEGLASS LENS CUTTER optical goods
230 FABRIC STRETCHER furniture
320 FABRICATING MACHINE OPERATOR,
METAL
any industry
221 FABRICATOR, FOAM RUBBER any industry
330 FABRICATOR/ASSEMBLER, METAL
PRODUCTS
any industry
210 FACULTY MEMBER, COLLEGE OR
UNIVERSITY
education
492 FALLER logging
492 FALLER, TIMBER logging
491 FARM LABORER, GENERAL agriculture
351 FARM MACHINE OPERATOR agriculture
491 FARMER, GENERAL agriculture
491 FARMWORKER, FRUIT agriculture
491 FARMWORKER, VEGETABLE agriculture
120 FASHION ARTIST retail trade
251 FASHION COORDINATOR retail trade
212 FASHION DESIGNER profess. & kin.
322 FAST FOODS WORKER hotel & rest.
460 FEEDER print. & pub.
331 FELTING MACHINE OPERATOR tex. prod., nec
481 FENCE ERECTOR construction
330 FIBERGLASS LAMINATOR ship-boat
mfg.;vehicles nec.
330 FIBERGLASS MACHINE OPERATOR glass products
213 FIELD ENGINEER radio-tv broad.
214 FILE CLERK clerical
221 FILLER tex. prod., nec
230 FILM DEVELOPER motion picture
230 FILM OR VIDEOTAPE EDITOR motion picture
230 FILM PRINTER motion picture
214 FILM OR TAPE LIBRARIAN clerical
331 FILTER OPERATOR any industry
460 FILTER PRESS OPERATOR any industry
320 FINAL ASSEMBLER office machines
110 FINANCIAL PLANNER profess. & kin.
110 FINANCIAL AIDS OFFICER education
120 FINGERNAIL FORMER personal ser.

Group Occupation Industry Group Occupation Industry
No. No.
3-11
490 FIRE FIGHTER any industry
490 FIRE LOOKOUT forestry
490 FIRE RANGER forestry
320 FIRE EXTINGUISHER REPAIRER any industry
490 FIRE INSPECTOR government serv.
332 FIRER, HIGH PRESSURE any industry
320 FIRESETTER elec. equip.
360 FIREWORKS DISPLAY SPECIALIST any industry
490 FISH AND GAME WARDEN government ser.
322 FISH CLEANER can. & preserv.
491 FISH FARMER fishing & hunt.
491 FISH HATCHERY LABORER fishing & hunt.
492 FISHER, DIVING fishing & hunt.
491 FISHER, LINE fishing & hunt.
491 FISHER, NET fishing & hunt.
481 FITTER construction, pipe
lines
430 FITTER, METAL any industry
320 FIXTURE REPAIRER-FABRICATOR any industry
213 FLAGGER, TRAFFIC CONTROL construction
230 FLATWORK FINISHER laundry & rel.
322 FLIGHT ATTENDANT air trans.
212 FLIGHT ENGINEER air trans.
211 FLIGHT INFORMATION EXPEDITER air trans.
380 FLOOR LAYER construction
480 FLOOR FINISHER HELPER construction
221 FLORIST retail trade
460 FLOUR BLENDER grain-feed mills
230 FOLDER SEAMER, AUTOMATIC any industry
230 FOLDING MACHINE OPERATOR print. & pub.
330 FOLDING MACHINE OPERATOR paper goods
330 FOLDING MACHINE OPERATOR textile
322 FOOD ASSEMBLER, KITCHEN hotel & rest.
492 FOREST WORKER forestry
490 FOREST FIRE FIGHTER forestry
213 FORESTER profess. & kin.
491 FORESTER AIDE forestry
460 FORGE HELPER forging
430 FORGING PRESS OPERATOR forging
351 FORKLIFT OPERATOR any industry
481 FORM BUILDER construction
480 FORM STRIPPER construction
480 FORM TAMPER construction
480 FORM TAMPER OPERATOR construction
320 FORMER, HAND any industry
331 FORMING MACHINE OPERATOR glass mfg.
111 FORMS ANALYST profess. & kin.
331 FOURDRINIER MACHINE OPERATOR paper & pulp
470 FRAME REPAIRER furniture
370 FRAME STRAIGHTENER motor-bicycles
230 FREEZER OPERATOR dairy products
491 FRUIT PICKER agriculture
360 FRUIT BUYING INSPECTOR can. & preserv.
331 FRUIT GRADER OPERATOR agriculture
332 FUEL ATTENDANT, PLANT any industry
480 FUMIGATOR business ser.
212 FUND RAISER nonprofit org.
340 FUNERAL ATTENDANT personal ser.
560 FUNERAL CAR CHAUFFEUR personal ser.
212 FUNERAL DIRECTOR personal ser.
341 FURNACE CLEANER any industry
380 FURNACE INSTALLER AND
REPAIRER, HOT AIR
any industry;
utilities
321 FURNITURE ASSEMBLER furniture
470 FURNITURE ASSEMBLER/HEAVY woodworking
360 FURNITURE CRATER any industry
221 FURNITURE FINISHER woodworking
560 FURNITURE MOVER motor trans.
321 FURNITURE UPHOLSTERER any industry
221 FURRIER fur goods
370 GARAGE SERVICER,
TRANSPORTATION EQUIPMENT
any industry
560 GARBAGE COLLECTOR, MANUAL motor trans.
491 GARDENER domestic ser.
221 GARMENT CUTTER, HAND any industry
321 GARMENT CUTTER, MACHINE any industry
332 GAS COMPRESSOR OPERATOR any industry
332 GAS ENGINE OPERATOR any industry
320 GAS METER ADJUSTER utilities
212 GATE AGENT air trans.
213 GEOLOGIST profess. & kin.
221 GIFT WRAPPER retail trade
221 GILDER, METAL LEAF any industry
230 GINNER agriculture

Group Occupation Industry Group Occupation Industry
No. No.
3-12
221 GLASS BLOWER, HAND glass mfg
420 GLASS CUTTER any industry
221 GLASS FINISHER glass products
370 GLASS INSTALLER automotive ser.
370 GLASS INSTALLER woodworking
321 GLASS POLISHER glass mfg.
380 GLAZIER construction
330 GLUER woodworking
251 GOLF COURSE RANGER amuse. & rec.
390 GOLF INSTRUCTOR amuse. & rec.
493 GOLFER, PROFESSIONAL amuse. & rec.
340 GOLF RANGE ATTENDANT amuse. & rec.
360 GRAINER, MACHINE any industry
110 GRANT COORDINATOR profess. & kin.
230 GRANULATOR OPERATOR sugar & conf.
120 GRAPHIC DESIGNER profess. & kin.
480 GRAVE DIGGER real estate
340 GREASER any industry
460 GREEN CHAIN OFFBEARER millwork-plywood
331 GRINDER OPERATOR grain-feed mills
320 GRINDER OPERATOR, PRECISION machine shop
330 GRINDER SET-UP OPERATOR,
CENTERLESS
machine shop
330 GRINDER, BENCH any industry
321 GRINDER, DISK, BELT OR WHEEL any industry
330 GRINDER, TOOL any industry
460 GRINDER-CHIPPER, ROUGH any industry
330 GRINDING MACHINE TENDER machine shop
482 GRIP amuse. & rec.
482 GRIP, PROPERTY HANDLER motion picture
482 GRIP, STAGE CONSTRUCTION motion picture
214 GROCERY CHECKER retail trade
230 GROMMET MACHINE OPERATOR any industry
491 GROOM any industry
491 GROUNDSKEEPER any industry
490 GROUP SUPERVISOR government ser.
490 GUARD, CORRECTIONAL FACILITY government ser.
240 GUARD, SCHOOL-CROSSING government ser.
590 GUIDE, ALPINE personal ser.
213 GUIDE, ESTABLISHMENT any industry
491 GUIDE, HUNTING AND FISHING amuse. & rec.
220 GUNSMITH any industry
290 HAIR STYLIST personal ser.
211 HAND LABELER any industry
380 HANDYPERSON any industry
110 HARBOR MASTER government ser.
380 HARDWOOD FLOOR LAYER construction
320 HARNESS MAKER leather prod.
230 HAT AND CAP SEWER hat & cap
110 HAZARDOUS WASTE MANAGEMENT
SPECIALIST
government ser.
110 HEARING OFFICER government ser.
112 HEARING REPORTER clerical
330 HEAT TREATER heat treating
430 HEATER forging
380 HEATING AND AIR CONDITIONING
INSTALLER-SERVICER
construction
230 HEMMER, AUTOMATIC tex. prod., nec
420 HIDE PULLER meat products
480 HOD CARRIER construction
351 HOISTING ENGINEER any industry
111 HOLTER SCANNING TECHNICIAN medical ser.
340 HOME ATTENDANT personal ser.
491 HORSESHOER agriculture
213 HORTICULTURIST profess. & kin.
111 HOSPITAL ADMITTING CLERK medical ser.
240 HOST/HOSTESS any industry
211 HOTEL CLERK hotel & rest.
470 HOUSEHOLD APPLIANCE INSTALLER any industry
340 HOUSEKEEPER, DOMESTIC domestic ser.; hotel
& rest.
332 HYDROELECTRIC STATION
OPERATOR
utilities
331 ICE CREAM MAKER dairy products
460 ICE CUTTER food prep., nec
120 ILLUSTRATOR profess. & kin.
110 IMPORT-EXPORT AGENT any industry
111 INDUSTRIAL ENGINEER profess. & kin.
213 INDUSTRIAL HYGIENIST profess. & kin.
111 INFORMATION CLERK clerical
111 INFORMATION AND REFERRAL AIDE government ser.
230 INJECTION WAX MOLDER foundry; jewelry-
silver.

Group Occupation Industry Group Occupation Industry
No. No.
3-13
230 INJECTION MOLDING MACHINE
TENDER
plastic prod.
330 INKER print. & pub.
460 INMATE, LABORER any industry
120 INSPECTOR jewelry-silver.
221 INSPECTOR plastic prod.
221 INSPECTOR pharmaceut.
213 INSPECTOR, AGRICULTURAL
COMMODITIES
government ser.
213 INSPECTOR, AIR CARRIER government ser.
213 INSPECTOR, AIRPLANE air trans.
221 INSPECTOR, CANNED FOOD
RECONDITIONING
can. & preserv.
320 INSPECTOR, EDDY CURRENT steel & rel.
221 INSPECTOR, ELECTRONICS comm. equip.
221 INSPECTOR, FABRIC any industry
251 INSPECTOR, FOOD AND DRUG government ser.
321 INSPECTOR, FURNITURE furniture
221 INSPECTOR, GARMENT any industry
221 INSPECTOR, GLASS any industry
251 INSPECTOR, HEALTH CARE
FACILITIES
government ser.
120 INSPECTOR, JEWEL clock & watch
213 INSPECTOR, METAL FABRICATING any industry
221 INSPECTOR, METAL FINISH any industry
221 INSPECTOR, PRINTED CIRCUIT
BOARDS
electron. comp.
251 INSPECTOR, QUALITY ASSURANCE government ser.
251 INSPECTOR, TRANSPORTATION motor trans.
213 INSPECTOR, WEIGH STATION government ser.
493 INSTRUCTOR, AEROBICS amuse. & rec.
251 INSTRUCTOR, DRIVING education
390 INSTRUCTOR, PHYSICAL
EDUCATION
education
390 INSTRUCTOR, SPORTS amuse. & rec.
214 INSTRUCTOR, VOCATIONAL
TRAINING
education
320 INSTRUMENT REPAIRER any industry
220 INSTRUMENT MAKER AND
REPAIRER
any industry
380 INSULATION WORKER construction
221 INTEGRATED CIRCUIT FABRICATOR electron. comp.
120 INTEGRATED CIRCUIT LAYOUT
DESIGNER
profess. & kin.
214 INTERIOR DESIGNER profess. & kin.
220 INTERNIST medical ser.
210 INTERPRETER profess. & kin.
212 INTERPRETER, DEAF profess. & kin.
111 INTERVIEWER, EMPLOYMENT profess. & kin.
212 INTERVIEWER/SURVEY WORKER clerical
360 INVENTORY CLERK clerical
251 INVESTIGATOR government ser.
111 INVESTIGATOR, CREDIT FRAUD retail trade
251 INVESTIGATOR, INSIDE/OUTSIDE business ser.
490 INVESTIGATOR, VICE government ser.
110 INVESTMENT ANALYST financial
111 INVOICE CONTROL CLERK clerical
491 IRRIGATOR, GRAVITY FLOW agriculture
491 IRRIGATOR, SPRINKLING SYSTEM agriculture
480 JACKHAMMER OPERATOR mine & quarry
490 JAILER government ser.
340 JANITOR any industry
120 JEWELER jewelry-silver.
320 JIG MAKER machine shop
330 JIG-BORING MACHINE OPERATOR,
NUMERICAL CONTROL
machine shop
330 JIGSAW OPERATOR woodworking
212 JOB ANALYST profess. & kin.
110 JOB DEVELOPMENT SPECIALIST profess. & kin.
320 JOB SETTER, HONING machine shop
590 JOCKEY amuse. & rec.
380 JOINER ship-boat mfg.
330 JOINTER OPERATOR woodworking
110 JUDGE government ser.
221 KEY CUTTER any industry
230 KICK PRESS OPERATOR any industry
230 KILN OPERATOR woodworking
360 KILN WORKER pottery & porc.
322 KITCHEN HELPER hotel & rest.
230 KNITTING MACHINE OPERATOR,
HOSIERY
knitting
330 KNITTING MACHINE OPERATOR knitting
492 KNOT BUMPER logging

Group Occupation Industry Group Occupation Industry
No. No.
3-14
212 LABORATORY ASSISTANT, BLOOD
AND PLASMA
medical ser.
340 LABORATORY EQUIPMENT
CLEANER
any industry
220 LABORATORY TESTER any industry
460 LABORER meat products
460 LABORER pharmaceut.
460 LABORER, CHEMICAL PROCESSING chemical
480 LABORER, CONCRETE PAVING construction
480 LABORER, CONCRETE MIXING
PLANT
construction
480 LABORER, CONSTRUCTION construction
491 LABORER, FARM agriculture
360 LABORER, GENERAL plastic prod.
460 LABORER, GENERAL machine shop
460 LABORER, GENERAL nonfer. metal
460 LABORER, GENERAL steel & rel.
460 LABORER, MILL woodworking
460 LABORER, PETROLEUM REFINERY petrol. refin.
480 LABORER, ROAD construction
460 LABORER, SHIPYARD ship-boat mfg.
480 LABORER, WRECKING &
SALVAGING
construction
460 LABORER, YARD paper & pulp
331 LACQUERER plastic prod.
330 LAMINATING MACHINE FEEDER wood prod., nec.
330 LAMINATING MACHINE OPERATOR furniture
430 LAMINATING PRESS OPERATOR plastic prod.
330 LAMINATOR ship-boat
mfg.;vehicles nec.
213 LAND SURVEYOR profess. & kin.
491 LANDSCAPE GARDENER agriculture
370 LASER TECHNICIAN/REPAIRER electron. comp.
230 LASER BEAM MACHINE OPERATOR welding
230 LASER BEAM TRIM OPERATOR electron. comp.
330 LATHE OPERATOR, NUMERICAL
CONTROL
machine shop
330 LATHE OPERATOR, SWING-TYPE woodworking
330 LATHE OPERATOR, WOOD-TURNING woodworking
460 LATHE SPOTTER millwork-plywood
330 LATHE TENDER machine shop
380 LATHER, METAL OR WOOD construction
340 LAUNDERER, HAND laundry & rel.
491 LAWN SERVICE WORKER agriculture
110 LAWYER profess. & kin.
320 LAY-OUT MAKER sheet metal; any
industry
120 LAY-OUT TECHNICIAN optical goods
491 LEAD PONY RIDER, RACETRACK amuse. & rec.
221 LEATHER CUTTER leather prod.
230 LEATHER GARMENT PRESSER laundry & rel.
320 LEATHER WORKER leather prod.
110 LEGISLATIVE ASSISTANT government ser.
220 LENS EXAMINER optical goods
230 LENS HARDENER optical goods
320 LENS MOUNTER, OPTICAL optical goods
220 LENS POLISHER, HAND optical goods
220 LENS FABRICATING MACHINE
TENDER
optical goods
214 LIBRARIAN library
212 LIBRARIAN, CATALOG library
214 LIBRARY ASSISTANT library
211 LICENSE CLERK government ser.
590 LIFEGUARD amuse. & rec.
250 LIGHT RAIL CAR OPERATOR r.r. trans.
341 LIGHT FIXTURE SERVICER any industry
482 LINE INSTALLER-REPAIRER tel. & tel.; utilities
341 LINE SERVICE ATTENDANT air trans.
213 LINE WALKER petrol. & gas
360 LINEN ROOM CLERK hotel & rest.
110 LITERARY AGENT business ser.
491 LIVESTOCK YARD ATTENDANT any industry
460 LOADER/UNLOADER any industry
110 LOAN OFFICER financial
212 LOCATION MANAGER motion picture
120 LOCK ASSEMBLER cutlery-hrdwr.
221 LOCKSMITH any industry
250 LOCOMOTIVE ENGINEER r.r. trans.
213 LOG SCALER logging
491 LOG SORTER logging
492 LOGGER, ALL-ROUND logging
351 LOGGING TRACTOR OPERATOR forestry
370 LOOM FIXER narrow fabrics
340 LUBRICATION SERVICER automotive ser.

Group Occupation Industry Group Occupation Industry
No. No.
3-15
320 LUGGAGE REPAIRER any industry
221 LUMBER GRADER woodworking
460 LUMBER HANDLER/STACKER woodworking
360 LUMBER SORTER woodworking
350 LUNCH TRUCK DRIVER hotel & rest.
370 MACHINE ASSEMBLER/BUILDER machinery mfg.
360 MACHINE FEEDER any industry
460 MACHINE FEEDER, RAW STOCK tex. prod., nec
330 MACHINE MOLDER foundry
230 MACHINE OPERATOR, ROOFING
MATERIALS
build. mat., nec
320 MACHINE SET-UP OPERATOR machine shop
221 MACHINE TESTER office machines
320 MACHINIST machine shop
320 MACHINIST, AUTOMOTIVE automotive ser.
370 MACHINIST, BENCH machinery mfg.
112 MAGNETIC TAPE COMPOSER
OPERATOR
print. & pub.
211 MAIL CLERK clerical
230 MAILING MACHINE OPERATOR print. & pub.
370 MAINTENANCE MACHINIST machine shop
470 MAINTENANCE MECHANIC any industry
380 MAINTENANCE REPAIRER,
BUILDING
any industry
470 MAINTENANCE REPAIRER, INDUS.
MACHINES & PLANTS
any industry
480 MAINTENANCE WORKER,
MUNICIPAL
government ser.
311 MAKE-UP ARTIST, BODY amuse. & rec.
110 MANAGEMENT ANALYST profess. & kin.
212 MANAGEMENT TRAINEE any industry
212 MANAGER, ADVERTISING AGENCY business ser.
212 MANAGER, APARTMENT HOUSE real estate
213 MANAGER, AUTOMOBILE SERVICE
STATION
retail trade
110 MANAGER, BENEFITS profess. & kin.
110 MANAGER, BUS TRANSPORTATION motor trans.
212 MANAGER, CONVENTION hotel & rest.
212 MANAGER, CUSTOMER SERVICES business ser.
213 MANAGER, DAIRY FARM agriculture
110 MANAGER, DATA PROCESSING profess. & kin.
110 MANAGER, DEPARTMENT any industry
212 MANAGER, FAST FOOD SERVICES retail trade
110 MANAGER, HOTEL OR MOTEL hotel & rest.
212 MANAGER, HOTEL RECREATIONAL
FACILITIES
amuse. & rec.
212 MANAGER, LABOR RELATIONS profess. & kin.
212 MANAGER, MOBILE HOME PARK real estate
213 MANAGER, NURSERY agriculture
111 MANAGER, OFFICE any industry
212 MANAGER, PARTS retail trade
111 MANAGER, PERSONNEL profess. & kin.
213 MANAGER, PROPERTY real estate
212 MANAGER, QUALITY CONTROL profess. & kin.
212 MANAGER, RETAIL STORE retail trade
212 MANAGER, STAGE amuse. & rec.
212 MANAGER, THEATER amuse. & rec.
110 MANAGER, TRAFFIC air trans.; any
industry
212 MANAGER, VEHICLE LEASING AND
RENTAL
automotive ser.
212 MANAGER, WAREHOUSE any industry
120 MANICURIST personal ser.
330 MARBLE POLISHER, MACHINE stonework
481 MARBLE SETTER construction
480 MARBLE SETTER HELPER construction
211 MARKER retail trade
111 MARKET RESEARCH ANALYST profess. & kin.
221 MASKER, PARTS any industry
311 MASSEUR/MASSEUSE personal ser.
212 MASTER CONTROL OPERATOR radio-tv broad.
221 MAT CUTTER, PICTURE FRAMES wood prod., nec
360 MATERIAL EXPEDITER clerical
460 MATERIAL STACKER any industry
321 MATTRESS MAKER furniture
322 MEAT CARVER, DISPLAY hotel & rest.
322 MEAT CLERK retail trade
322 MEAT CUTTER retail trade
331 MEAT GRINDER meat products
380 MECHANIC, AIRCRAFT aircraft mfg.
370 MECHANIC, AUTOMOBILE automotive ser.
470 MECHANIC, DIESEL any industry
370 MECHANIC, FRONT-END automotive ser.
481 MECHANIC, POWERHOUSE utilities

Group Occupation Industry Group Occupation Industry
No. No.
3-16
380 MECHANIC, RADAR any industry
370 MECHANIC, RADIATOR automotive ser.
481 MECHANIC, REFRIGERATION svc. ind. mach.
370 MECHANIC, ROCKET ENGINE
COMPONENT
aircraft mfg.
470 MECHANIC, SAFE AND VAULT business ser.
370 MECHANIC, SMALL ENGINE any industry
370 MECHANIC, TRACTOR automotive ser.
370 MECHANIC, TRANSMISSION automotive ser.
370 MECHANIC, TUNE-UP automotive ser.
214 MEDIA SPECIALIST, SCHOOL
LIBRARY
library
212 MEDICAL ASSISTANT, OFFICE medical ser.
220 MEDICAL LABORATORY
TECHNOLOGIST
medical ser.
470 MEDICAL EQUIPMENT REPAIRER protective dev.
212 MEDICAL LABORATORY
TECHNICIAN
medical ser.
211 MEDICAL RECORD CLERK medical ser.
321 MELTER jewelry-silver.
340 MENTAL RETARDATION AIDE,
INSTITUTION
medical ser.
213 MESSENGER, NON-DRIVING clerical
430 METAL FABRICATOR any industry
321 METAL GRINDER AND FINISHER any industry
321 METAL SPRAYER, PRODUCTION any industry
331 METAL CLEANER, IMMERSION any industry
230 METALLIZATION EQUIPMENT
TENDER, SEMICONDUCTORS
comm. equip.
212 METALLURGICAL TESTER profess. & kin.
213 METER READER utilities
320 METER REPAIRER any industry
220 MICROELECTRONICS TECHNICIAN electron. comp.
230 MICROFILM PROCESSOR business ser.
212 MICROPHONE BOOM OPERATOR motion picture
491 MILKER, MACHINE agriculture
331 MILL OPERATOR any industry
320 MILLING MACHINE OPERATOR,
NUMERICAL CONTROL
machine shop
481 MILLWRIGHT any industry
480 MILLWRIGHT HELPER any industry
213 MINE INSPECTOR mine & quarry
560 MINER mine & quarry
560 MINER HELPER mine & quarry
221 MINIATURE SET CONSTRUCTOR motion picture
460 MIXER paint & varnish
460 MIXER, CLAY brick & tile
480 MIXER, CONCRETE construction
460 MIXER, DOUGH bakery products
460 MIXER, FLOUR bakery products
480 MIXER, MORTAR construction
221 MIXER, PAINT (HAND) any industry
460 MIXER, PAINT (MACHINE) any industry
331 MIXER, SAND (MACHINE) foundry
331 MIXING MACHINE OPERATOR food prep., nec
460 MIXING MACHINE OPERATOR any industry
380 MOBILE HOME ASSEMBLER mfd. bldgs.
212 MOBILE HOME PARK MANAGER real estate
240 MODEL garment
221 MODEL MAKER any industry
240 MODEL, ARTISTS' any industry
213 MODEL, PHOTOGRAPHERS' any industry
321 MOLD REPAIRER any industry
221 MOLD AND MODEL MAKER,
PLASTER
concrete prod.
330 MOLDER aircraft mfg.
420 MOLDER, HAND brick & tile
320 MOLDER, PATTERN foundry
230 MOLDING MACHINE TENDER,
COMPRESSION
plastic prod.
340 MORGUE ATTENDANT medical ser.
230 MOTION PICTURE PROJECTIONIST amuse. & rec.
351 MOTOR-GRADER OPERATOR construction
351 MOTORBOAT OPERATOR any industry
370 MOTORCYCLE ASSEMBLER motor-bicycles
250 MOTORCYCLE DRIVER, DELIVERY retail trade
490 MOTORCYCLE POLICE OFFICER government ser.
370 MOTORCYCLE REPAIRER automotive ser.
120 MOUNTER, HAND photofinishing
310 MRI TECHNOLOGIST medical ser.
370 MUFFLER INSTALLER automotive ser.
460 MUNITIONS HANDLER ordnance
212 MUSEUM ATTENDANT & GUIDE museums
380 MUSEUM PREPARATOR museums

Group Occupation Industry Group Occupation Industry
No. No.
3-17
220 MUSICIAN, INSTRUMENTAL amuse. & rec.
330 NAILING MACHINE OPERATOR any industry
111 NAVIGATOR air trans.
360 NEWS GATHERING TECHNICIAN radio-tv broad.
210 NEWSCASTER radio-tv broad.
330 NIBBLER OPERATOR any industry
111 NIGHT AUDITOR hotel & rest.
460 NITROGLYCERIN DISTRIBUTOR chemical
310 NUCLEAR MEDICINE
TECHNOLOGIST
medical ser.
330 NUMERICAL CONTROL MACHINE
OPERATOR
machine shop
340 NURSE AIDE medical ser.
220 NURSE ANESTHETIST medical ser.
212 NURSE CASE MANAGER medical ser.
311 NURSE, GENERAL DUTY medical ser.
311 NURSE, LICENSED VOCATIONAL medical ser.
311 NURSE, PRIVATE DUTY medical ser.
212 NURSE, SCHOOL medical ser.
311 NURSE-MIDWIFE medical ser.
460 NUT ROASTER can. & preserv.
212 OCCUPATIONAL ANALYST profess. & kin.
311 OCCUPATIONAL THERAPIST medical ser.
340 OCCUPATIONAL THERAPY AIDE medical ser.
213 OCCUPATIONAL SAFETY AND
HEALTH INSPECTOR
government ser.
211 OFFICE CLERK, GENERAL clerical
320 OFFICE MACHINE SERVICER any industry
330 OFFSET PRESS HELPER print. & pub.
230 OFFSET DUPLICATING MACHINE
OPERATOR
clerical
230 OFFSET PRESS OPERATOR print. & pub.
480 OIL WELL DRILLER petrol. & gas
340 OILER any industry
332 OPERATING ENGINEER any industry
332 OPERATING ENGINEER,
REFRIGERATION
any industry
111 OPTICAL ENGINEER profess. & kin.
220 OPTICIAN, DISPENSING optical goods
220 OPTICIAN, LENS GRINDER optical goods
220 OPTOMETRIST medical ser.
491 ORCHARD SPRAYER, HAND agriculture
360 ORDER CHECKER clerical
111 ORDER CLERK clerical
214 ORDER CLERK clerical
214 ORDER FILLER, CATALOG SALES retail trade
460 ORDERLY medical ser.
481 ORNAMENTAL IRON WORKER construction
120 ORTHODONTIC TECHNICIAN protective dev.
320 ORTHOTICS TECHNICIAN protective dev.
310 ORTHOTIST medical ser.
331 OVEN TENDER bakery products
351 OVERHEAD CRANE OPERATOR any industry
331 OXIDIZED FINISH PLATER any industry
221 OXIDIZER jewelry-silver.
330 PACKAGE SEALER, MACHINE any industry
330 PACKAGER, MACHINE any industry
360 PACKER, AGRICULTURAL PRODUCE agriculture
360 PACKER, HAND any industry
380 PAINTER construction
480 PAINTER HELPER construction
221 PAINTER, AIRBRUSH any industry
482 PAINTER, BRIDGE, STRUCTURAL
STEEL
construction
321 PAINTER, BRUSH any industry
120 PAINTER, HAND, DECORATIVE any industry
380 PAINTER, SIGN any industry
321 PAINTER, SPRAY GUN any industry
321 PAINTER, TOUCH-UP any industry
350 PAINTER, TRAFFIC LINE construction
380 PAINTER, TRANSPORTATION
EQUIPMENT
aircraft mfg.
230 PALLETIZER OPERATOR,
AUTOMATIC
any industry
230 PAPER CUTTER, MACHINE beverage
460 PAPER-BALING MACHINE TENDER any industry
331 PAPER-MAKING MACHINE
OPERATOR
paper & pulp
460 PAPERCUTTING MACHINE
OPERATOR
print. & pub.
380 PAPERHANGER construction
321 PARACHUTE RIGGER air trans.
211 PARALEGAL profess. & kin.
490 PARAMEDIC medical ser.

Group Occupation Industry Group Occupation Industry
No. No.
3-18
211 PARIMUTUEL TICKET SELLER amuse. & rec.
490 PARK RANGER government ser.
250 PARKING ENFORCEMENT OFFICER government ser.
240 PARKING LOT ATTENDANT, BOOTH automotive serv.
214 PARKING LOT ATTENDANT automotive ser.
490 PAROLE OFFICER profess. & kin.
214 PARTS CLERK clerical
214 PARTS ORDER AND STOCK CLERK clerical
460 PASTEURIZER dairy products
250 PATROL OFFICER, VOLUNTEER government serv.
230 PATTERN-PUNCHING MACHINE
OPERATOR
tex. prod., nec
320 PATTERNMAKER, ALL-AROUND foundry
320 PATTERNMAKER, METAL foundry
320 PATTERNMAKER, WOOD foundry
221 PEELER, HAND can. & preserv.
230 PEELER, MACHINE can. & preserv.
320 PERCUSSION INSTRUMENT
REPAIRER
any industry
310 PERFUSIONIST medical ser.
390 PERSONAL TRAINER amuse. & rec.
111 PERSONNEL RECORDS CLERK clerical
111 PERSONNEL RECRUITER profess. & kin.
220 PHARMACIST medical ser.
220 PHLEBOTOMIST medical ser.
211 PHOTOCOPYING MACHINE
OPERATOR
clerical
221 PHOTOENGRAVER print. & pub.
221 PHOTOFINISHING LABORATORY
WORKER
photofinishing
213 PHOTOGRAPHER amuse. & rec.
212 PHOTOGRAPHER, STILL profess. & kin.
221 PHOTOGRAPHIC PLATE MAKER electron. comp.
213 PHOTOJOURNALIST print. & pub.
230 PHOTOTYPESETTER OPERATOR print. & pub.
310 PHYSIATRIST medical ser.
311 PHYSICAL THERAPIST medical ser.
340 PHYSICAL THERAPY AIDE medical ser.
212 PHYSICIAN ASSISTANT medical ser.
220 PHYSICIAN, GENERAL
PRACTITIONER
medical ser.
320 PIANO TECHNICIAN any industry
221 PIANO TUNER any industry
491 PICKER, FRUIT agriculture
330 PICKING MACHINE OPERATOR any industry
221 PICTURE FRAMER retail trade
351 PILE-DRIVER OPERATOR construction
370 PINSETTER ADJUSTER, AUTOMATIC toy-sport equip.
380 PINSETTER MECHANIC, AUTOMATIC any industry
380 PIPE COVERER AND INSULATOR ship-boat mfg.
481 PIPE FITTER construction
480 PIPE LAYER construction
481 PIPE FITTER HELPER construction
480 PIPE LAYER HELPER construction
380 PIPE ORGAN TUNER AND REPAIRER any industry
480 PIPELINER pipe lines
214 PIT BOSS/FLOOR PERSON amusement & rec.
330 PLANER OPERATOR woodworking
430 PLANER OPERATOR, METAL
CASTINGS
machine shop
212 PLANT ENGINEER profess. & kin.
321 PLASTER MAKER nonmet. min.
320 PLASTER MOLDER foundry
420 PLASTER DIE MAKER pottery & porc.
380 PLASTERER construction
480 PLASTERER HELPER construction
230 PLATEN PRESS FEEDER print. & pub.
230 PLATEN PRESS OPERATOR print. & pub.
330 PLATER electroplating
460 PLATER, ELECTROLESS, PRINTED
CIRCUIT BOARDS
electron. comp.
460 PLATER, HOT DIP galvanizing
460 PLATER, PRINTED CIRCUIT BOARD
PANELS
electron. comp.
221 PLATER, SEMICONDUCTOR WAFERS
& COMPONENTS
electron. comp.
230 PLEATING MACHINE OPERATOR any industry
481 PLUMBER construction
481 PLUMBER APPRENTICE construction
481 PLUMBER HELPER construction
370 PNEUMATIC TOOL REPAIRER any industry
380 PNEUMATIC TUBE REPAIRER any industry
220 PODIATRIST medical ser.
251 POLICE ARTIST government ser.

Group Occupation Industry Group Occupation Industry
No. No.
3-19
490 POLICE CAPTAIN government ser.
111 POLICE CLERK government ser.
490 POLICE OFFICER government ser.
490 POLICE OFFICER, STATE HIGHWAY government ser.
120 POLISHER, EYEGLASS FRAMES optical goods
321 POLISHER/BUFFER any industry
330 POLISHING MACHINE OPERATOR any industry
212 POLYGRAPH EXAMINER profess. & kin.
360 PORTER air trans.
360 PORTER, BAGGAGE hotel & rest.
330 POTTERY MACHINE OPERATOR pottery & porc.
322 POULTRY DRESSER agriculture
430 POWER BRAKE OPERATOR any industry
230 POWER BARKER OPERATOR paper & pulp
332 POWER PLANT OPERATOR utilities
330 POWER PRESS TENDER any industry
332 POWER REACTOR OPERATOR utilities
351 POWER SHOVEL OPERATOR any industry
481 POWERHOUSE MECHANIC utilities
370 PRECISION ASSEMBLER & REPAIRER aircraft mfg.
320 PRECISION ASSEMBLER, BENCH aircraft mfg.
110 PRESIDENT any industry
230 PRESS OPERATOR laundry & rel.
330 PRESS OPERATOR, CYLINDER print. and pub.
430 PRESS OPERATOR, HEAVY DUTY any industry
331 PRESS OPERATOR, MEAT meat products
230 PRESS OPERATOR, OFFSET print. & pub.
330 PRESS OPERATOR, ROTOGRAVURE print. & pub.
321 PRESSER, ALL-AROUND laundry & rel.
221 PRESSER, HAND any industry
321 PRESSER, MACHINE any industry
230 PRINT DEVELOPER, AUTOMATIC photofinishing
221 PRINTED CIRCUIT BOARD
ASSEMBLER, HAND
comm. equip.
120 PRINTED CIRCUIT DESIGNER profess. & kin.
320 PRINTER, JOB print. & pub.
390 PROBATION OFFICER profess. & kin.
251 PROCESS SERVER business ser.
360 PRODUCE CLERK, RETAIL retail trade
212 PRODUCER radio-tv broad.
212 PROMPTER amuse. & rec.
211 PROOFREADER print. & pub.
111 PROOFREADER, PRODUCTION print. & pub.
380 PROP MAKER amuse. & rec.
320 PROSTHETICS TECHNICIAN protective dev.
310 PROSTHETIST medical ser.
311 PSYCHIATRIC TECHNICIAN medical ser.
340 PSYCHIATRIC WARD ATTENDANT medical ser.
110 PSYCHOLOGIST, CLINICAL profess. & kin.
110 PSYCHOLOGIST, COUNSELING profess. & kin.
110 PUBLIC HEALTH SERVICE OFFICER government ser.
380 PUBLIC ADDRESS SETTER-UP &
SERVICER
any industry
111 PUBLIC RELATIONS
REPRESENTATIVE
profess. & kin.
212 PULMONARY FUNCTION
TECHNICIAN
medical ser.
470 PUMP INSTALLER any industry
370 PUMP SERVICER any industry
330 PUMP MACHINE OPERATOR any industry
332 PUMP STATION OPERATOR,
WATERWORKS
waterworks
330 PUNCH PRESS OPERATOR any industry
430 PUNCH PRESS OPERATOR,
AUTOMATIC
any industry
251 PURCHASING AGENT profess. & kin.
111 PURSER water trans.
321 PUTTY GLAZER, POTTERY any industry
221 QUALITY ASSURANCE MONITOR auto. mfg.
212 QUALITY CONTROL TECHNICIAN profess. & kin.
480 QUARRY WORKER mine & quarry
120 QUICK SKETCH ARTIST amuse. & rec.
221 RACKET STRINGER toy-sport equip.
330 RADIAL ARM SAW OPERATOR woodworking
320 RADIAL DRILL PRESS SETUP machine shop
310 RADIATION THERAPY
TECHNOLOGIST
medical ser.
212 RADIOGRAPHER, INDUSTRIAL any industry
310 RADIOLOGIC TECHNOLOGIST medical ser.
380 RADIOLOGICAL EQUIPMENT
SPECIALIST
inst. & app.
212 RADIOTELEPHONE OPERATOR any industry
481 RAILROAD CAR BUILDER railroad equip.
481 RAILWAY CAR REPAIRER railroad equip.

Group Occupation Industry Group Occupation Industry
No. No.
3-20
460 RAMP ATTENDANT air trans.
111 RATER insurance
251 REAL ESTATE AGENT profess. & kin.
321 REAMER, HAND machine shop
330 REAMING MACHINE TENDER nonfer. metal
111 RECEPTIONIST clerical
212 RECORDING ENGINEER radio-tv broad.
360 RECORDING STUDIO SET-UP
WORKER
recording
230 RECORDIST motion picture
214 RECREATION AIDE social ser.
310 RECREATIONAL THERAPIST medical ser.
111 RECRUITER, PERSONNEL profess. & kin.
111 REGISTRATION CLERK government ser.
212 REHABILITATION CENTER
MANAGER
government ser.
481 REINFORCING IRON WORKER construction
221 REPAIRER furniture
220 REPAIRER, ART OBJECTS any industry
320 REPAIRER, OFFICE MACHINES any industry
320 REPAIRER, SALVAGED PARTS any industry
320 REPAIRER, SMALL APPLIANCE house. appl.
320 REPAIRER, WIND INSTRUMENT any industry
220 REPAIRER/ADJUSTER office machines
251 REPORTER print. & pub.
110 REPORTS ANALYST profess. & kin.
213 REPOSSESSOR clerical
460 RESAW OPERATOR woodworking
111 RESEARCHER profess. & kin.
111 RESERVATION CLERK clerical
111 RESERVATIONS AGENT air trans.
311 RESPIRATORY THERAPIST medical ser.
340 RESPIRATORY THERAPY AIDE medical ser.
240 REST ROOM ATTENDANT any industry
380 RESTORATION TECHNICIAN museums
214 RETAIL CLERK retail trade
111 REVIEWER, FINAL APPLICATION insurance
330 REWINDER OPERATOR paper goods
230 RICE GRADER grain-feed mills
240 RIDE OPERATOR amuse. & rec.
482 RIGGER ship-boat mfg.
482 RIGGER, HIGH amuse. & rec.
481 RIGGER/SLINGER any industry
330 RIPSAW OPERATOR woodworking
230 RIVET AND BOLT MAKER any industry
330 RIVETER, HYDRAULIC any industry
481 RIVETER, PNEUMATIC any industry
330 RIVETING MACHINE OPERATOR,
AUTOMATIC
aircraft mfg.
330 RIVETING MACHINE OPERATOR any industry
351 ROAD ROLLER OPERATOR construction
330 ROBOTIC MACHINE OPERATOR aircraft mfg.
470 ROBOTICS SERVICE TECHNICIAN machinery mfg.
351 ROCK DRILL OPERATOR construction
560 ROLL TENDER/SETTER print. & pub.
330 ROLLER MACHINE OPERATOR metal prod., nec
230 ROLLING MILL ATTENDANT steel & rel.
380 ROOFER construction
480 ROOFER HELPER construction
322 ROOM SERVICE CLERK hotel & rest.
480 ROTARY DRILLER petrol. & gas
480 ROTARY DRILLER HELPER petrol. & gas
230 ROUGHER, BAR MILL steel & rel.
480 ROUGHNECK petrol. & gas
480 ROUSTABOUT petrol. & gas
211 ROUTER clerical
330 ROUTER OPERATOR any industry
330 ROUTER OPERATOR woodworking
460 RUBBER CUTTER rubber goods
230 RUBBER MILL OPERATOR plastic-synth.
340 RUG CLEANER, HAND OR MACHINE laundry & rel.
321 RUG REPAIRER laundry & rel.
420 SADDLE MAKER leather prod.
212 SAFETY ENGINEER profess. & kin.
212 SAFETY MANAGER profess. & kin.
380 SAIL MAKER ship-boat mfg.
322 SALAD MAKER water trans.
212 SALES AGENT, INSURANCE insurance
214 SALES CLERK retail trade
251 SALES REP, FARM, GARDEN EQPT. &
SUPPLIES
wholesale tr.
212 SALES REP, ADVERTISING print. & pub.
251 SALES REP, COMPUTERS AND EDP
SYSTEMS
wholesale tr.

Group Occupation Industry Group Occupation Industry
No. No.
3-21
212 SALES REP, DATA PROCESSING
SERVICES
business ser.
251 SALES REP, DOOR-TO-DOOR retail trade
212 SALES REP, FINANCIAL SERVICES financial
251 SALES REP, LIVESTOCK wholesale tr.
251 SALES REP, OFFICE MACHINES retail trade
251 SALES REP, RECREATION, SPORTING
GOODS
wholesale tr.
251 SALES REP, SECURITY SYSTEMS business ser.
212 SALES REP, UPHOLSTERY,
FURNITURE REPAIR
retail trade
251 SALES REP, WOMEN'S AND GIRLS'
APPAREL
wholesale tr.
251 SALESPERSON, AUTOMOBILES retail trade
214 SALESPERSON, GENERAL
MERCHANDISE
retail trade
214 SALESPERSON, PARTS retail trade
214 SALESPERSON, SHOES retail trade
430 SALVAGE CUTTER welding
480 SANDBLASTER any industry
330 SANDER, MACHINE woodworking
322 SANDWICH MAKER hotel & rest.
331 SAUSAGE MAKER meat products
331 SAUSAGE STUFFER meat products
321 SAW BLADE FILER any industry
360 SAWMILL WORKER saw. & plan.
330 SAWYER plastic prod.;
plastic-synth.
230 SAWYER, CIRCULAR HEAD saw. & plan.
230 SAWYER, CORK SLABS wood prod., nec
330 SAWYER, TRIMMER saw. & plan.
111 SCHEDULER clerical
212 SCHOOL PRINCIPAL education
111 SCOREBOARD OPERATOR amuse. & rec.
251 SCOUT, PROFESSIONAL SPORTS amuse. & rec.
460 SCRAP HANDLER any industry
320 SCREEN MAKER, PHOTOGRAPHIC
PROCESS
any industry
221 SCREEN MAKER, WALLPAPER paper goods
330 SCREW MACHINE OPERATOR,
MULTIPLE SPINDLE
machine shop
330 SCROLL MACHINE OPERATOR struct. metal
321 SCULPTOR stonework
112 SECRETARY clerical
112 SECRETARY, LEGAL clerical
112 SECRETARY, MEDICAL medical ser.
112 SECRETARY, SOCIAL clerical
212 SECURITY GUARD, GATE any industry
213 SECURITY GUARD, PLANT any industry
390 SECURITY OFFICER any industry
230 SEED PELLETER agriculture
212 SEISMOLOGIST profess. & kin.
330 SEMICONDUCTOR PROCESSOR electron. comp.
380 SEPTIC TANK INSTALLER construction
480 SEPTIC TANK SERVICER construction
214 SERVICE MANAGER automotive ser.
213 SERVICE REPRESENTATIVE utilities
340 SERVICE STATION ATTENDANT automotive ser.
213 SET DESIGNER motion picture
320 SETTER, AUTOMATIC SPINNING
LATHE
any industry
360 SET-UP PERSON, TRADE SHOW retail trade
480 SEWAGE DISPOSAL WORKER sanitary ser.
221 SEWER, HAND any industry
480 SEWER LINE REPAIRER sanitary ser.
341 SEWER PIPE CLEANER business ser.
230 SEWING MACHINE OPERATOR tex. prod., nec
370 SEWING MACHINE REPAIRER any industry
330 SHAPER OPERATOR woodworking
330 SHAPING MACHINE OPERATOR machine shop
430 SHEAR OPERATOR any industry
370 SHEETMETAL MECHANIC any industry
320 SHEETMETAL FABRICATING
MACHINE OPERATOR
any industry
491 SHELLFISH GROWER fishing & hunt.
490 SHERIFF, DEPUTY government ser.
481 SHIPFITTER ship-boat mfg.
480 SHIPFITTER HELPER ship-boat mfg.
360 SHIPPING AND RECEIVING CLERK clerical
214 SHIPPING CHECKER clerical
380 SHIPWRIGHT ship-boat mfg.
221 SHOE REPAIRER personal ser.
214 SHOP ESTIMATOR automotive ser.
210 SHOW HOST/HOSTESS radio-tv broad.

Group Occupation Industry Group Occupation Industry
No. No.
3-22
250 SHUTTLE BUS DRIVER any industry
380 SIDER construction
341 SIGN POSTER any industry
120 SIGN WRITER, HAND any industry
221 SILK SCREEN ETCHER engraving
221 SILK SCREEN PRINTER any industry
221 SILK SCREEN FRAME ASSEMBLER any industry
220 SILVERSMITH jewelry-silver.
210 SINGER amuse. & rec.
493 SKI INSTRUCTOR amuse. & rec.
240 SKI LIFT OPERATOR amuse. & rec.
590 SKI PATROLLER amuse. & rec.
221 SKI REPAIRER, PRODUCTION toy-sport equip.
420 SKINNER meat products
480 SKIP TENDER mine & quarry
111 SKIP TRACER clerical
460 SLASHER TENDER textile
230 SLICING MACHINE OPERATOR bakery products
460 SLITTING MACHINE OPERATOR
HELPER
any industry
331 SLURRY BLENDER cement
370 SMOG TECHNICIAN automotive ser.
590 SMOKE JUMPER forestry
351 SNOWPLOW OPERATOR government ser.
230 SOAP MAKER soap & rel.
111 SOCIAL WORKER social ser.
111 SOFTWARE ENGINEER profess. & kin.
213 SOIL CONSERVATIONIST profess. & kin.
481 SOLAR ENERGY SYSTEM INSTALLER any industry
470 SOLAR FABRICATION TECHNICIAN machine shop
120 SOLDERER jewelry-silver.
111 SORTER clerical
221 SORTER, AGRICULTURAL PRODUCE agriculture
221 SORTER, REMNANT textile
214 SORTER-PRICER nonprofit org.
212 SOUND MIXER motion picture
212 SOUND EFFECTS TECHNICIAN radio-tv broad.
322 SOUS CHEF hotel & rest.
490 SPECIAL AGENT government ser.
390 SPECIAL POLICEMAN any industry
212 SPEECH PATHOLOGIST profess. & kin.
331 SPINNER sugar & conf.
430 SPINNER, HYDRAULIC any industry
330 SPINNING LATHE OPERATOR any industry
221 SPORTS EQUIPMENT REPAIRER any industry
221 SPOT CLEANER laundry & rel.
111 SPOTTER, PHOTOGRAPHIC photofinishing
330 SPRAY PAINTING MACHINE
OPERATOR
any industry
460 SPREADER MACHINE, CLOTH textile
491 STABLE ATTENDANT any industry
230 STAMPING PRESS OPERATOR any industry
390 STAND-IN motion picture
330 STAPLING MACHINE OPERATOR any industry
380 STATION INSTALLER AND REPAIRER tel. & tel.
332 STATIONARY ENGINEER any industry
111 STATISTICIAN, APPLIED profess. & kin.
340 STEAM CLEANER automotive ser.
482 STEEL ERECTOR construction
380 STEEL PLATE CAULKER any industry
482 STEEPLE JACK construction
112 STENOCAPTIONER radio-tv broad.
112 STENOGRAPHER clerical
112 STENOTYPE OPERATOR clerical
330 STEREOTYPE CASTER & MOLDER print. & pub.
230 STERILIZER medical ser.
351 STEVEDORE water trans.
230 STILL TENDER any industry
230 STITCHER, STANDARD MACHINE boot & shoe
230 STITCHER, WIRE, SADDLE AND SIDE print. & pub.
214 STOCK CLERK clerical
360 STOCK CLERK clerical
360 STOCK CLERK retail trade
214 STOCK CLERK, AUTOMOTIVE EQPT. clerical
321 STONE CARVER stonework
480 STONE DRILLER stonework
220 STONE SETTER jewelry-silver.
480 STONE SPLITTER OPERATOR stonework
321 STONECUTTER, HAND stonework
330 STONECUTTER, MACHINE stonework
380 STONEMASON construction
120 STONER jewelry-silver.
470 STOVE REFINISHER any industry
321 STRAIGHTENER, HAND any industry

Group Occupation Industry Group Occupation Industry
No. No.
3-23
330 STRAIGHTENING PRESS OPERATOR any industry
330 STRANDING MACHINE OPERATOR elec. equip.
460 STRAPPING MACHINE OPERATOR wood. container
340 STREET CLEANER/SWEEPER,
MANUAL
government ser.
380 STREET LIGHT SERVICER utilities
351 STREET SWEEPER OPERATOR government ser.
111 STRESS ANALYST aircraft mfg.
212 STRESS TEST TECHNICIAN medical ser.
230 STRETCHING MACHINE TENDER,
FRAME
leather mfg.
221 STRIPER & LETTERER, HAND,
MOTORCYCLES
any industry
331 STRIPPER-ETCHER, PRINTED
CIRCUIT BOARDS
electron. comp.
482 STRUCTURAL STEEL WORKER construction
482 STRUCTURAL STEEL WORKER
HELPER
construction
380 STUCCO MASON construction
590 STUNT PERFORMER amuse. & rec.
320 SUBASSEMBLER machinery mfg.
332 SUBSTATION OPERATOR utilities
250 SUBWAY CAR OPERATOR r.r. trans.
332 SUPERCALENDER OPERATOR paper & pulp
212 SUPERINTENDENT, BUILDING any industry
213 SUPERINTENDENT, CONSTRUCTION construction
212 SUPERINTENDENT, PLANT
PROTECTION
any industry
360 SUPPLY CLERK clerical
220 SURGEON medical ser.
230 SURGICAL DRESSING MAKER,
MACHINE
protective dev.
212 SURGICAL TECHNICIAN medical ser.
213 SURVEYOR surveying/carto-
graphic
360 SURVEYOR HELPER any industry
340 SWIMMING POOL SERVICER any industry
111 SWITCHBOARD OPERATOR, POLICE
DISTRICT
government ser.
331 SYRUP MAKER beverage
111 SYSTEMS ANALYST profess. & kin.
111 SYSTEMS PROGRAMMER profess. & kin.
230 TACKING MACHINE OPERATOR any industry
221 TAILOR, ALTERATION garment
221 TAILOR, CUSTOM garment
460 TANK CLEANER any industry
380 TAPER construction
120 TAPER, PRINTED CIRCUIT LAYOUT electron. comp.
330 TAPPING MACHINE TENDER nut & bolt
111 TAX CLERK clerical
111 TAX PREPARER business ser.
250 TAXI DRIVER motor trans.
311 TAXIDERMIST profess. & kin.
214 TEACHER AIDE education
212 TEACHER, ADULT EDUCATION education
214 TEACHER, ELEMENTARY SCHOOL education
214 TEACHER, INDUSTRIAL ARTS education
214 TEACHER, LEARNING DISABLED education
214 TEACHER, MUSIC education
390 TEACHER, PHYSICAL EDUCATION education
214 TEACHER, PHYSICALLY IMPAIRED education
214 TEACHER,
PRESCHOOL/KINDERGARTEN
education
212 TEACHER, SECONDARY SCHOOL education
214 TEACHER, VOCATIONAL TRAINING education
120 TECHNICAL ILLUSTRATOR profess. & kin.
112 TELEGRAPH OPERATOR clerical
112 TELEPHONE OPERATOR clerical
112 TELEPHONE ANSWERING SERVICE
OPERATOR
business ser.
350 TELEPHONE DIRECTORY DELIVERER business ser.
111 TELEVISION CONSOLE MONITOR radio-tv broad.
380 TELEVISION RECEIVER/ANTENNA
INSTALLER
any industry
470 TELEVISION TECHNICIAN radio-tv broad.
320 TELEVISION AND RADIO REPAIRER any industry
211 TELLER financial
214 TELLER, VAULT financial
320 TEMPLATE MAKER any industry
380 TERRAZZO INSTALLER construction
480 TERRAZZO INSTALLER HELPER construction
220 TEST TECH, SEMICONDUCTOR
PROCESSING EQUIPMENT
electron. comp.
320 TESTER, NONDESTRUCTIVE profess. & kin.

Group Occupation Industry Group Occupation Industry
No. No.
3-24
212 TESTING MACHINE OPERATOR,
METAL
profess. & kin.
370 THERMAL CUTTER, HAND welding
330 THERMAL CUTTING-MACHINE
OPERATOR
welding
320 THERMOSTAT REPAIRER inst. & app.
221 THREAD CUTTER, HAND OR
MACHINE
any industry
330 THREADING MACHINE OPERATOR machine shop
321 THROWER pottery & porc.
212 TICKET AGENT any industry
213 TICKET INSPECTOR,
TRANSPORTATION
r.r. transportation
230 TICKET PRINTER any industry
240 TICKET TAKER amuse. & rec.
330 TILE MAKER brick & tile
380 TILE SETTER construction
480 TILE SETTER HELPER construction
330 TIMBER-SIZER OPERATOR saw. & plan.
212 TIME AND MOTION STUDY
ANALYST
profess. & kin.
321 TIRE BUILDER, AUTOMOBILE rubber tire
460 TIRE CHANGER automotive ser.
460 TIRE MOLDER rubber tire
321 TIRE RECAPPER automotive ser.
460 TIRE REPAIRER automotive ser.
420 TIRE TRIMMER, HAND rubber tire
211 TITLE SEARCHER real estate
211 TOLL COLLECTOR government ser.
220 TOOL DESIGNER profess. & kin.
330 TOOL DRESSER any industry
320 TOOL MAKER machine shop
320 TOOL MAKER, BENCH machine shop
120 TOOL PROGRAMMER, NUMERICAL
CONTROL
electron. comp.
360 TOOL AND EQUIPMENT RENTAL
CLERK
business ser.
360 TOOL CRIB ATTENDANT clerical
430 TORCH STRAIGHTENER AND
HEATER
any industry
221 TOUCH-UP PAINTER, HAND any industry
482 TOWER ERECTOR construction
212 TOXICOLOGIST pharmaceut.
221 TOY ASSEMBLER toy-sport equip.
351 TRACTOR OPERATOR any industry
351 TRACTOR CRANE OPERATOR any industry
111 TRAFFIC CLERK business ser.
212 TRAFFIC ENGINEER government ser.
490 TRAFFIC OFFICER government ser.
111 TRAIN DISPATCHER r.r. trans.
112 TRANSCRIBING MACHINE
OPERATOR
clerical
370 TRANSFORMER ASSEMBLER elec. equip.
111 TRANSLATOR, DOCUMENTS profess. & kin.
492 TREE CUTTER agriculture
491 TREE PRUNER, LOW LEVEL/BUCKET agriculture
482 TREE SURGEON agriculture
482 TREE TRIMMER tel. & tel.
230 TRIMMER, MACHINE garment
322 TRIMMER, MEAT meat products
221 TROPHY ASSEMBLER jewelry-silver.
350 TRUCK DRIVER any industry
350 TRUCK DRIVER, CONCRETE MIXING construction
350 TRUCK DRIVER, DUMP TRUCK any industry
350 TRUCK DRIVER, GARBAGE motor trans.
350 TRUCK DRIVER, LOGS logging
351 TRUCK DRIVER, ROAD OILING construction
350 TRUCK DRIVER, SALES ROUTE retail trade
350 TRUCK DRIVER, TANK TRUCK petrol. refin.
350 TRUCK DRIVER, TOW TRUCK automotive ser.
350 TRUCK DRIVER, TRACTOR-TRAILER any industry
460 TRUCK LOADER any industry
460 TRUCK DRIVER HELPER any industry
380 TRUSS BUILDER, CONSTRUCTION construction
320 TUBE ASSEMBLER, CATHODE RAY electron. comp.
221 TUBE BENDER, HAND any industry
341 TUBE CLEANER any industry
330 TUBULAR FURNITURE MAKER any industry
111 TUMOR REGISTRAR medical ser.
332 TURBINE ATTENDANT utilities
332 TURBINE OPERATOR utilities
330 TURRET LATHE OPERATOR machine shop
212 TUTOR education
221 TYPESETTER/COMPOSITOR print. & pub.

Group Occupation Industry Group Occupation Industry
No. No.
3-25
230 TYPESETTING MACHINE TENDER print. & pub.
112 TYPIST clerical
212 ULTRASOUND TECHNOLOGIST medical ser.
214 UMPIRE amuse. & rec.
110 UNDERWRITER, MORTGAGE LOAN financial
321 UPHOLSTERY REPAIRER furniture
110 URBAN PLANNER profess. & kin.
370 USED CAR RENOVATOR retail trade
240 USHER amuse. & rec.
330 UTILITY OPERATOR saw. & plan.
320 VACUUM CLEANER REPAIRER any industry
351 VACUUM CLEANER OPERATOR,
INDUSTRIAL
any industry
250 VALET, PARKING automotive serv.
330 VARIETY SAW OPERATOR woodworking
112 VARITYPE OPERATOR clerical
214 VAULT CASHIER business ser.
213 VENDOR amuse. & rec.
340 VENETIAN BLIND CLEANER AND
REPAIRER
any industry
311 VETERINARIAN medical ser.
311 VETERINARIAN, LABORATORY
ANIMAL CARE
medical ser.
311 VETERINARY TECHNICIAN medical ser.
212 VIDEOTAPE OPERATOR, STUDIO radio-tv broad.
110 VOCATIONAL REHABILITATION
CONSULTANT
government ser.
212 VOICE PATHOLOGIST profess. & kin.
221 WAFER FAB OPERATOR electron. comp.
322 WAITER/WAITRESS hotel & rest.
480 WALLPAPER REMOVER, STEAM construction
360 WAREHOUSE WORKER any industry
331 WASHER, MACHINE any industry
340 WASHER, MACHINE laundry & rel.
460 WASHING MACHINE LOADER AND
PULLER
laundry & rel.
460 WASTE DISPOSAL ATTENDANT,
RADIOACTIVE
any industry
332 WASTE TREATMENT OPERATOR chemical
332 WASTEWATER TREATMENT PLANT
OPERATOR
sanitary ser.
220 WATCH REPAIRER clock & watch
380 WATER METER INSTALLER waterworks
332 WATER PUMP TENDER any industry
460 WATER SOFTENER SERVICER AND
INSTALLER
business ser.
332 WATER TREATMENT PLANT
OPERATOR
waterworks
481 WAYSMAN ship-boat mfg.
230 WEAVER, TEXTILE nonmet. min.
330 WEB PRESS OPERATOR HELPER,
OFFSET
print. & pub.
330 WEB PRESS OPERATOR print. & pub.
360 WEIGHER, PRODUCTION any industry
214 WEIGHER, SHIPPING AND
RECEIVING
clerical
240 WEIGHT REDUCTION SPECIALIST personal services
460 WELDER HELPER welding
430 WELDER, ARC welding
370 WELDER, COMBINATION welding
370 WELDER, GAS welding
370 WELDER, GUN welding
370 WELDER, PRODUCTION LINE welding
430 WELDER, TACK welding
380 WELDER-FITTER welding
330 WELDING MACHINE OPERATOR,
ARC
welding
480 WELL DIGGER construction
480 WELL PULLER petrol. & gas
480 WELL DRILL OPERATOR construction
480 WELL DRILL OPERATOR HELPER construction
320 WHEEL LACER AND TRUER motor-bicycles
482 WIND GENERATING ELECTRIC
POWER INSTALLER
construction
482 WIND TURBINE TECHNICIAN construction;
utilities
330 WINDER paper goods
460 WINDER OPERATOR, FLOOR
COVERINGS
fabrication
230 WINDER, MAGNETIC TAPE recording
330 WINDER, YARN tex. prod., nec
330 WINDING-MACHINE OPERATOR,
CLOTH
textile
341 WINDOW CLEANER any industry

Group Occupation Industry Group Occupation Industry
No. No.
3-26
380 WINDOW REPAIRER any industry
213 WINE MAKER beverage
240 WINE STEWARD/STEWARDESS hotel & rest.
332 WINERY WORKER beverage
221 WIRE HARNESS ASSEMBLER elec. equip.
330 WIRE DRAWING MACHINE TENDER nonfer. metal
230 WIRE WRAPPING MACHINE
OPERATOR
electron. comp.
330 WOOD-CARVING MACHINE
OPERATOR
woodworking
321 WOOL AND PELT GRADER meat products
112 WORD PROCESSING MACHINE
OPERATOR
clerical
330 WRAPPING MACHINE OPERATOR any industry
480 WRECKER, CONSTRUCTION construction
112 WRITER, PROSE, FICTION AND
NONFICTION
profess. & kin.
112 WRITER, TECHNICAL PUBLICATIONS profess. & kin.
212 XRAY OPERATOR, INDUSTRIAL any industry
310 XRAY TECHNOLOGIST medical ser.
460 YARD ATTENDANT, BUILDING
MATERIALS
retail trade
351 YARDER OPERATOR,
FIXED/PORTABLE
logging

3-27
PART B - OCCUPATIONAL GROUP CHART
STRENGTH DESIGNATOR
OCCUPATION
DESIGNATOR
1
Very Light
2
Light
3
Medium
4
Heavy
5
Very Heavy
1 
Professional,
Technical, Clerical
110, 111, 112
Case worker
Auditor
Editor
210, 211, 212, 213, 214
Adm. clerk
Bank clerk
Clerk, general
310, 311
Physical therapist
Chiropractor
Psych. tech.
2 
Hand Intensive 
120
Drafter, civil
Cartoonist
Assemb/semi-cond.
220, 221
Dentist
Microelect. tech.
Surgeon
320, 321, 322
Die maker
Meter repair
Precision assem.
420
Butcher
Saddle maker
Hide puller
3 
Machine Operators,
Tenders
230
Coil winder
Cutter, machine
Palletizer oper.
330, 331, 332
Bend. mach. Oper.
Cut-off sawyer
Laminating mach.
430
Boiler maker
Metal fabricator
Welder-arc
4 
Cleaners,
Attendants
240
Child monitor
Restroom attend.
Ticket taker
340, 341
Auto washer
Janitor
Nurse’s aide
5 
Drivers 
250, 251
Coin-mach. collector
Bus driver
350, 351
Truckdriver/
Tractor-trailer
Truckdriver/
dump
6 
Laborers, Material
Handlers
360
Warehouse worker
Crate maker
Material expediter
460
Baker’s helper
Material stacker
Ramp attendant
560
Ambul. Attendant
Furniture mover
Miner
7 
Mechanics,
Installers, Repairers,
Servicers
370
Mechanic-tractor
Precision assemb.
Welder, gas
470
Mechanic-diesel
Furn. assemb/heavy
TV tech.

3-28
OCCUPATION
DESIGNATOR
1
Very Light
2
Light
3
Medium
4
Heavy
5
Very Heavy
8 
Construction
Workers
380
Electrician
Carpenter-Const
Handy person
480, 481, 482
Bricklayer
Carpenter/
Rough
Millwright
9 
Miscellaneous 
290
Beautician
Barber
Cosmetologist
390
Security officer
Counselor, camp
490, 491, 492, 493
Farm laborer
Gardener
Log sorter
590
Athlete
Jockey
Dancer

3-29
PART C – OCCUPATIONAL GROUP CHARACTERISTICS
Group 110
Professional Occupations
Some use of keyboards but less than
112 or 112; greater standing and
walking demands than 112 and 120.
Typical occupations: Lawyer, Loan
Officer, Urban Planner
Spine C
Shoulder C
Elbow D
Wrist D
Finger motion. F
Grip D
Leg D
Psych J
Group 111
Professional and Clerical Occupations
Substantial use of keyboards; greater
demands for standing and walking
than 112 and 120.
Typical occupations: Accountant,
Claims Clerk, Reservations Agent
Spine C
Shoulder D
Elbow F
Wrist G
Finger motion G
Grip E
Leg D
Psych I
Group 112
Mostly Clerical Occupations
Highest demand for use of keyboard;
prolonged sitting.
Spine D
Shoulder D
Elbow G
Wrist H
Finger motion I
Typical occupations: Billing Clerk,
Computer Keyboard Operator,
Secretary
Grip E
Leg C
Psych I
Group 120
Most Technical Occupations
Precision work requiring skill and
dexterity; use of hand tools; more
sitting than 110 and 111.
Typical occupations: Electrical
drafter, Illustrator, Jeweler
Spine D
Shoulder E
Elbow G
Wrist H
Finger motion H
Grip F
Leg C
Psych I
Group 210
Mostly Professional Occupations
Extensive speech and hearing;
standing and sitting; may require
driving to business locations; other
physical demands at the lower end of
the light category.
Typical occupations: Actor,
Announcer. Clergy member
Spine D
Shoulder C
Elbow D
Wrist D
Finger motion E
Grip C
Leg E
Psych I

3-30
Group 211
Mostly Clerical Occupations
Emphasis on frequent fingering,
handling, and possibly some keyboard
work; spine and leg demands similar
to 210.
Typical occupations: Bank clerk,
Inventory clerk, License clerk
Spine D
Shoulder D
Elbow F
Wrist G
Finger motion G
Grip E
Leg E
Psych H
Group 212
Mostly Professional and Medical
Occupations
Work predominantly performed
indoors, but may require driving to
locations of business; less use of
hands than 211; slightly higher
demands on spine than 210 & 211.
Typical occupations: Chemist,
Dialysis Technician, Secondary
School Teacher
Spine E
Shoulder E
Elbow E
Wrist F
Finger motion F
Grip E
Leg E
Psych J
Group 213
Mostly Professional Occupations
Work performed indoors and
outdoors; occasional climbing and
uneven ground required, therefore
spine and legs have slightly higher
variants for this strength level.
Spine F
Shoulder E
Elbow E
Wrist E
Finger motion F
Grip E
Leg F
Psych I
Typical occupations: Airplane
Inspector, Meter Reader, Property
Manager
Group 214
Clerical (physically active)
Occupations; Educators, & Retail
Sales Occupations
Very high demand for speech, hearing
and vision; high demand for fingering
and handling; spine and leg demands
at highest level for 200 series.
Typical occupations: Auto Shop
Estimator, Elementary School
Teacher, Retail Sales Clerk
Spine F
Shoulder F
Elbow F
Wrist G
Finger motion G
Grip F
Leg F
Psych I
Group 220
Fine precision Occupations in
medical, electronic and optical
industries
Very high demands for vision; high
demands for hand activity – use of
hand tools; highest variants in this
strength category for fingering and
arm Disabilities.
Typical occupations: Dental
Hygienist, Instrument Maker &
Repairer, Surgeon
Spine E
Shoulder F
Elbow G
Wrist H
Finger motion H
Grip F
Leg E
Psych J

3-31
Group 221
Light Assembly Occupations, Food
Preparation Occupations
Vision important; repetitive fingering
and use of hand tools; similar to 220
for all parts of body except for wrist
and finger motion which is one variant
lower.
Typical occupations: Assembler,
small products Inspector, electronics
Produce Sorter
Spine E
Shoulder F
Elbow G
Wrist G
Finger motion G
Grip F
Leg E
Psych F
Group 230
Machine Operator and Tenders
Average demands for this strength
level on spine and legs; hand activities
are most significant.
Typical occupations: Bottle Packer,
Circular Saw Operator’ Offset Press
Operator
Spine E
Shoulder F
Elbow F
Wrist F
Finger motion G
Grip G
Leg E
Psych F
Group 240
Mostly Attendants (providing
services)
Minimal hand activities; low on arm
activities; average for 200 series on
spine and legs.
Typical occupations: Host/Hostess,
Spine E
Shoulder D
Elbow E
Wrist E
Finger motion E
Grip D
Leg E
Psych G
Parking Lot Attendant, booth,Weight
Reduction Specialist
Group 250
Public Transportation Drivers &
Light Delivery Drivers
Operates light automotive equipment
over public thoroughfares; vision,
hearing and other head disabilities
important; highest variants for spine
and leg activities in 200 series (along
with 213 & 214); grip demands
similar to 251.
Typical occupations: Parking
Enforcement Officer, Subway Car
Operator, Taxi Driver
Spine F
Shoulder F
Elbow G
Wrist F
Finger motion F
Grip F
Leg F
Psych H
Group 251
Outside Sales, Inspectors, & Business
Agents (performing extensive driving
to reach business locations)
Work requires extensive driving of
light automotive equipment over
public thoroughfares to reach business
locations; vision, hearing and other
head disabilities important; average
demand for spine and leg activities for
this strength level; arms are one
variant lower that 250.
Spine E
Shoulder D
Elbow F
Wrist E
Finger motion F
Grip F
Leg E
Psych I

3-32
Typical occupations: Food & Drug
Inspector, Real Estate Agent. Sales,
Rep. sporting goods
Group 290
Personal Attendants
Vision important; cosmetic
appearance important; arms variants
at high end for 200 series.
Typical occupations: Hair Stylist
Spine E
Shoulder G
Elbow G
Wrist H
Finger motion G
Grip F
Leg E
Psych H
Group 310
Medical Occupations
Low end of 300 series for most parts
of body; head disabilities, including
speech, hearing, PTHS are highest in
300 series.
Typical occupations: Acupressurist,
MRI Technologist, X-ray
Technologist
Spine F
Shoulder F
Elbow F
Wrist F
Finger motion F
Grip F
Leg F
Psych I
Group 311
Mostly Medical Occupations
Medical treatments performed result
in higher spine demands; head
disabilities are at the highest levels.
Typical occupations:
Masseur/Masseuse Nurse – LVN,
Psychiatric Technician
Spine G
Shoulder F
Elbow G
Wrist G
Finger motion G
Grip F
Leg F
Psych J
Group 320
Assemblers
Precision work requiring use of hand
tools; highest arm variants for the 320
series; lower end variants for 300
series for spine & leg (same as 321 &
322); highest head variants in 320
series.
Typical occupations: Machinist,
Office Machine Servicer, Television
& Radio Repairer
Spine F
Shoulder F
Elbow H
Wrist I
Finger motion H
Grip H
Leg F
Psych H
Group 321
Assemblers
Use of hand tools required; precision
requirements less than 320 – arm
variants slightly lower; same demand
on spine and legs as 320 & 322.
Typical occupations: Furniture
Spine F
Shoulder F
Elbow G
Wrist H
Finger motion G
Grip G
Leg F
Psych F

3-33
Assembler, Garment Cutter, machine
Painter, spray gun
Group 322
Food Preparation and Service
Occupations
Least precise work in 320 series –
arm variants the lowest; spine & legs
same as 320 & 321
Typical occupations: Airline Flight
Attendant, Cook, Waiter/Waitress
Spine F
Shoulder F
Elbow G
Wrist G
Finger motion G
Grip G
Leg F
Psych G
Group 330
Press Operators, Sawyers, etc.
Most demanding on arms of machine
operations series (330s); spine and
legs at lower end for 300 series, &
same as 331 & 322.
Typical occupations: Blister Machine
Operator, Power Press Tender,
Tubular Furniture Maker
Spine F
Shoulder F
Elbow G
Wrist F
Finger motion G
Grip G
Leg F
Psych F
Group 331
Machine Tending & Processing Spine F
Shoulder F
Observation and control of
machinery; occasional stooping
required; mechanical adjustments
performed; variants similar to 332.
Typical occupations: Coating
Machine Op, Mixing Machine Op,
food prep; Washer, machine
Elbow F
Wrist F
Finger motion F
Grip F
Leg F
Psych F
Group 332
Observation of Large Stationary
Equipment
Work performed in a plant or other
large facility, some mechanical
adjustments of machinery performed
lowest variants for 300 series for most
parts of body.
Typical occupations: Brewery Cellar
Worker, Power Reactor Operator,
Stationary Engineer
Spine F
Shoulder F
Elbow F
Wrist E
Finger motion F
Grip F
Leg F
Psych G
Group 340
Mostly Cleaners
Work involves cleaning equipment
and/or buildings; operation of
cleaning devices, some lifting , some
climbing, lowest variants for head
disabilities of 300 series; lower end of
300 series for arms; highest demands
are for spine & leg activities
Typical occupations: Auto Washer &
Polisher, Janitor, Nurse Aide
Spine G
Shoulder F
Elbow G
Wrist F
Finger motion F
Grip F
Leg G
Psych D

3-34
Group 341
Cleaners (working at high levels)
Work generally performed at high
levels – higher end of 300 series for
spine & legs; average demands on
arms.
Typical occupations: Aircraft Service
Attendant, Sign Poster, Window
Cleaner
Spine G
Shoulder G
Elbow G
Wrist F
Finger motion F
Grip F
Leg G
Psych D
Group 350
Truck Drivers
Operate heavy vehicle over public
thoroughfares; may do some loading
of materials, may tie down loads, may
hook up hoses, etc., and performs
related duties; head disabilities
highest in 300 series.
Typical occupations: Armored Car
Driver, Lunch Truck Driver, Truck
Driver
Spine G
Shoulder F
Elbow H
Wrist F
Finger motion G
Grip G
Leg G
Psych H
Group 351
Heavy Equipment Operators
Operates heavy construction
equipment at work sites; arm
demands at lower end of 300 series;
spine & leg demands at higher end of
300 series.
Typical occupations: Crane Operator,
Forklift Operator, Snowplow
Operator
Spine G
Shoulder G
Elbow H
Wrist G
Finger motion G
Grip G
Leg G
Psych G
Group 360
Porters, Packers
Significant lifting and carrying
required; significant walking
required; may occasionally climb at
low levels; variants are “G” for most
parts of body; head disabilities are
mostly “F”or lower.
Typical occupations: Clerk, Shipping;
Conveyor Tender; Warehouse worker
Spine G
Shoulder G
Elbow G
Wrist F
Finger motion F
Grip G
Leg G
Psych E
Group 370
Mechanical Assembly, Installation,
Repairers
Mechanical work on automobiles,
machinery and other equipment,
requiring a combination of some skill
and significant physical effort;
highest variants in 300 series for arm
Spine G
Shoulder G
Elbow I
Wrist J
Finger motion H
Grip H
Leg G
Psych H

3-35
and head disabilities
Typical occupations: Automobile
Accessories Installer; Mechanic,
automobile; Welder, Combination
Group 380
Skilled Construction Work
Work requires construction of
buildings or large structure; strenuous
demands on arms, legs & spine result
in highest variants in 300 series;
significant climbing required.
Typical occupations: Burglar Alarm,
Carpenter Electrician
Spine H
Shoulder H
Elbow I
Wrist J
Finger motion H
Grip H
Leg I
Psych H
Group 390
Security Officers, Coaches
Inside and outside work requiring
significant walking, some uneven
ground, and climbing –leg demands
are most significant aspect of duties;
work may be high risk but not
necessarily highly physical; demands
for arms & spine are at middle of 300
series.
Typical occupations: Bodyguard,
Instructor, Physical education,
Security Officer
Spine G
Shoulder G
Elbow G
Wrist G
Finger motion G
Grip G
Leg H
Psych H
Group 420
Meat Processing +
Heavy demands placed on arms; spine
demand similar to most in 400 series;
leg demands lowest in 400 series.
Typical occupations: Baker, Butcher,
Glass Cutter
Spine H
Shoulder G
Elbow H
Wrist I
Finger motion G
Grip H
Leg G
Psych F
Group 430
Machine-assisted Metal Shaping
Heavy demands on spine & legs in
lifting & carrying; work performed at
ground level; requires use of heavy
hand tools or force with arms.
Typical occupations: Boilermaker,
Power Brake Operator, Shear
Operator
Spine H
Shoulder H
Elbow I
Wrist H
Finger motion H
Grip H
Leg H
Psych G
Group 460
Material Handlers & Machine
Loaders & Unloaders
Strenuous demands on spine & legs
for lifting and carrying heavy objects;
lowest demand for specialized arm
activities in 400 series.
Typical occupations: Baggage
Handler, Chain Offbearer, Laborer,
Spine H
Shoulder G
Elbow G
Wrist G
Finger motion F
Grip G
Leg H
Psych E

3-36
Group 470
Installers & Repairers
Strenuous demands on all parts of
body – variants are at the higher end
of the 400 series.
Typical occupations: Household
Appliance Installer, Maintenance
Mechanic, Television Technician
Spine H
Shoulder H
Elbow I
Wrist J
Finger motion H
Grip H
Leg H
Psych H
Group 480
Construction Helpers, Oil Field
Workers & Some Skilled
Construction Workers
Heavy laboring work at construction
sites or other work sites; very
strenuous use of spine for lifting and
exerting force; heavy demands on
arms (similar to 492); leg require-
ments lower than for 481 & 492.
Typical occupations: Carpenter
Helper; Laborer, construction;
Roughneck
Spine I
Shoulder H
Elbow H
Wrist G
Finger motion G
Grip G
Leg H
Psych E
Group 481
Skilled Construction Workers
Work requires construction of
buildings or large structures; skilled
work performed at various levels,
with significant demands for
climbing, but lower demands on legs
than 482; strenuous use of arms (same
as 470).
Typical occupations: Cable
Television Installer, Millwright, Pipe
Fitter
Spine I
Shoulder H
Elbow I
Wrist J
Finger motion H
Grip H
Leg I
Psych H
Group 482
Skilled Construction Workers
Construction and maintenance work
performed at high and dangerous
levels – balance required; demands on
spine & legs similar to 590; very
strenuous use of arms.
Typical occupations: Bridge
Maintenance Worker, Grip (movie
industry), Tree Trimmer
Spine J
Shoulder I
Elbow J
Wrist J
Finger motion I
Grip J
Leg J
Psych I
Group 490
Mostly Sworn Officers – Police &
Fire (legal presumptions apply)
Workers called upon to perform
demanding activities in unpredictable
and dangerous circumstances;
i ifi d d ll f
Spine I
Shoulder I
Elbow I
Wrist H
Finger motion H
Grip I

3-37
significant demands on all parts of
body.
Typical occupations: Fire Fighter,
Paramedic.Police Officer
Leg I
Psych J
Group 491
Agricultural & Livestock Workers
Work requires tending the land and/or
caring for animals; physical demands
& variants similar to 460 but slightly
lower in mental demands.
Typical occupations: Dog Catcher;
Farmer, General; Gardener
Spine H
Shoulder G
Elbow G
Wrist G
Finger motion F
Grip G
Leg H
Psych D
Group 492
Logging & Fishing Occupations
Very physical work performed
outside; high demand on spine & legs
for balancing, working on rugged
terrain, and climbing; arm and other
variants similar to 560.
Typical occupations: Bucker, Logger,
all-round
Spine I
Shoulder H
Elbow H
Wrist H
Finger motion G
Grip H
Leg I
Psych E
Group 493
Mostly Professional Athletes
Substantial athletic performance
required but less arduous than Group
590
Typical occupations: Bowler,
professional, Ski instructor, Aerobic
instructor
Spine H
Shoulder H
Elbow H
Wrist H
Finger motion G
Grip H
Leg I
Psych H
Group 560
Mostly Material Handlers
Requires lifting of large and/or very
heavy objects or exerting very
significant force – very strenuous
demands placed on spine & legs.
Typical occupations: Ambulance
Attendant; Furniture Mover; Garbage
Collector, manual
Spine J
Shoulder H
Elbow H
Wrist H
Finger motion G
Grip H
Leg I
Psych D
Group 590
Mostly Professional Athletes
Peak athletic performance requiring
whole body strength with specialized
training and skills; highest variants
for all parts of the body.
Typical occupations: Athlete,
professional; Stunt Performer
Spine J
Shoulder J
Elbow J
Wrist J
Finger motion I
Grip J
Leg J
Psych I

4-1
SECTION 4 - OCCUPATIONAL VARIANTS
Use this section to determine the occupational variant for the particular impairment and occupation under
consideration.
Locate the row on which the impairment number appears*, and the column headed by the group number.
Record the letter appearing at the intersection of the row and column. This letter is the "Occupational
Variant" which is represented by a letter between "C" and "J" inclusive.
After establishing the occupational variant, turn to Section 5, page 5-1 to adjust the rating for occupation.
*All impairment numbers contain eight numbers in the form XX.XX.XX.XX. Ranges of impairment
numbers with the same variants are represented in two ways. As an example, numbers beginning with
03.01-, 03.02- and 03.03- are represented as 03.01--03.03. And all impairment numbers beginning with
13.11.01- are shown as 13.11.01.XX.

4-2
110 111 112 120 210 211 212 213 214 220 221 230 240 250 251 290 310 311 320 321 322 330
03.01 -- 03.06 CARDIO-HEART G F E E F F G G G G E E F G G F G H F F F F
04.01.00.00 HYPERTENSION G F E E F F G G G G E E F G G F G H F F F F
04.02.00.00 AORTIC DISEASE G F E E F F G G G G E E F G G F G H F F F F
04.03.01.00 PERIPH - UE E G H H E G F E G H G G E F F G F G H G G G
04.03.02.00 PERIPH - LE D D D D E E E F F E E E E F E E F F F F F F
04.04.00.00 PULM CIRC F E D D H E F F F E E E E F F F F G F F F F
05.01 -- 05.03 RESPIRATORY F E D D H E F F F E E E E F F F F G F F F F
06.01.00.00 UPPER DIGEST F F F F F F F F F F F F F F F F F F F F F F
06.02.00.00 COLON, RECTUM F F F F F F F H F F F F G G G F F F F F F F
06.03.00.00 FISTULAS F F F F F F F F F F F F F F F F F F F F F F
06.04.00.00 LIVER F F F F F F F F F F F F F F F F F F F F F F
06.05.00.00 HERNIA C C C C C D E F F D D E E F E D F G F F F F
07.01 -- 07.04 URINARY F F F F F F F H F F F F G G G F F F F F F F
07.05.00.00 REPRODUCTIVE F F F F F F F F F F F F F F F F F F F F F F
08.01 -- 08.02 SKIN-SCARS I I I H J I I H J J G E J H J J I J E E H E
08.03 -- 08.04 DERMATITIS F F F F F F F F F G F F F F F H F G G F H F
08.05.00.00 SKIN CANCER F F F F F F F H F F F F G G G F F F F F F F
09.01.00.00 HEMATOPOIETIC F F F F F F F F F F F F F F F F F F F F F F
10.01.00.00 DIABETES F F F F F F F F F F F F F F F F F F F F F F
11.01.01.00 EAR-HEARING J H I F J H I H J H D E H H J I J J E D H E
11.01.02.00 VESTIBULAR D D D D E D E H F F F F E G F E F F F F F F
11.02.01.00 FACE-COSMETIC I I I H J I I H J J G E J H J J I J E E H E
11.02.02.00 FACE-EYE I I J J J I I I J J H G G I I J I J I H H G
11.03.01.00 NOSE - SMELL F F F F F F F F F F F F F F F G F F F F H F
11.03.02.00 MASTICATION I H H F J H I H J I F F G G I H H I F F G F
11.03.03.00 TASTE-SMELL F F F F F F F F F F F F F F F G F F F F H F
11.03.04.00 VOICE-SPEECH J I I F J I I H J I D D H H J I I I D C G D
12.01 -- 12.03 VISION H I J J I I I I I J H G F I H I I I I H G G

4-3
331 332 340 341 350 351 360 370 380 390 420 430 460 470 480 481 482 490 491 492 493 560 590
03.01 -- 03.06 CARDIO-HEART F F G G H G G G H H H H H H H H I I H H I H J
04.01.00.00 HYPERTENSION F F G G H G G G H H H H H H H H I I H H I H J
04.02.00.00 AORTIC DISEASE F F G G H G G G H H H H H H H H I I H H I H J
04.03.01.00 PERIPH - UE F F F F G G G H H G H H G H G H J I G H I H J
04.03.02.00 PERIPH - LE F F G G G G G G I H G H H H H I J I H I I I J
04.04.00.00 PULM CIRC F F G G G G G G H H G H G H H H I I G H I H J
05.01 -- 05.03 RESPIRATORY F F G G G G G G H H G H G H H H I I G H I H J
06.01.00.00 UPPER DIGEST F F F F F F F F F F F F F F F F F F F F F F F
06.02.00.00 COLON, RECTUM F F F H G G F F H G F F F F H H H H H H H G H
06.03.00.00 FISTULAS F F F F F F F F F F F F F F F F F F F F F F F
06.04.00.00 LIVER F F F F F F F F F F F F F F F F F F F F F F F
06.05.00.00 HERNIA F F G G G F G G H G H H H H H H J H H H H I J
07.01 -- 07.04 URINARY F F F H G G F F H G F F F F H H H H H H H G H
07.05.00.00 REPRODUCTIVE F F F F F F F F F F F F F F F F F F F F F F F
08.01 -- 08.02 SKIN-SCARS E E G E G E F F F H E E F F E F E J E E I E I
08.03 -- 08.04 DERMATITIS G F G G F F F G G F H F F G F G F F F F F F F
08.05.00.00 SKIN CANCER F F F H G G F F H G F F F F H H H H H H H G H
09.01.00.00 HEMATOPOIETIC F F F F F F F F F F F F F F F F F F F F F F F
10.01.00.00 DIABETES F F F F F F F F F F F F F F F F F F F F F F F
11.01.01.00 EAR-HEARING E G F E H G G G G H D F F G F G H I F F I F I
11.01.02.00 VESTIBULAR F F F I G G F H J G F G F H G J J I F H I H J
11.02.01.00 FACE-COSMETIC E E G E G E F F F H E E F F E F E J E E I E I
11.02.02.00 FACE - EYE F G F F I H F H H H G G F H F H I J F G I F I
11.03.01.00 NOSE - SMELL F F F F H F F F G H F G F F F G I J F G F F J
11.03.02.00 MASTICATION F F F F G F F F F G F F F F F F G H F G F F G
11.03.03.00 TASTE-SMELL F F F F F F F F F G F F F F F F F G F F F F F
11.03.04.00 VOICE-SPEECH D F G F H F G F G H C D F F F G G I F G H F H
12.01 -- 12.03 VISION F G F F I H F H H G G G F H F H I I F G I F I

4-4
110 111 112 120 210 211 212 213 214 220 221 230 240 250 251 290 310 311 320 321 322 330
13.01.00.00 CONSCIOUSNESS I H H H H H H I H H G F G H H G H H H F G F
13.02.00.00 EPISODIC NEURO H G I I H G H I H I H F F J I H I I I G H H
13.03.00.00 AROUSAL I H H H H H H I H H G F G H H G H H H F G F
13.04.00.00 COGNITIVE IMP I H H H H H H I H H G F G H H G H H H F G F
13.05.00.00 LANGUAGE DISOR J I I F J I I H J I D D H H J I I I D C G D
13.06.00.00 BEHAV-EMOT J I I H I H J I I J F F G H I H I J H F G F
13.07.01.00 CRANIAL-OLFACTORY F F F F F F F F F F F F F F F G F F F F H F
13.07.02.00 CRANIAL-OPTIC H I J J I I I I I J H G F I H I I I I H G G
13.07.03.00 CRANIAL-OCULO H I J J I I I I I J H G F I H I I I I H G G
13.07.04.00 CRANIAL-TRIGEM I H H F J H I H J I F F G G I H H I F F G F
13.07.05.00 CRANIAL-FACIAL I I I H J I I H J J G E J H J J I J E E H E
13.07.06.01 CRANIAL-VERTIGO D D D D E D E H F F F F E G F E F F F F F F
13.07.06.02 CRANIAL-TINNITUS J H I F J H I H J H D E H H J I J J E D H E
13.07.07.00 CRANIAL-GLOSSO F F F F F F F F F F F F F F F F F F F F F F
13.07.08.00 CRANIAL-SPINAL ACC 
This impairment can affect swallowing and speech, head turning and shoulder motion. Use variant from 11.03.04.00, 15.01.XX.XX, or 16.02.01.00 as appropriate.
13.07.09.00 CRANIAL-HYPOGLOS J I I F 
J I I H J I D D H H J I I I D C G D
13.08.00.00 STATION GAIT D D C C E E E F F E E E E F E E F F F F F F
13.09.00.00 UPPER EXTREM E G H H E G F E G H G G E F F G F G H G G G
13.10.01.00 SPINAL-RESPIR F E D D H E F F F E E E E F F F F G F F F F
13.10.02.00 SPINAL-URINARY F F F F F F F H F F F F G G G F F F F F F F
13.10.03.00 SPINAL-ANORECT F F F F F F F H F F F F G G G F F F F F F F
13.10.04.00 SPINAL-SEXUAL F F F F F F F F F F F F F F F F F F F F F F
13.11.01.XX PAIN-UE E G H H E G F E G H G G E F F G F G H G G G
13.11.02.XX PAIN-LE D D C C E E E F F E E E E F E E F F F F F F
13.12.01.XX PERIPH-SPINE C C D D D D E F F E E E E F E E F G F F F F
13.12.02.XX PERIPH-UE E G H H E G F E G H G G E F F G F G H G G G
13.12.03.XX PERIPH-LE D D C C E E E F F E E E E F E E F F F F F F
14.01.00.00 PSYCHIACTRIC J I I H I H J I I J F F G H I H I J H F G F

4-5
331 332 340 341 350 351 360 370 380 390 420 430 460 470 480 481 482 490 491 492 493 560 590
13.01.00.00 CONSCIOUSNESS F F D H H G E H I G F H E H F I J I D G G E J
13.02.00.00 EPISODIC NEURO G G F I J J F I J G G I G I H J J J G H G H J
13.03.00.00 AROUSAL F F D H H G E H I G F H E H F I J I D G G E J
13.04.00.00 COGNITIVE IMP F F D H H G E H I G F H E H F I J I D G G E J
13.05.00.00 LANGUAGE DISOR D F G F H F G F G H C D F F F G G I F G H F H
13.06.00.00 BEHAV-EMOT F G D D H G E H H H F G E H E H I J D E H D I
13.07.01.00 CRANIAL-OLFACTORY F F F F F F F F F G F F F F F F F G F F F F F
13.07.02.00 CRANIAL-OPTIC F G F F I H F H H G G G F H F H I I F G I F I
13.07.03.00 CRANIAL-OCULO F G F F I H F H H G G G F H F H I I F G I F I
13.07.04.00 CRANIAL-TRIGEM F F F F G F F F F G F F F F F F G H F G G F G
13.07.05.00 CRANIAL-FACIAL E E G E G E F F F H E E F F E F E J E E H E I
13.07.06.01 CRANIAL-VERTIGO F F F I G G F H J G F G F H G J J I F H I H J
13.07.06.02 CRANIAL-TINNITUS E G F E H G G G G H D F F G F G H I F F I F I
13.07.07.00 CRANIAL-GLOSSO F F F F F F F F F F F F F F F F F F F F F F F
13.07.08.00 CRANIAL-SPINAL ACC 
This impairment can affect swallowing and speech, head turning and shoulder motion. Use variant from 11.03.04.00, 15.01.XX.XX, or 16.02.01.00 as appropriate.
13.07.09.00 CRANIAL-HYPOGLOS D F G F H F G F G H 
C D F F F G G I F G H F H
13.08.00.00 STATION GAIT F F G G G G G G I H G H H H H I J I H I I I J
13.09.00.00 UPPER EXTREM F F F F G G G H H G H H G H G H J I G H H H J
13.10.01.00 SPINAL-RESPIR F F G G G G G G H H G H G H H H I I G H I H J
13.10.02.00 SPINAL-URINARY F F F H G G F F H G F F F F H H H H H H H G H
13.10.03.00 SPINAL-ANORECT F F F H G G F F H G F F F F H H H H H H H G H
13.10.04.00 SPINAL-SEXUAL F F F F F F F F F F F F F F F F F F F F F F F
13.11.01.XX PAIN-UE F F F F G G G H H G H H G H G H J I G H H H J
13.11.02.XX PAIN-LE F F G G G G G G I H G H H H H I J I H I I I J
13.12.01.XX PERIPH-SPINE F F G G G G G G H G H H H H I I J I H I H J J
13.12.02.XX PERIPH-UE F F F F G G G H H G H H G H G H J I G H H H J
13.12.03.XX PERIPH-LE F F G G G G G G I H G H H H H I J I H I I I J
14.01.00.00 PSYCHIACTRIC F G D D H G E H H H F G E H E H I J D E H D I

4-6
110 111 112 120 210 211 212 213 214 220 221 230 240 250 251 290 310 311 320 321 322 330
15.01 -- 15.03 SPINE-DRE-ROM C C D D D D E F F E E E E F E E F G F F F F
15.04.01.00 CORTIC-ONE UE E G H H E G F E G H G G E F F G F G H G G G
15.04.02.00 CORTIC-TWO UE E G H H E G F E G H G G E F F G F G H G G G
15.04.03.00 CORTIC-GAIT D D C C E E E F F E E E E F E E F F F F F F
15.04.04.00 CORTIC-BLADDER F F F F F F F H F F F F G G G F F F F F F F
15.04.05.00 CORTIC-ANOREC F F F F F F F H F F F F G G G F F F F F F F
15.04.06.00 CORTIC-SEXUAL F F F F F F F F F F F F F F F F F F F F F F
15.04.07.00 CORTIC-RESPIR F E D D H E F F F E E E E F F F F G F F F F
15.05.XX.XX PELVIC C C D D D D E F F E E E E F E E F G F F F F
16.01.01.XX ARM-AMPUT E G H H E G F E G H G G E F F G F G H G G G
16.01.02.01 BRACHIAL PLEX E G H H E G F E G H G G E F F G F G H G G G
16.01.02.02 CARPAL TUNNEL D G H H D G F E G H G F E F E H F G I H G F
16.01.02.03 ENTRAP-OTHER E G H H E G F E G H G G E F F G F G H G G G
16.01.02.04 CRPS I E G H H E G F E G H G G E F F G F G H G G G
16.01.02.05 CRPS II E G H H E G F E G H G G E F F G F G H G G G
16.01.03.00 PERIPH VASC E G H H E G F E G H G G E F F G F G H G G G
16.01.04.00 ARM-GRIP/PINCH D E E F C E E E F F F G D F F F F F H G G G
16.01.05.00 ARM-OTHER E G H H E G F E G H G G E F F G F G H G G G
16.02.01.00 SHOULER-ROM C D D E C D E E F F F F D F D G F F F F F F
16.02.02.00 SHOULDER-OTHER E G H H E G F E G H G G E F F G F G H G G G
16.03.01.00 ELBOW-ROM D F G G D F E E F G G F E G F G F G H G G G
16.03.02.00 ELBOW-OTHER E G H H E G F E G H G G E F F G F G H G G G
16.04.01.00 WRIST-ROM D G H H D G F E G H G F E F E H F G I H G F
16.04.02.00 WRIST-OTHER E G H H E G F E G H G G E F F G F G H G G G
16.05.XX.XX HAND F G I H E G F F G H G G E F F G F G H G G G
16.06.01.XX THUMB F G G H E G F F G H H G E F F H F G H G G G
16.06.02.XX INDEX F H I I E H G F H I H G E F F H G H I H H G
16.06.03.XX MIDDLE F H I I E H G F H I H G E F F H G H I H H G
16.06.04.XX RING F G I G E G F F G G G F E F F F F G H G G F
16.06.05.XX LITTLE F G I G E G F F G G G F E F F F F G H G G F

4-7
331 332 340 341 350 351 360 370 380 390 420 430 460 470 480 481 482 490 491 492 493 560 590
15.01 -- 15.03 SPINE-DRE-ROM F F G G G G G G H G H H H H I I J I H I H J J
15.04.01.00 CORTIC-ONE UE F F F F G G G H H G H H G H G H J I G H H H J
15.04.02.00 CORTIC-TWO UE F F F F G G G H H G H H G H G H J I G H H H J
15.04.03.00 CORTIC-GAIT F F G G G G G G I H G H H H H I J I H I I I J
15.04.04.00 CORTIC-BLADDER F F F H G G F F H G F F F F H H H H H H H G H
15.04.05.00 CORTIC-ANOREC F F F H G G F F H G F F F F H H H H H H H G H
15.04.06.00 CORTIC-SEXUAL F F F F F F F F F F F F F F F F F F F F F F F
15.04.07.00 CORTIC-RESPIR F F G G G G G G H H G H G H H H I I G H I H J
15.05.XX.XX PELVIC F F G G G G G G H G H H H H I I J I H I H J J
16.01.01.XX ARM-AMPUT F F F F G G G H H G H H G H G H J I G H H H J
16.01.02.01 BRACHIAL PLEX F F F F G G G H H G H H G H G H J I G H H H J
16.01.02.02 CARPAL TUNNEL F E F F F G F J J G I H G J G J J H G H H H J
16.01.02.03 ENTRAP-OTHER F F F F G G G H H G H H G H G H J I G H H H J
16.01.02.04 CRPS I F F F F G G G H H G H H G H G H J I G H H H J
16.01.02.05 CRPS II F F F F G G G H H G H H G H G H J I G H H H J
16.01.03.00 PERIPH VASC F F F F G G G H H G H H G H G H J I G H H H J
16.01.04.00 ARM-GRIP/PINCH F F F F G G G H H G H H G H G H J I G H H H J
16.01.05.00 ARM-OTHER F F F F G G G H H G H H G H G H J I G H H H J
16.02.01.00 SHOULER-ROM F F F G F G G G H G G H G H H H I I G H H H J
16.02.02.00 SHOULDER-OTHER F F F F G G G H H G H H G H G H J I G H H H J
16.03.01.00 ELBOW-ROM F F G G H H G I I G H I G I H I J I G H H H J
16.03.02.00 ELBOW-OTHER F F F F G G G H H G H H G H G H J I G H H H J
16.04.01.00 WRIST-ROM F E F F F G F J J G I H G J G J J H G H H H J
16.04.02.00 WRIST-OTHER F F F F G G G H H G H H G H G H J I G H H H J
16.05.XX.XX HAND F F F F G G F H H G G H F H G H I H F G G G I
16.06.01.XX THUMB F F F F G G F H H G H H G H G H I H G H G H I
16.06.02.XX INDEX F F F F G G F I I G G H F I G I I H F G G G I
16.06.03.XX MIDDLE F F F F G G F I I G G H F I G I I H F G G G I
16.06.04.XX RING F F F F F F F H H G G H F H G H H H F G G G I
16.06.05.XX LITTLE F F F F F F F H H G G H F H G H H H F G G G I

4-8
110 111 112 120 210 211 212 213 214 220 221 230 240 250 251 290 310 311 320 321 322 330
17.01.01.00 LEG-LENGTH C C C C D D D E D D D D D D D D D E E E E E
17.01.02.XX LEG-AMPUT D D C C E E E F F E E E E F E E F F F F F F
17.01.03.00 LEG-SKIN LOSS D D D D E E E F F E E E E F E E F F F F F F
17.01.04.00 LEG-PERIPH NRV D D C C E E E F F E E E E F E E F F F F F F
17.01.05.00 LEG-VASCULAR D D D D E E E F F E E E E F E E F F F F F F
17.01.06.00 LEG-CAUSALGIA D D C C E E E F F E E E E F E E F F F F F F
17.01.07.00 LEG-GAIT D D C C E E E F F E E E E F E E F F F F F F
17.01.08.00 LEG-OTHER D D C C E E E F F E E E E F E E F F F F F F
17.02.10.00 PELVIS-FX. D D C C E E E F F E E E E F E E F F F F F F
17.03.XX.XX HIP D D C C E E E F F E E E E F E E F F F F F F
17.04.10.00 FEMUR-FX D D C C E E E F F E E E E F E E F F F F F F
17.05.XX.XX KNEE D D C C E E E F F E E E E F E E F F F F F F
17.06.10.00 TIBIA-FX D D C C E E E F F E E E E F E E F F F F F F
17.07.XX.XX ANKLE D D C C E E E F F E E E E F E E F F F F F F
17.08.01.00 FOOT-ATROPHY D D C C E E E F F E E E E F E E F F F F F F
17.08.02.00 FOOT-ANKYLOSIS C C C C D D D E D D D D D D D D D E E E E E
17.08.03.00 FOOT-ARTHRITIS D D C C E E E F F E E E E F E E F F F F F F
17.08.04.00 FOOT-ROM C C C C D D D E D D D D D D D D D E E E E E
17.08.05.00 FOOT-STRENGTH D D C C E E E F F E E E E F E E F F F F F F
17.08.06.00 FOOT-OTHER D D C C E E E F F E E E E F E E F F F F F F
17.08.10.XX FOOT-DBE D D C C E E E F F E E E E F E E F F F F F F
17.09.01.00 TOE-ATROPHY C C C C D D D E D D D D D D D D D E E E E E
17.09.02.00 TOE-ANKYLOSIS C C C C D D D E D D D D D D D D D E E E E E
17.09.03.00 TOE-ARTHRITIS C C C C D D D E D D D D D D D D D E E E E E
17.09.04.00 TOE-ROM C C C C D D D E D D D D D D D D D E E E E E
17.09.05.00 TOE-STRENGTH D D C C E E E F F E E E E F E E F F F F F F
17.09.06.00 TOE-AMPUTATION D D C C E E E F F E E E E F E E F F F F F F
17.09.07.00 TOE-OTHER D D C C E E E F F E E E E F E E F F F F F F

4-9
331 332 340 341 350 351 360 370 380 390 420 430 460 470 480 481 482 490 491 492 493 560 590
17.01.01.00 LEG-LENGTH E F E G E E E F G F F F F F G G H G F G I G H
17.01.02.00 LEG-AMPUT F F G G G G G G I H G H H H H I J I H I I I J
17.01.03.00 LEG-SKIN LOSS F F G G G G G G I H G H H H H I J I H I I I J
17.01.04.00 LEG-PERIPH NRV F F G G G G G G I H G H H H H I J I H I I I J
17.01.05.00 LEG-VASCULAR F F G G G G G G I H G H H H H I J I H I I I J
17.01.06.00 LEG-CAUSALGIA F F G G G G G G I H G H H H H I J I H I I I J
17.01.07.00 LEG-GAIT F F G G G G G G I H G H H H H I J I H I I I J
17.01.08.00 LEG-OTHER F F G G G G G G I H G H H H H I J I H I I I J
17.02.10.00 PELVIS-FX. F F G G G G G G I H G H H H H I J I H I I I J
17.03.XX.XX HIP F F G G G G G G I H G H H H H I J I H I I I J
17.04.10.00 FEMUR-FX F F G G G G G G I H G H H H H I J I H I I I J
17.05.XX.XX KNEE F F G G G G G G I H G H H H H I J I H I I I J
17.06.10.00 TIBIA-FX F F G G G G G G I H G H H H H I J I H I I I J
17.07.XX.XX ANKLE F F G G G G G G I H G H H H H I J I H I I I J
17.08.01.00 FOOT-ATROPHY F F G G G G G G I H G H H H H I J I H I I I J
17.08.02.00 FOOT-ANKYLOSIS E F E G E E E F G F F F F F G G H G F G I G H
17.08.03.00 FOOT-ARTHRITIS F F G G G G G G I H G H H H H I J I H I I I J
17.08.04.00 FOOT-ROM E F E G E E E F G F F F F F G G H G F G I G H
17.08.05.00 FOOT-STRENGTH F F G G G G G G I H G H H H H I J I H I I I J
17.08.06.00 FOOT-OTHER F F G G G G G G I H G H H H H I J I H I I I J
17.08.10.XX FOOT-DBE F F G G G G G G I H G H H H H I J I H I I I J
17.09.01.00 TOE-ATROPHY E F E G E E E F G F F F F F G G H G F G H G H
17.09.02.00 TOE-ANKYLOSIS E F E G E E E F G F F F F F G G H G F G H G H
17.09.03.00 TOE-ARTHRITIS E F E G E E E F G F F F F F G G H G F G H G H
17.09.04.00 TOE-ROM E F E G E E E F G F F F F F G G H G F G H G H
17.09.05.00 TOE-STRENGTH F F G G G G G G I H G H H H H I J I H I H I J
17.09.06.00 TOE-AMPUTATION F F G G G G G G I H G H H H H I J I H I H I J
17.09.07.00 TOE-OTHER F F G G G G G G I H G H H H H I J I H I H I J

5-1
SECTION 5 - OCCUPATIONAL ADJUSTMENT
Use this table to adjust the rating for occupation.
Locate the row on which the rating (after adjustment for diminished future earning capacity)
appears and the column headed by the occupation variant (obtained from the Occupational
Variant Table in Section 4). Record the number appearing at the intersection of this row and
column. This is the rating after adjustment for occupation.
After adjusting the rating for occupation, turn to Section 6, page 6-1 to adjust for age.

5-2
OCCUPATIONAL ADJUSTMENT TABLE
Standard Standard
Rating Rating
Percent C D E F G H I J Percent C D E F G H I J
0 
0 0 0 
0 0 0 0 0
1 
1 1 1 
1 2 2 2 2 
26 
19 22 24 26 29 31 34 37
2 
1 2 2 
2 3 3 4 4 
27 
20 23 25 27 30 33 35 38
3 
2 2 3 
3 4 5 5 6 
28 
21 24 26 28 31 34 36 39
4 
3 3 4 
4 5 6 7 8 
29 
22 24 27 29 32 35 37 40
5 
3 4 4 
5 6 7 8 9 
30 
23 25 28 30 33 36 38 41
6 
4 5 5 
6 7 8 9 11 
31 
24 26 29 31 34 37 40 43
7 
5 5 6 
7 8 10 11 12 
32 
25 27 30 32 35 38 41 44
8 
6 6 7 
8 9 11 12 14 
33 
25 28 30 33 36 39 42 45
9 
6 7 8 
9 11 12 14 15 
34 
26 29 31 34 37 40 43 46
10 
7 8 9 
10 12 13 15 16 
35 
27 30 32 35 38 41 44 47
11 
7 9 10 
11 13 14 16 18 
36 
28 31 33 36 39 42 45 48
12 
8 10 11 
12 14 16 17 19 
37 
29 32 34 37 40 43 46 49
13 
9 10 12 
13 15 17 18 20 
38 
30 32 35 38 41 44 47 50
14 
10 11 13 
14 16 18 20 22 
39 
31 33 36 39 42 45 48 51
15 
11 12 14 
15 17 19 21 23 
40 
32 34 37 40 43 46 49 52
16 
11 13 14 
16 18 20 22 24 
41 
33 35 38 41 44 47 50 54
17 
12 14 15 
17 19 21 23 26 
42 
34 36 39 42 45 48 51 55
18 
13 15 16 
18 20 22 24 27 
43 
35 37 40 43 46 49 52 56
19 
14 15 17 
19 21 24 26 28 
44 
36 38 41 44 47 50 53 57
20 
15 16 18 
20 22 25 27 29 
45 
36 39 42 45 48 51 54 58
21 
16 17 19 
21 23 26 28 31 
46 
37 40 43 46 49 52 55 59
22 
16 18 20 
22 24 27 29 32 
47 
38 41 44 47 50 53 56 60
23 
17 19 21 
23 26 28 31 33 
48 
39 42 45 48 51 54 57 61
24 
18 20 22 
24 27 29 32 34 
49 
40 43 46 49 52 55 58 62
25 
18 21 23 
25 28 30 33 36 
50 
41 44 47 50 53 56 59 62

5-3
OCCUPATIONAL ADJUSTMENT TABLE
Standard Standard
Rating Rating
Percent C D E F G H I J Percent C D E F G H I J
51 
42 45 48 
51 54 57 60 64 
76 
68 70 73 76 78 80 82 84
52 
43 46 49 
52 55 58 61 65 
77 
69 71 74 77 79 81 83 85
53 
44 47 50 
53 56 59 62 65 
78 
70 72 75 78 80 82 84 86
54 
45 48 51 
54 57 60 63 66 
79 
71 74 76 79 81 83 84 86
55 
46 49 52 
55 58 61 64 67 
80 
72 75 77 80 82 83 85 87
56 
47 50 53 
56 59 62 65 68 
81 
73 76 78 81 83 84 86 88
57 
48 51 54 
57 60 63 66 69 
82 
74 77 79 82 84 85 87 88
58 
49 52 55 
58 61 64 67 70 
83 
76 78 81 83 84 86 87 89
59 
50 53 56 
59 62 65 68 71 
84 
77 79 82 84 85 87 88 90
60 
51 54 57 
60 63 66 69 72 
85 
78 81 83 85 86 88 89 90
61 
52 55 58 
61 64 67 69 72 
86 
79 82 84 86 87 89 90 91
62 
53 56 59 
62 65 68 70 73 
87 
81 83 85 87 88 89 90 92
63 
54 57 60 
63 66 69 71 74 
88 
82 84 86 88 89 90 91 92
64 
55 58 61 
64 67 69 72 75 
89 
84 85 87 89 90 91 92 93
65 
56 59 62 
65 68 70 73 76 
90 
85 87 88 90 91 92 93 94
66 
57 60 63 
66 69 71 74 77 
91 
86 88 89 91 92 93 93 94
67 
58 61 64 
67 70 72 75 77 
92 
88 89 91 92 93 93 94 95
68 
59 62 65 
68 71 73 76 78 
93 
89 91 92 93 94 94 95 96
69 
60 63 66 
69 71 74 76 79 
94 
91 92 93 94 95 95 96 96
70 
61 64 67 
70 72 75 77 80 
95 
93 93 94 95 96 96 97 97
71 
62 65 68 
71 73 76 78 80 
96 
94 94 95 96 96 97 98 98
72 
63 66 69 
72 74 77 79 81 
97 
95 96 96 97 97 98 98 98
73 
65 67 70 
73 75 77 79 82 
98 
97 97 98 98 98 98 98 99
74 
66 68 71 
74 76 78 80 83 
99 
98 99 99 99 99 99 100 100
75 
67 69 72 
75 77 79 81 83 
100 
100 100 100 100 100 100 100 100

6-1
SECTION 6 - AGE ADJUSTMENT
Use this table to modify the rating for age.
Locate the row on which the rating (already adjusted for earning capacity and occupation) appears,
and the column headed by the age at time of injury. Record the number appearing at the intersection
of the row and column. This is the rating adjusted for earning capacity, occupation and age.

6-2
AGE AT TIME OF INJURY
21 and 22 - 26 27 - 31 32 - 36 37 - 41 42 - 46 47 - 51 52 - 56 57 - 61 62 and
Rating 
under over
1 
1 1 1 1 
1 1 1 1 1 1
2 
2 2 2 2 2 2 2 3 3 3
3 
2 2 3 3 
3 3 3 4 4 4
4 
3 3 3 4 
4 4 5 5 5 6
5 
4 4 4 5 
5 5 6 6 6 7
6 
5 5 5 6 
6 6 7 7 8 8
7 
5 6 6 7 
7 8 8 9 9 10
8 
6 6 7 7 
8 9 9 10 10 11
9 
7 7 8 8 
9 10 10 11 12 12
10 
8 8 9 9 
10 11 11 12 13 13
11 
8 9 10 10 
11 12 13 13 14 15
12 
9 10 10 11 
12 13 14 15 15 16
13 
10 11 11 12 
13 14 15 16 16 17
14 
11 11 12 13 
14 15 16 17 18 19
15 
12 12 13 14 
15 16 17 18 19 20
16 
12 13 14 15 
16 17 18 19 20 21
17 
13 14 15 16 
17 18 19 20 21 22
18 
14 15 16 17 
18 19 20 21 23 24
19 
15 16 17 18 
19 20 22 23 24 25
20 
16 17 18 19 
20 21 23 24 25 26
21 
17 18 19 20 
21 22 24 25 26 27
22 
17 18 20 21 
22 23 25 26 28 29
23 
18 19 20 22 
23 24 26 27 29 30
24 
19 20 21 23 
24 25 27 28 30 31
25 
20 21 22 24 
25 27 28 29 31 32

6-3
AGE AT TIME OF INJURY
21 and 22 - 26 27 - 31 32 - 36 37 - 41 42 - 46 47 - 51 52 - 56 57 - 61 62 and
Rating 
under over
26 
21 22 23 25 
26 28 29 31 32 33
27 
22 23 24 26 27 29 30 32 33 35
28 
23 24 25 27 
28 30 31 33 34 36
29 
24 25 26 28 
29 31 32 34 36 37
30 
24 25 27 28 
30 32 33 35 37 38
31 
25 26 28 30 
31 33 35 36 38 39
32 
26 27 29 31 
32 34 36 37 39 40
33 
27 28 30 32 
33 35 37 38 40 42
34 
28 29 31 33 
34 36 38 39 41 43
35 
29 30 32 34 
35 37 39 41 42 44
36 
30 31 33 35 
36 38 40 42 43 45
37 
31 32 34 36 
37 39 41 43 44 46
38 
32 33 35 37 
38 40 42 44 46 47
39 
33 34 36 38 
39 41 43 45 47 48
40 
34 35 37 39 
40 42 44 46 48 50
41 
35 36 38 40 
41 43 45 47 49 51
42 
36 37 39 41 
42 44 46 48 50 52
43 
36 37 39 41 
43 45 47 49 51 53
44 
37 38 40 42 
44 46 48 50 52 54
45 
38 39 41 43 
45 47 49 51 53 55
46 
39 40 42 44 
46 48 50 52 54 56
47 
40 41 43 45 
47 49 51 53 55 57
48 
41 42 44 46 
48 50 52 54 56 58
49 
42 43 45 47 
49 51 53 55 57 59
50 
43 44 46 48 
50 52 54 56 58 60

6-4
AGE AT TIME OF INJURY
21 and 22 - 26 27 - 31 32 - 36 37 - 41 42 - 46 47 - 51 52 - 56 57 - 61 62 and
Rating 
under over
51 
44 45 47 49 
51 53 55 57 59 61
52 
45 46 48 50 52 54 56 58 60 62
53 
46 47 49 51 
53 55 57 59 61 63
54 
47 48 50 52 
54 56 58 60 62 64
55 
48 49 51 53 
55 57 59 61 63 65
56 
49 50 52 54 
56 58 60 62 64 66
57 
50 51 53 55 
57 59 61 63 65 67
58 
51 53 55 57 
58 60 62 64 66 68
59 
52 54 56 58 
59 61 63 65 67 69
60 
53 55 57 59 
60 62 64 66 68 70
61 
54 56 58 60 
61 63 65 67 69 71
62 
55 57 59 61 
62 64 66 68 69 71
63 
57 58 60 62 
63 65 67 69 70 72
64 
58 59 61 63 
64 66 68 70 71 73
65 
59 60 62 64 
65 67 69 71 72 74
66 
60 61 63 65 
66 68 70 72 73 75
67 
61 62 64 66 
67 69 70 72 74 76
68 
62 63 65 67 
68 70 71 73 75 77
69 
63 64 66 68 
69 71 72 74 76 78
70 
64 65 67 69 
70 72 73 75 76 78
71 
65 66 68 70 
71 73 74 76 77 79
72 
66 67 69 71 
72 74 75 77 78 80
73 
68 69 70 72 
73 75 76 78 79 81
74 
69 70 71 73 
74 76 77 79 80 82
75 
70 71 72 74 
75 77 78 80 81 83

6-5
AGE AT TIME OF INJURY
21 and 22 - 26 27 - 31 32 - 36 37 - 41 42 - 46 47 - 51 52 - 56 57 - 61 62 and
Rating 
under over
76 
71 72 73 75 
76 78 79 80 82 83
77 
72 73 74 76 77 79 80 81 82 84
78 
73 74 75 77 
78 80 81 82 83 85
79 
74 75 76 78 
79 81 82 83 84 86
80 
76 77 78 79 
80 81 82 84 85 86
81 
77 78 79 80 
81 82 83 85 86 87
82 
78 79 80 81 
82 83 84 86 87 88
83 
79 80 81 82 
83 84 85 86 87 89
84 
80 81 82 83 
84 85 86 87 88 89
85 
81 82 83 84 
85 86 87 88 89 90
86 
83 83 84 85 
86 87 88 89 90 91
87 
84 85 85 86 
87 88 89 90 91 92
88 
85 86 86 87 
88 89 90 91 91 92
89 
86 87 87 88 
89 90 91 91 92 93
90 
88 88 89 89 
90 91 91 92 93 93
91 
89 89 90 90 
91 92 92 93 94 94
92 
90 90 91 92 
92 93 93 94 94 95
93 
91 92 92 93 
93 94 94 95 95 96
94 
92 93 93 94 
94 95 95 95 96 96
95 
94 94 94 95 
95 96 96 96 97 97
96 
95 95 95 96 
96 96 97 97 97 98
97 
96 96 97 97 
97 97 97 98 98 98
98 
97 98 98 98 
98 98 98 98 99 99
99 
99 99 99 99 
99 99 99 99 99 99
100 
100 100 100 100 
100 100 100 100 100 100

7-1
SECTION 7 – EXAMPLES
The examples in this section illustrate all the basic components of disability
rating including converting AMA scales, adjusting for diminished future
earning capacity, occupation and age.

7-2
Example A – Multiple impairments within a single extremity
A 30-year-old stevedore injures his right arm resulting in the
following impairment percentages
ratings:
Limited motion of index finger = 50% Digit impairment
Limited motion of ring finger = 80% Digit impairment
Limited motion of shoulder = 20% Upper extremity (UE)
Shoulder instability = 12% UE
1. Follow AMA protocols
1 
for combining individual finger
impairments into one overall hand impairment. The hand
impairment for this example is 18%.
2. Convert hand impairment
2 
to whole person scale.
18% Hand impairment μ .9 = 16% UE
16 % UE μ .6 = 10% Whole person impairment
(WPI)
3. Combine
3 
shoulder impairments.
20% UE C 12% UE = 30% UE
4. Convert overall shoulder impairment to whole person scale
1 
See Chapter 16 of the AMA Guides, 5
th 
edition for protocols.
2 
See AMA Guides, 5
th 
edition, pages 438-439, for upper extremity
conversion factors.
3 
The symbol used to represent the operation of combining is “C”. Use the
Combined Values Chart on page 8-2 of the Schedule to combine ratings.
30% UE μ .6 = 18% WPI
5. Apply earning capacity, occupation and age adjustments
4 
to
hand and shoulder ratings:
Hand: 16.05.01.00 – 10 – [1]11 – 351G – 13 – 11 PD
Shoulder: 16.02.02.00 – 18 – [7]24 – 351G – 27 – 24 PD
6. Combine adjusted ratings for hand and shoulder to obtain
final disability.
24% PD C 11% PD = 32% PD
The final overall PD rating for this example is 32%.
Example B – Applying the single extremity maximum
A 30-year-old stevedore sustains an injury to his left leg resulting in
the following impairment percentages
ratings:
Amputation of left leg below knee = 80% LE
Limited motion of left knee = 35% LE
Pain in stump is substantially aggravated by performing
ADL’s = 3% add-on
5
4 
Rating adjustments and formulas are explained in Section 1 of this
Schedule. 
starting on page XX.
5 
See Section 1 of PDRS, page XX, for information regarding add-on’s for
pain.

7-3
1. Convert individual impairments
6 
to the whole person scale.
Left leg amputation: 80% LE μ .4 = 32% WPI
Left knee motion: 35% LE μ .4 = 14% WPI
2. Apply 3% add-on for pain.
32% WPI + 3% WPI = 35% WPI
3. Apply earning capacity, occupation and age adjustments
7 
to
each whole person impairment.
L leg amp.: 17.01.02.02 – 35 – [5]45 – 351G – 48 – 44 PD
L knee motion: 17.05.04.00 – 14 – [2]16 – 351G–18 – 16 PD
4. Combine
8 
the adjusted impairments for the left leg.
44% PD C 16% PD = 53% PD
5. Calculate the maximum value for a single leg adjusted for
earning capacity, age and occupation. The maximum rating
for a leg before adjustments is 40%.
17.01.02.01 – 40 – [5]51 – 351G – 54 – 50 PD
6 
See AMA Guides, 5
th 
edition, page 527, for lower extremity conversion
factors.
7 
Rating adjustments and formulas are explained in Section 1 of this
Schedule. 
starting on page XX.
8 
The symbol used to represent the operation of combining is “C”. Use the
Combined Values Chart on page 8-2 of the Schedule to combine ratings.
6. Compare the results of step 4 and 5 above. Choose the lower
as the final value. The correct disability rating for the left
leg is 50% PD.
Example C – Multiple impairments to different regions of body
A 30-year-old stevedore sustains injuries to his right arm, low back
and legs resulting in the following disability 
impairment ratings.
Herniated lumbar disk (DRE Category 3) = 10% WPI
Limited motion of right index finger = 50% Digit
impairment
Limited motion of right ring finger = 80% Digit impairment
Limited motion of right shoulder = 20% Upper extremity
(UE)
Right shoulder instability = 12% UE
Amputation of left foot 
leg two inches below knee = 80% LE
Limited motion of left knee = 35% LE
Pain in stump is substantially aggravated by performing
ADL’s = 3% add-on
9
Limited motion of right knee = 8% LE
1. Calculate disability rating for the back by adjusting the back
impairment rating for earning capacity, occupation and age.
15.03.01.00 – 10 – [5]13 – 351G – 15 – 13 PD
9 
See Section 1 of PDRS, page XX, for information regarding add-on’s for
pain.

7-4
2. Calculate disability rating for right arm in accordance with
Example A above. The overall disability rating for the arm
is 39% PD after adjustment for earning capacity, occupation
and age.
3. Calculate the disability rating for the left leg in accordance
with Example B above. The overall disability rating for the
left leg is 61% PD after adjustment for earning capacity,
occupation and age.
4. Calculate disability rating for the right leg as follows:
a. Convert the lower extremity impairment rating for
the right knee to whole person impairment.
8% LE μ .4 = 3% WPI
b. Adjust the right knee impairment rating for earning
capacity, occupation and age.
17.05.04.00 – 3 – [2]4 – 351G – 5 – 4 PD
5. Combine the ratings for the right arm, back, and each leg in
the order from the largest to the smallest. The final overall
PD rating for this example is 71%.
50% PD (left leg) C 32% PD (right arm) = 66% PD
66% PD C 13% PD (back) = 70% PD
70% PD C 4% PD (right leg) = 71% PD

8-1
SECTION 8 - COMBINED VALUES CHART
Use this chart to combine two or more impairments, or two or more disabilities. When combining
groups of three or more values, always combine the larger two first, and then successively combine the
result with the next smaller until all values are combined.

8-2
COMBINED VALUES CHART
1 2
2 3 4
3 4 5 6
4 5 6 7 8
5 6 7 8 9 10
6 7 8 9 10 11 12
7 8 9 10 11 12 13 14
8 9 10 11 12 13 14 14 15
9 10 11 12 13 14 14 15 16 17
DIRECTIONS: To combine any two values, locate
the larger value on the left side of the chart, and the
smaller value at the bottom of the chart. The
intersection of that row and column contains the
combined value.
10 11 12 13 14 15 15 16 17 18 19
11 12 13 14 15 15 16 17 18 19 20 21
12 13 14 15 16 16 17 18 19 20 21 22 23
13 14 15 16 16 17 18 19 20 21 22 23 23 24
14 15 16 17 17 18 19 20 21 22 23 23 24 25 26
15 16 17 18 18 19 20 21 22 23 24 24 25 26 27 28
16 17 18 19 19 20 21 22 23 24 24 25 26 27 28 29 29
17 18 19 19 20 21 22 23 24 24 25 26 27 28 29 29 30 31
18 19 20 20 21 22 23 24 25 25 26 27 28 29 29 30 31 32 33
19 20 21 21 22 23 24 25 25 26 27 28 29 30 30 31 32 33 34 34
20 21 22 22 23 24 25 26 26 27 28 29 30 30 31 32 33 34 34 35 36
21 22 23 23 24 25 26 27 27 28 29 30 30 31 32 33 34 34 35 36 37 38
22 23 24 24 25 26 27 27 28 29 30 31 31 32 33 34 34 35 36 37 38 38 39
23 24 25 25 26 27 28 28 29 30 31 31 32 33 34 35 35 36 37 38 38 39 40 41
24 25 26 26 27 28 29 29 30 31 32 32 33 34 35 35 36 37 38 38 39 40 41 41 42
25 26 27 27 28 29 30 30 31 32 33 33 34 35 36 36 37 38 39 39 40 41 42 42 43 44
26 27 27 28 29 30 30 31 32 33 33 34 35 36 36 37 38 39 39 40 41 42 42 43 44 45 45
27 28 28 29 30 31 31 32 33 34 34 35 36 36 37 38 39 39 40 41 42 42 43 44 45 45 46 47
28 29 29 30 31 32 32 33 34 34 35 36 37 37 38 39 40 40 41 42 42 43 44 45 45 46 47 47 48
29 30 30 31 32 33 33 34 35 35 36 37 38 38 39 40 40 41 42 42 43 44 45 45 46 47 47 48 49 50
30 31 31 32 33 34 34 35 36 36 37 38 38 39 40 41 41 42 43 43 44 45 45 46 47 48 48 49 50 50 51
31 32 32 33 34 34 35 36 37 37 38 39 39 40 41 41 42 43 43 44 45 45 46 47 48 48 49 50 50 51 52 52
32 33 33 34 35 35 36 37 37 38 39 39 40 41 42 42 43 44 44 45 46 46 47 48 48 49 50 50 51 52 52 53 54
33 34 34 35 36 36 37 38 38 39 40 40 41 42 42 43 44 44 45 46 46 47 48 48 49 50 50 51 52 52 53 54 54 55
34 35 35 36 37 37 38 39 39 40 41 41 42 43 43 44 45 45 46 47 47 48 49 49 50 51 51 52 52 53 54 54 55 56 56
35 36 36 37 38 38 39 40 40 41 42 42 43 43 44 45 45 46 47 47 48 49 49 50 51 51 52 53 53 54 55 55 56 56 57 58
36 37 37 38 39 39 40 40 41 42 42 43 44 44 45 46 46 47 48 48 49 49 50 51 51 52 53 53 54 55 55 56 56 57 58 58 59
37 38 38 39 40 40 41 41 42 43 43 44 45 45 46 46 47 48 48 49 50 50 51 51 52 53 53 54 55 55 56 57 57 58 58 59 60 60
38 39 39 40 40 41 42 42 43 44 44 45 45 46 47 47 48 49 49 50 50 51 52 52 53 54 54 55 55 56 57 57 58 58 59 60 60 61 62
39 40 40 41 41 42 43 43 44 44 45 46 46 47 48 48 49 49 50 51 51 52 52 53 54 54 55 55 56 57 57 58 59 59 60 60 61 62 62 63
40 41 41 42 42 43 44 44 45 45 46 47 47 48 48 49 50 50 51 51 52 53 53 54 54 55 56 56 57 57 58 59 59 60 60 61 62 62 63 63 64
41 42 42 43 43 44 45 45 46 46 47 47 48 49 49 50 50 51 52 52 53 53 54 55 55 56 56 57 58 58 59 59 60 60 61 62 62 63 63 64 65 65
42 43 43 44 44 45 45 46 47 47 48 48 49 50 50 51 51 52 52 53 54 54 55 55 56 57 57 58 58 59 59 60 61 61 62 62 63 63 64 65 65 66 66
43 44 44 45 45 46 46 47 48 48 49 49 50 50 51 52 52 53 53 54 54 55 56 56 57 57 58 58 59 60 60 61 61 62 62 63 64 64 65 65 66 66 67 68
44 45 45 46 46 47 47 48 48 49 50 50 51 51 52 52 53 54 54 55 55 56 56 57 57 58 59 59 60 60 61 61 62 62 63 64 64 65 65 66 66 67 68 68 69
45 46 46 47 47 48 48 49 49 50 51 51 52 52 53 53 54 54 55 55 56 57 57 58 58 59 59 60 60 61 62 62 63 63 64 64 65 65 66 66 67 68 68 69 69 70
46 47 47 48 48 49 49 50 50 51 51 52 52 53 54 54 55 55 56 56 57 57 58 58 59 60 60 61 61 62 62 63 63 64 64 65 65 66 67 67 68 68 69 69 70 70 71
47 48 48 49 49 50 50 51 51 52 52 53 53 54 54 55 55 56 57 57 58 58 59 59 60 60 61 61 62 62 63 63 64 64 65 66 66 67 67 68 68 69 69 70 70 71 71 72
48 49 49 50 50 51 51 52 52 53 53 54 54 55 55 56 56 57 57 58 58 59 59 60 60 61 62 62 63 63 64 64 65 65 66 66 67 67 68 68 69 69 70 70 71 71 72 72 73
49 50 50 51 51 52 52 53 53 54 54 55 55 56 56 57 57 58 58 59 59 60 60 61 61 62 62 63 63 64 64 65 65 66 66 67 67 68 68 69 69 70 70 71 71 72 72 73 73 74
50 51 51 52 52 53 53 54 54 55 55 56 56 57 57 58 58 59 59 60 60 61 61 62 62 63 63 64 64 65 65 66 66 67 67 68 68 69 69 70 70 71 71 72 72 73 73 74 74 75 75
1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50

8-3
COMBINED VALUES CHART (CON'T)
51 51 52 52 53 53 54 54 55 55 56 56 57 57 58 58 59 59 60 60 61 61 62 62 63 63 64 64 65 65 66 66 67 67 68 68 69 69 70 70 71 71 72 72 73 73 74 74 75 75 76
52 52 53 53 54 54 55 55 56 56 57 57 58 58 59 59 60 60 61 61 62 62 63 63 64 64 64 65 65 66 66 67 67 68 68 69 69 70 70 71 71 72 72 73 73 74 74 75 75 76 76
53 53 54 54 55 55 56 56 57 57 58 58 59 59 60 60 61 61 61 62 62 63 63 64 64 65 65 66 66 67 67 68 68 69 69 69 70 70 71 71 72 72 73 73 74 74 75 75 76 76 77
54 54 55 55 56 56 57 57 58 58 59 59 60 60 60 61 61 62 62 63 63 64 64 65 65 66 66 66 67 67 68 68 69 69 70 70 71 71 71 72 72 73 73 74 74 75 75 76 76 77 77
55 55 56 56 57 57 58 58 59 59 60 60 60 61 61 62 62 63 63 64 64 64 65 65 66 66 67 67 68 68 69 69 69 70 70 71 71 72 72 73 73 73 74 74 75 75 76 76 77 77 78
56 56 57 57 58 58 59 59 60 60 60 61 61 62 62 63 63 63 64 64 65 65 66 66 67 67 67 68 68 69 69 70 70 71 71 71 72 72 73 73 74 74 74 75 75 76 76 77 77 78 78
57 57 58 58 59 59 60 60 60 61 61 62 62 63 63 63 64 64 65 65 66 66 66 67 67 68 68 69 69 69 70 70 71 71 72 72 72 73 73 74 74 75 75 75 76 76 77 77 78 78 79
58 58 59 59 60 60 61 61 61 62 62 63 63 63 64 64 65 65 66 66 66 67 67 68 68 69 69 69 70 70 71 71 71 72 72 73 73 74 74 74 75 75 76 76 76 77 77 78 78 79 79
59 59 60 60 61 61 61 62 62 63 63 64 64 64 65 65 66 66 66 67 67 68 68 68 69 69 70 70 70 71 71 72 72 73 73 73 74 74 75 75 75 76 76 77 77 77 78 78 79 79 80
60 60 61 61 62 62 62 63 63 64 64 64 65 65 66 66 66 67 67 68 68 68 69 69 70 70 70 71 71 72 72 72 73 73 74 74 74 75 75 76 76 76 77 77 78 78 78 79 79 80 80
61 61 62 62 63 63 63 64 64 65 65 65 66 66 66 67 67 68 68 68 69 69 70 70 70 71 71 72 72 72 73 73 73 74 74 75 75 75 76 76 77 77 77 78 78 79 79 79 80 80 81
62 62 63 63 64 64 64 65 65 65 66 66 67 67 67 68 68 68 69 69 70 70 70 71 71 72 72 72 73 73 73 74 74 75 75 75 76 76 76 77 77 78 78 78 79 79 79 80 80 81 81
63 63 64 64 64 65 65 66 66 66 67 67 67 68 68 69 69 69 70 70 70 71 71 72 72 72 73 73 73 74 74 74 75 75 76 76 76 77 77 77 78 78 79 79 79 80 80 80 81 81 82
64 64 65 65 65 66 66 67 67 67 68 68 68 69 69 69 70 70 70 71 71 72 72 72 73 73 73 74 74 74 75 75 76 76 76 77 77 77 78 78 78 79 79 79 80 80 81 81 81 82 82
65 65 66 66 66 67 67 67 68 68 69 69 69 70 70 70 71 71 71 72 72 72 73 73 73 74 74 74 75 75 76 76 76 77 77 77 78 78 78 79 79 79 80 80 80 81 81 81 82 82 83
66 66 67 67 67 68 68 68 69 69 69 70 70 70 71 71 71 72 72 72 73 73 73 74 74 75 75 75 76 76 76 77 77 77 78 78 78 79 79 79 80 80 80 81 81 81 82 82 82 83 83
67 67 68 68 68 69 69 69 70 70 70 71 71 71 72 72 72 73 73 73 74 74 74 75 75 75 76 76 76 77 77 77 78 78 78 79 79 79 80 80 80 81 81 81 82 82 82 83 83 83 84
68 68 69 69 69 70 70 70 71 71 71 72 72 72 72 73 73 73 74 74 74 75 75 75 76 76 76 77 77 77 78 78 78 79 79 79 80 80 80 80 81 81 81 82 82 82 83 83 83 84 84
69 69 70 70 70 71 71 71 71 72 72 72 73 73 73 74 74 74 75 75 75 76 76 76 76 77 77 77 78 78 78 79 79 79 80 80 80 80 81 81 81 82 82 82 83 83 83 84 84 84 85
70 70 71 71 71 72 72 72 72 73 73 73 74 74 74 75 75 75 75 76 76 76 77 77 77 78 78 78 78 79 79 79 80 80 80 81 81 81 81 82 82 82 83 83 83 84 84 84 84 85 85
71 71 72 72 72 72 73 73 73 74 74 74 74 75 75 75 76 76 76 77 77 77 77 78 78 78 79 79 79 79 80 80 80 81 81 81 81 82 82 82 83 83 83 83 84 84 84 85 85 85 86
72 72 73 73 73 73 74 74 74 75 75 75 75 76 76 76 76 77 77 77 78 78 78 78 79 79 79 80 80 80 80 81 81 81 82 82 82 82 83 83 83 83 84 84 84 85 85 85 85 86 86
73 73 74 74 74 74 75 75 75 75 76 76 76 77 77 77 77 78 78 78 78 79 79 79 79 80 80 80 81 81 81 81 82 82 82 82 83 83 83 84 84 84 84 85 85 85 85 86 86 86 87
74 74 75 75 75 75 76 76 76 76 77 77 77 77 78 78 78 78 79 79 79 79 80 80 80 81 81 81 81 82 82 82 82 83 83 83 83 84 84 84 84 85 85 85 85 86 86 86 86 87 87
75 75 76 76 76 76 77 77 77 77 78 78 78 78 79 79 79 79 80 80 80 80 81 81 81 81 82 82 82 82 83 83 83 83 84 84 84 84 85 85 85 85 86 86 86 86 87 87 87 87 88
76 76 76 77 77 77 77 78 78 78 78 79 79 79 79 80 80 80 80 81 81 81 81 82 82 82 82 82 83 83 83 83 84 84 84 84 85 85 85 85 86 86 86 86 87 87 87 87 88 88 88
77 77 77 78 78 78 78 79 79 79 79 80 80 80 80 80 81 81 81 81 82 82 82 82 83 83 83 83 83 84 84 84 84 85 85 85 85 86 86 86 86 86 87 87 87 87 88 88 88 88 89
78 78 78 79 79 79 79 80 80 80 80 80 81 81 81 81 82 82 82 82 82 83 83 83 83 84 84 84 84 84 85 85 85 85 85 86 86 86 86 87 87 87 87 87 88 88 88 88 89 89 89
79 79 79 80 80 80 80 80 81 81 81 81 82 82 82 82 82 83 83 83 83 83 84 84 84 84 84 85 85 85 85 86 86 86 86 86 87 87 87 87 87 88 88 88 88 88 89 89 89 89 90
80 80 80 81 81 81 81 81 82 82 82 82 82 83 83 83 83 83 84 84 84 84 84 85 85 85 85 85 86 86 86 86 86 87 87 87 87 87 88 88 88 88 88 89 89 89 89 89 90 90 90
81 81 81 82 82 82 82 82 83 83 83 83 83 83 84 84 84 84 84 85 85 85 85 85 86 86 86 86 86 87 87 87 87 87 87 88 88 88 88 88 89 89 89 89 89 90 90 90 90 90 91
82 82 82 83 83 83 83 83 83 84 84 84 84 84 85 85 85 85 85 85 86 86 86 86 86 87 87 87 87 87 87 88 88 88 88 88 88 89 89 89 89 89 90 90 90 90 90 90 91 91 91
83 83 83 84 84 84 84 84 84 85 85 85 85 85 85 86 86 86 86 86 86 87 87 87 87 87 87 88 88 88 88 88 88 89 89 89 89 89 89 90 90 90 90 90 90 91 91 91 91 91 92
84 84 84 84 85 85 85 85 85 85 86 86 86 86 86 86 87 87 87 87 87 87 88 88 88 88 88 88 88 89 89 89 89 89 89 90 90 90 90 90 90 91 91 91 91 91 91 92 92 92 92
85 85 85 85 86 86 86 86 86 86 87 87 87 87 87 87 87 88 88 88 88 88 88 88 89 89 89 89 89 89 90 90 90 90 90 90 90 91 91 91 91 91 91 91 92 92 92 92 92 92 93
86 86 86 86 87 87 87 87 87 87 87 88 88 88 88 88 88 88 89 89 89 89 89 89 89 90 90 90 90 90 90 90 90 91 91 91 91 91 91 91 92 92 92 92 92 92 92 93 93 93 93
87 87 87 87 88 88 88 88 88 88 88 88 89 89 89 89 89 89 89 89 90 90 90 90 90 90 90 91 91 91 91 91 91 91 91 92 92 92 92 92 92 92 92 93 93 93 93 93 93 93 94
88 88 88 88 88 89 89 89 89 89 89 89 89 90 90 90 90 90 90 90 90 91 91 91 91 91 91 91 91 91 92 92 92 92 92 92 92 92 93 93 93 93 93 93 93 93 94 94 94 94 94
89 89 89 89 89 90 90 90 90 90 90 90 90 90 91 91 91 91 91 91 91 91 91 92 92 92 92 92 92 92 92 92 93 93 93 93 93 93 93 93 93 94 94 94 94 94 94 94 94 94 95
90 90 90 90 90 91 91 91 91 91 91 91 91 91 91 92 92 92 92 92 92 92 92 92 92 93 93 93 93 93 93 93 93 93 93 94 94 94 94 94 94 94 94 94 94 95 95 95 95 95 95
91 91 91 91 91 91 92 92 92 92 92 92 92 92 92 92 92 93 93 93 93 93 93 93 93 93 93 93 94 94 94 94 94 94 94 94 94 94 94 95 95 95 95 95 95 95 95 95 95 95 96
92 92 92 92 92 92 92 93 93 93 93 93 93 93 93 93 93 93 93 94 94 94 94 94 94 94 94 94 94 94 94 94 95 95 95 95 95 95 95 95 95 95 95 95 96 96 96 96 96 96 96
93 93 93 93 93 93 93 93 94 94 94 94 94 94 94 94 94 94 94 94 94 94 95 95 95 95 95 95 95 95 95 95 95 95 95 95 96 96 96 96 96 96 96 96 96 96 96 96 96 96 97
94 94 94 94 94 94 94 94 94 95 95 95 95 95 95 95 95 95 95 95 95 95 95 95 95 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97
95 95 95 95 95 95 95 95 95 95 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 98
96 96 96 96 96 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 98 98 98 98
97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 99
98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99
99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 100
1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50

8-4
COMBINED VALUES CHART (CON'T)
51 76
52 76 77
53 77 77 78
54 77 78 78 79
55 78 78 79 79 80
56 78 79 79 80 80 81
57 79 79 80 80 81 81 82
58 79 80 80 81 81 82 82 82
59 80 80 81 81 82 82 82 83 83
60 80 81 81 82 82 82 83 83 84 84
61 81 81 82 82 82 83 83 84 84 84 85
62 81 82 82 83 83 83 84 84 84 85 85 86
63 82 82 83 83 83 84 84 84 85 85 86 86 86
64 82 83 83 83 84 84 85 85 85 86 86 86 87 87
65 83 83 84 84 84 85 85 85 86 86 86 87 87 87 88
66 83 84 84 84 85 85 85 86 86 86 87 87 87 88 88 88
67 84 84 84 85 85 85 86 86 86 87 87 87 88 88 88 89 89
68 84 85 85 85 86 86 86 87 87 87 88 88 88 88 89 89 89 90
69 85 85 85 86 86 86 87 87 87 88 88 88 89 89 89 89 90 90 90
70 85 86 86 86 87 87 87 87 88 88 88 89 89 89 90 90 90 90 91 91
71 86 86 86 87 87 87 88 88 88 88 89 89 89 90 90 90 90 91 91 91 92
72 86 87 87 87 87 88 88 88 89 89 89 89 90 90 90 90 91 91 91 92 92 92
73 87 87 87 88 88 88 88 89 89 89 89 90 90 90 91 91 91 91 92 92 92 92 93
74 87 88 88 88 88 89 89 89 89 90 90 90 90 91 91 91 91 92 92 92 92 93 93 93
75 88 88 88 89 89 89 89 90 90 90 90 91 91 91 91 92 92 92 92 93 93 93 93 94 94
76 88 88 89 89 89 89 90 90 90 90 91 91 91 91 92 92 92 92 93 93 93 93 94 94 94 94
77 89 89 89 89 90 90 90 90 91 91 91 91 91 92 92 92 92 93 93 93 93 94 94 94 94 94 95
78 89 89 90 90 90 90 91 91 91 91 91 92 92 92 92 93 93 93 93 93 94 94 94 94 95 95 95 95
79 90 90 90 90 91 91 91 91 91 92 92 92 92 92 93 93 93 93 93 94 94 94 94 95 95 95 95 95 96
80 90 90 91 91 91 91 91 92 92 92 92 92 93 93 93 93 93 94 94 94 94 94 95 95 95 95 95 96 96 96
81 91 91 91 91 91 92 92 92 92 92 93 93 93 93 93 94 94 94 94 94 94 95 95 95 95 95 96 96 96 96 96
82 91 91 92 92 92 92 92 92 93 93 93 93 93 94 94 94 94 94 94 95 95 95 95 95 96 96 96 96 96 96 97 97
83 92 92 92 92 92 93 93 93 93 93 93 94 94 94 94 94 94 95 95 95 95 95 95 96 96 96 96 96 96 97 97 97 97
84 92 92 92 93 93 93 93 93 93 94 94 94 94 94 94 95 95 95 95 95 95 96 96 96 96 96 96 96 97 97 97 97 97 97
85 93 93 93 93 93 93 94 94 94 94 94 94 94 95 95 95 95 95 95 96 96 96 96 96 96 96 97 97 97 97 97 97 97 98 98
86 93 93 93 94 94 94 94 94 94 94 95 95 95 95 95 95 95 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 98 98 98 98
87 94 94 94 94 94 94 94 95 95 95 95 95 95 95 95 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 98 98 98 98 98 98 98
88 94 94 94 94 95 95 95 95 95 95 95 95 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 99
89 95 95 95 95 95 95 95 95 95 96 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 99 99 99
90 95 95 95 95 96 96 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99
91 96 96 96 96 96 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99 99 99
92 96 96 96 96 96 96 97 97 97 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99 99 99 99 99 99
93 97 97 97 97 97 97 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99 99 99 99 99 99 99 99 99 100
94 97 97 97 97 97 97 97 97 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 
100 100 100
95 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 
100 100 100 100 100 100
96 98 98 98 98 98 98 98 98 98 98 98 98 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 
100 100 100 100 100 100 100 100 100
97 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 
100 100 100 100 100 100 100 100 100 100 100 100 100 100
98 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 99 100 
100 100 100 100 100 
100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100
99 
100 
100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100
51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99