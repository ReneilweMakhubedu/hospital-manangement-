/**
 * Public medical guidance for the home-page chat.
 * Answers are educational. They do not diagnose, prescribe, or replace a clinician.
 * Emergency wording always directs people to Casualty.
 */

const SS_MARKERS = [
  'sawubona', 'sanibonani', 'ngiyabonga', 'unjani', 'ngicela', 'ngifuna', 'ngigula',
  'yini', 'kuphi', 'nini', 'kanjani', 'yebo', 'cha', 'sibhedlela', 'dokotela',
  'umutsi', 'emaphilisi', 'kugula', 'kubuhlungu', 'sisu', 'sifuba', 'inhloko',
  'umoya', 'ingati', 'ingane', 'umntfwana', 'shukela', 'ingculaza', 'khulelwe',
  'kukhulelwa', 'kushisa', 'tifo', 'sifo', 'ngiyaphila', 'siswati',
  'khuluma', 'ngitsi', 'make', 'babe', 'mfowethu', 'sisi', 'libhodlela', 'umtimba',
  'kuphefumula', 'kuhlabela', 'umjuluko', 'emanti', 'phuza', 'sikhalo', 'kuvakasha',
  'kunyisa', 'kuhlela', 'ikhadi', 'ngileteni',
];

const TOPICS = [
  {
    id: 'emergency',
    emergency: true,
    keys: [
      'chest pain', 'heart attack', 'cannot breathe', "can't breathe", 'cant breathe',
      'not breathing', 'unconscious', 'will not wake', 'wont wake', 'seizure', 'fitting',
      'stroke', 'face droop', 'heavy bleeding', 'bleeding heavily', 'suicidal', 'overdose',
      'anaphylaxis', 'severe allergic', 'choking',
      'sifuba sibuhlungu', 'kubuhlungu esifubeni', 'angikhoni kuphefumula', 'akaphefumuli',
      'akavuki', 'ingati leningi', 'kuhlabela', 'udze ufe', 'suicide',
    ],
    en: 'This may be an emergency. Go to Casualty at Rob Ferreira Hospital now, or call emergency services. Do not drive yourself if you have chest pain, cannot breathe, are bleeding heavily, or someone will not wake. This chat cannot treat an emergency.',
    ss: 'Loku kungaba yindzaba lephutfumako. Hamba nyalo eCasualty eRob Ferreira Hospital, noma ushayele labosizo lwephutfumako. Ungazishayeli uma sifuba sibuhlungu, ungakhoni kuphefumula, kunengati leningi, noma umuntfu angavuki. Lengcoco ayikwenti kwelashwa kwephutfumako.',
  },
  {
    id: 'chest',
    keys: ['chest', 'heart', 'palpitation', 'angina', 'sifuba', 'inhliziyo', 'kubetha inhliziyo'],
    en: 'Chest pain or a racing heart can come from the heart, lungs, muscles, or anxiety. If pain is severe, spreads to the arm or jaw, comes with sweating, nausea, or shortness of breath, go to Casualty now. Milder pain still needs a nurse or doctor the same day. Do not take someone else’s heart tablets.',
    ss: 'Kubuhlungu esifubeni noma inhliziyo lebetako kakhulu kungavela enhliziyweni, emaphashini, noma ekucasukeni. Uma kubuhlungu kakhulu, kuya engalweni noma emhlathini, kukhona umjuluko noma umoya umfishane, hamba eCasualty nyalo. Uma kuncane, bonana nemhlengikati noma dokotela namuhla. Ungasebentisi emaphilisi enhliziyo emuntfu lomunye.',
  },
  {
    id: 'breath',
    keys: ['breath', 'asthma', 'wheeze', 'shortness', 'lungs', 'umoya', 'kuphefumula', 'sifuba somoya', 'asthma'],
    en: 'Trouble breathing can be asthma, infection, heart problems, or an allergic reaction. Sit upright, use your own prescribed inhaler if you have one, and loosen tight clothing. If you cannot speak in full sentences, lips look blue, or it is getting worse, go to Casualty immediately.',
    ss: 'Kubanzima kuphefumula kungaba yi-asthma, sifo, inhliziyo, noma kusabela. Hlala ucophe, usebentise i-inhaler yakho uma unayo, bese uvula timphahla leticindzetelako. Uma ungakhoni kukhuluma imisho, milomo iluhlata, noma kuya kubi, hamba eCasualty nyalo.',
  },
  {
    id: 'stroke',
    keys: ['stroke', 'face drooping', 'slurred', 'arm weakness', 'fast test', 'uhlangotsi', 'umlomo uyawa'],
    en: 'Stroke signs: face drooping, arm weakness, speech trouble, sudden confusion, or a sudden severe headache. Note the time symptoms started and go to Casualty immediately. Do not give food, drink, or aspirin unless a clinician tells you to.',
    ss: 'Timphawu tesitofu: buso buyawa luhlangotsi lolunye, ingalo ibuthakathaka, inkulumo ayicaci, noma inhloko ibuhlungu kakhulu kungazelelwa. Bhala sikhatsi sekucala, bese uhamba eCasualty nyalo. Ungamniki kudla, kuphuza, noma i-aspirin ngaphandle kwekutsi dokotela akutjele.',
  },
  {
    id: 'fever',
    keys: ['fever', 'temperature', 'hot body', 'flu', 'malaria', 'kushisa', 'imfiva', 'umtimba ushisa', 'malariya'],
    en: 'Fever means the body is fighting infection. Rest, drink water or oral rehydration, and wear light clothes. Seek care the same day if fever is in a baby under 3 months, lasts more than 2 days, comes with a stiff neck, rash, confusion, or difficulty breathing. In a malaria area, fever needs a malaria test — do not guess.',
    ss: 'Kushisa umtimba kusho kutsi umtimba ulwa nesifo. Phumula, phuza emanti noma i-ORS, ugcoke kalula. Hamba esibhedlela namuhla uma ingane incane kunetinyanga letintsatfu, kushisa kudlula emalanga lamabili, intsamo iqinile, kukhona rubhavu, noma umoya umfishane. Etindzaweni temalariya, kushisa kudinga kuhlolwa kwemalariya.',
  },
  {
    id: 'head',
    keys: ['headache', 'migraine', 'head pain', 'inhloko', 'ikhanda', 'kubuhlungu inhloko'],
    en: 'Most headaches improve with rest, water, and a simple pain medicine you already use safely. Go to Casualty if the headache is the worst of your life, starts suddenly, follows a head injury, or comes with weakness, vomiting, stiff neck, or confusion.',
    ss: 'Inhloko lebunhlungu kuvame kulungiswa kukuphumula, emanti, nemphilisi yekubuhlungu loyisebentisako kahle. Hamba eCasualty uma inhloko ibuhlungu kakhulu kunako konkhe, iqala kungazelelwa, kulandzela kulimala kwekhanda, noma kukhona buthakathaka, kulahla, noma ukudideka.',
  },
  {
    id: 'stomach',
    keys: ['stomach', 'diarrhoea', 'diarrhea', 'vomit', 'nausea', 'dehydration', 'sisu', 'kuhuda', 'kulahla', 'huda', 'isisu'],
    en: 'For diarrhoea or vomiting, sip oral rehydration often and keep eating small soft meals if you can. Wash hands. Go to the hospital if there is blood in the stool, you cannot keep fluids down, a child is very sleepy or has no tears, or pain is severe and one-sided (possible appendix).',
    ss: 'Uma uhuda noma ulahla, phuza i-ORS kancane kancane. Geza tandla. Hamba esibhedlela uma kunengati endle, ungakhoni kugcina emanti, ingane ilele kakhulu noma ayinati tinyembeti, noma sisu sibuhlungu kakhulu luhlangotsini lolunye.',
  },
  {
    id: 'diabetes',
    keys: ['diabetes', 'sugar', 'glucose', 'insulin', 'shukela', 'iswekile'],
    en: 'Diabetes is high blood sugar over time. Eat regular meals, take only the medicine prescribed for you, check your feet daily, and keep clinic appointments. Very high or very low sugar can cause confusion, sweating, or collapse — if the person cannot swallow or is unconscious, go to Casualty and do not force food into the mouth.',
    ss: 'Isifo seshukela kusho shukela lephakeme egazini. Yidla ngesikhatsi, sebentisa umutsi lowunikwe wena, hlola tinyawo onkhe malanga, ugcine emabhukwini. Shukela lephakeme kakhulu noma lephansi kakhulu ingadida umuntfu noma imwise. Uma angakhoni kugwinya noma akavuki, hamba eCasualty. Ungamngenisi kudla emlonyeni.',
  },
  {
    id: 'bp',
    keys: ['blood pressure', 'hypertension', 'bp', 'ingati lephakeme', 'high blood'],
    en: 'High blood pressure often has no pain. Take tablets every day even when you feel well, reduce extra salt, and attend review. A sudden severe headache, chest pain, weakness on one side, or breathlessness with very high pressure is an emergency — go to Casualty.',
    ss: 'Ingati lephakeme kuvame kungabi nebuhlungu. Phuza emaphilisi onkhe malanga noma uzizwa ulungile, nciphisa lusawoti, ugcine sikhatsi sekuhlolwa. Uma inhloko ibuhlungu kakhulu kungazelelwa, sifuba sibuhlungu, noma uhlangotsi bunye buthakathaka, hamba eCasualty.',
  },
  {
    id: 'hiv',
    keys: ['hiv', 'aids', 'arv', 'antiretroviral', 'prep', 'pep', 'ingculaza', 'ingculazi', 'arvs'],
    en: 'HIV is treated with antiretroviral tablets taken every day. Testing and treatment are available at the hospital and clinics. Do not stop tablets because you feel better. If you may have been exposed in the last 72 hours, ask for PEP the same day. This chat does not give a test result. Condoms reduce sexual transmission.',
    ss: 'I-HIV yelashwa ngemaphilisi e-ARV aphuzwa onkhe malanga. Kuhlolwa nekwelashwa kukhona esibhedlela nasetikliniki. Ungayekeli emaphilisi ngoba uzizwa ungcono. Uma ucabanga kutsi uhlangane ne-HIV emahoreni langemashumi lasikhombisa lambili, cela i-PEP namuhla. Lengcoco ayikuniki umphumela wekuhlolwa. Ema-condom anciphisa kutfutsela ngekwelicani.',
  },
  {
    id: 'tb',
    keys: ['tb', 'tuberculosis', 'cough blood', 'night sweat', 'sifo semaphaphu', 'kukhwehlela', 'ingati ekukhwehleleni'],
    en: 'TB often causes a cough for more than 2 weeks, night sweats, weight loss, or fever. It is curable if the full treatment is finished. Cough into your elbow, open windows, and get a sputum test. Coughing blood or severe breathlessness needs Casualty or the TB clinic the same day. Do not share TB tablets.',
    ss: 'I-TB ivame kubangela kukhwehlela ngetinyanga letingaphezu kwemaviki lamabili, umjuluko ebusuku, kwehla emtimbeni, noma kushisa. Iyelapheka uma ugcina umutsi wonkhe. Khwehlela engalweni, vula emafasitela, uhlolelwe i-TB. Uma ukhwehlela ingati noma umoya umfishane kakhulu, hamba eCasualty noma ekliniki ye-TB namuhla.',
  },
  {
    id: 'pregnancy',
    keys: ['pregnant', 'pregnancy', 'antenatal', 'baby kick', 'labour', 'labor', 'miscarriage', 'khulelwe', 'kukhulelwa', 'umntfwana', 'kuzelela', 'kuzala'],
    en: 'Antenatal visits protect you and the baby. Go to the maternity unit or Casualty for bleeding in pregnancy, severe headache with swelling, the baby moving much less, waters breaking, or regular strong pains. Do not take leftover medicines without asking a midwife or doctor.',
    ss: 'Kuhambela kwekukhulelwa kuvikela wena nomntfwana. Hamba eCasualty noma kwabesifazane labakhulelwe uma kunengati, inhloko ibuhlungu kanye nekuvuvuka, umntfwana ahamba kancane, emanti aphuma, noma kukhona kubuhlungu lokuqinile njalo. Ungasebentisi emaphilisi lasele ungakabuti umbelethisi noma dokotela.',
  },
  {
    id: 'child',
    keys: ['child', 'baby', 'infant', 'toddler', 'ingane', 'umntfwana', 'luswane'],
    en: 'A sick child needs fluids, fever care, and a calm caregiver. Take a baby under 3 months with fever to the hospital the same day. Also go urgently if the child is not waking, has a fit, a bulging soft spot, blue lips, no wet nappies, or a rash that does not fade when pressed.',
    ss: 'Ingane legulako idzinga emanti, lusito lwekushisa, nomgadzi lopholile. Uma luswane lungaphansi kwetinyanga letintsatfu lushisa, hamba esibhedlela namuhla. Hamba masinyane uma ingane ingavuki, ihlaba, milomo iluhlata, noma ayimanzi ema-nappy.',
  },
  {
    id: 'wound',
    keys: ['wound', 'cut', 'bleed', 'bleeding', 'bite', 'silondza', 'kusika', 'ingati', 'kulunywa'],
    en: 'Press a clean cloth firmly on a bleeding wound for 10 minutes without peeking. Wash small cuts with clean water and cover them. Go to Casualty for bleeding that will not stop, a deep cut, a bite, a dirty wound, or if you are not sure your tetanus vaccine is up to date.',
    ss: 'Cindzetela indvwangu lehlobile esilondzeni lesopha imizuzu lelishumi ungakukhiphi. Geza tinsika letincane ngemanti lahlobile bese uyavala. Hamba eCasualty uma ingati ingami, silondza sijulile, kulunywe, noma ungacini ngekugoma kwe-tetanus.',
  },
  {
    id: 'burn',
    keys: ['burn', 'scald', 'fire', 'kusha', 'lushiselo', 'umilio'],
    en: 'Cool a burn under gentle running water for 20 minutes. Do not put butter, toothpaste, or ice on it. Remove rings. Cover with a clean cloth. Go to Casualty for burns on the face, hands, genitals, or a large area, or if the person inhaled smoke.',
    ss: 'Pholisa kushiswa ngemanti lacwebile imizuzu lengemashumi lambili. Ungafaki sibisi, umutsi wemazinyo, noma i-ayisi. Khipha tiringi. Vala ngendvwangu lehlobile. Hamba eCasualty uma kushiswe buso, tandla, noma indzawo lenkhulu, noma umuntfu aphefumule intfutfu.',
  },
  {
    id: 'bone',
    keys: ['fracture', 'broken', 'sprain', 'fall', 'itsambo', 'kuphuka', 'kuwa'],
    en: 'Keep a suspected broken bone still and supported. Do not try to push a bone back. Apply a cold cloth wrapped in material, not ice directly on skin. Go to Casualty if the limb looks bent, you cannot use it, there is numbness, or the injury followed a hard fall.',
    ss: 'Gcina itsambo locabanga kutsi liphukile linganyakati. Ungalingenisi emuva. Faka indvwangu lepholile levalwe, hhayi i-ayisi esikhumbeni. Hamba eCasualty uma umtimba ubukeka ugobile, ungakhoni kuwusebentisa, noma kuwa kukhulu.',
  },
  {
    id: 'mental',
    keys: ['depression', 'anxiety', 'sad', 'suicide', 'mental', 'kudzinwa', 'kucasukela', 'kufa'],
    en: 'Feeling very sad, anxious, or hopeless is a health problem, not a weakness. Talk to a nurse, doctor, or social worker at the hospital. If you may hurt yourself or someone else, go to Casualty now or stay with a trusted person and call emergency services. You deserve help today.',
    ss: 'Kudzinwa kakhulu, kucasukela, noma kucabanga kutsi akukho litfuba, kuyindzaba yetemphilo, hhayi butsakatsaka. Khuluma nemhlengikati, dokotela, noma social worker esibhedlela. Uma ucabanga kuzilimata noma kulimata lomunye, hamba eCasualty nyalo noma uhlale nemuntfu lotsembako. Ufanele lusito namuhla.',
  },
  {
    id: 'medicine',
    keys: ['medicine', 'medication', 'tablet', 'dose', 'pharmacy', 'side effect', 'umutsi', 'emaphilisi', 'ikhemisi', 'pharmacy'],
    en: 'Take only medicines prescribed or labelled for you, at the time written on the label. Do not share tablets or double a missed dose unless the label says so. Ask the pharmacy if you are unsure. Allergic swelling of the lips or tongue, rash with breathing trouble, or collapse after a medicine is an emergency.',
    ss: 'Sebentisa umutsi lowunikwe wena, ngesikhatsi lesibhalwe. Ungabelani ngemaphilisi. Ungaphindzi umutsi lowuphutselwe ngaphandle kwekutsi ilebula itjelo. Buta ekhemisi uma ungacini. Uma milomo ivuvuka, ulimi luvuvuka, noma ungakhoni kuphefumula ngemuva kwemutsi, hamba eCasualty.',
  },
  {
    id: 'appointment',
    keys: ['appointment', 'book', 'clinic', 'queue', 'register', 'login', 'sibhaliso', 'sikhatsi', 'ibhuku', 'kubhalisa'],
    en: 'Patients can register on this site, then book an appointment after login. Choose the reason, department, date, and an open time. For chest pain, trouble breathing, heavy bleeding, or a person who will not wake, do not wait for a booking — go to Casualty.',
    ss: 'Tiguli tingatibhalisa kule-website, bese tibhala sikhatsi ngemuva kwekungena. Khetsa sizatfu, umnyango, lusuku, nesikhatsi lesivulekile. Uma sifuba sibuhlungu, ungakhoni kuphefumula, kunengati leningi, noma umuntfu angavuki, ungakalindi ibhuku — hamba eCasualty.',
  },
  {
    id: 'vaccine',
    keys: ['vaccine', 'vaccination', 'immunisation', 'immunization', 'kugoma', 'umgomo'],
    en: 'Vaccines prevent serious infections in children and adults, including tetanus after wounds and childhood illnesses. Bring the Road to Health card to the clinic. Fever for a day after a vaccine is common. Seek care if the child is not waking, has a fit, or has trouble breathing.',
    ss: 'Kugoma kuvikela tifo letinzima kubantfwana nabadzala, kufaka i-tetanus ngemuva kwesilondza. Leta ikhadi le-Road to Health ekliniki. Kushisa lilanga linye ngemuva kwemgomo kuvamile. Hamba esibhedlela uma ingane ingavuki, ihlaba, noma umoya umfishane.',
  },
  {
    id: 'cough',
    keys: ['cough', 'cold', 'sore throat', 'flu', 'kukhwehlela', 'umkhuhlane', 'umphimbo'],
    en: 'A short cough or cold usually needs rest, fluids, and handwashing. Stay home if you have fever. Get tested for TB if the cough lasts more than 2 weeks, or you have night sweats or weight loss. Trouble breathing, blue lips, or coughing a lot of blood needs Casualty.',
    ss: 'Kukhwehlela lokufishane noma umkhuhlane kuvame kudzinga kuphumula, emanti, nekugeza tandla. Hlala ekhaya uma ushisa. Hlola i-TB uma ukhwehlela emaviki langaphezu kwemabili, umjuluko ebusuku, noma emtimba wehla. Uma umoya umfishane noma ukhwehlela ingati, hamba eCasualty.',
  },
  {
    id: 'pain',
    keys: ['pain', 'hurt', 'ache', 'kubuhlungu', 'buhlungu'],
    en: 'Tell a clinician where the pain is, when it started, and what makes it worse. Rest the painful part and use only a pain medicine that is safe for you. Sudden severe pain, pain with chest symptoms, a swollen hot leg, or pain with fever and vomiting should be seen urgently at the hospital.',
    ss: 'Tjela dokotela kutsi kubuhlungu kuphi, kucale nini, nalokwenta kube kubi. Phumula indzawo leyo, usebentise umutsi wekubuhlungu lophephile kuwe. Kubuhlungu kakhulu kungazelelwa, sifuba, umlenze lovuvukile ushisa, noma kushisa nekuhuda kudinga sibhedlela masinyane.',
  },
  {
    id: 'wayfinding',
    keys: [
      'where is casualty', 'where is pharmacy', 'where is the pharmacy', 'where is maternity', 'outpatients', 'outpatient',
      'which entrance', 'directions', 'how do i find', 'find the pharmacy', 'find casualty',
      'ikuphi i-casualty', 'ikhemisi ikuphi', 'kuphi i-casualty', 'kuphi ikhemisi', 'kuphi kwabesifazane', 'umnyango wekuphumula',
    ],
    en: 'Ask reception when you arrive — building signs can change. Casualty is the emergency entrance for people who are very ill now. Maternity is for labour and pregnancy emergencies. Outpatients is for booked clinics. Pharmacy dispenses medicines that a clinician has prescribed. This chat cannot give a ward number.',
    ss: 'Buta e-reception uma ufika — titobo tesakhiwo tingashintja. I-Casualty ngumnyango wezindzaba letiphutfumako. Kwabesifazane labakhulelwe yindzawo yekuzala netindzaba tekukhulelwa. Outpatients yetikliniki letibhaliwe. Ikhemisi ikhipha umutsi losewunikwe dokotela. Lengcoco ayikuniki inombolo yewardi.',
  },
  {
    id: 'bring',
    keys: [
      'what to bring', 'what should i bring', 'documents', 'identity document', 'id book', 'clinic card',
      'road to health', 'referral letter', 'bring my tablets', 'ngileteni', 'ngiletani', 'ikhadi',
      'incwadzi yekubona', 'road to health card',
    ],
    en: 'Bring your identity document, clinic or hospital card, referral letter if you have one, and all current tablets in their boxes. For a child, bring the Road to Health booklet. For a booked visit, bring your appointment reference. Leave valuables at home.',
    ss: 'Leta incwadzi yakho yekutibonakalisa, ikhadi lesibhedlela noma lekliniki, incwadzi yekudluliselwa uma unayo, nawo onkhe emaphilisi owaphuzako emabhokisini awo. Eninganeni, leta ikhadi le-Road to Health. Uma unesikhatsi lesibhaliwe, leta inombolo yalelo bhuku. Shiya tintfo letibitako ekhaya.',
  },
  {
    id: 'visiting',
    keys: [
      'visiting hours', 'visiting time', 'visit a patient', 'can i stay', 'stay with my child',
      'queue', 'how long will i wait', 'sikhatsi sekuvakasha', 'kuvakasha', 'kulinda', 'umgadzi wengane',
    ],
    en: 'Ask reception for that day’s visiting times, because wards set them. One adult caregiver may stay with a child — tell the nurse on the ward. Booked clinics use your appointment time. Casualty sees the sickest people first, so a long wait can still be normal if you are stable. If breathing, bleeding, or alertness gets worse while you wait, tell a nurse immediately.',
    ss: 'Buta e-reception sikhatsi sekuvakasha salelo langa, ngobe emawardi ayasibeka. Umgadzi munye lomdzala angahlala nengane — tjela umhlengikati. Tikliniki letibhaliwe tisebentisa sikhatsi sakho. E-Casualty bahlala labagula kakhulu kuqala. Uma umoya, ingati, noma kuvuka kuba kubi ngesikhatsi ulindza, tjela umhlengikati masinyane.',
  },
  {
    id: 'ccmd',
    keys: [
      'ccmdd', 'chronic medicine', 'collection date', 'pick up medicine', 'pickup point', 'refill',
      'collect my tablets', 'kukhicwa kwemutsi', 'umutsi wemalanga onkhe', 'lilanga lekukhicwa',
    ],
    en: 'If you are on CCMDD, your chronic tablets are collected on a set date at the pickup point on your profile, not only inside the hospital pharmacy. After login, open Medications to see the next date and change the pickup point. Come before the tablets run out. If you feel suddenly worse, do not wait for the collection date — go to the clinic or Casualty.',
    ss: 'Uma ukuma i-CCMDD, emaphilisi akho emalanga onkhe ayakhicwa ngelilanga lelibekiwe endzaweni lekukhicwa leku-profile yakho, hhayi kuphela ekhemisi yesibhedlela. Ngemuva kwekungena, vula emaphilisi ubone lilanga lelandzelako. Fika ungakaphelelwa. Uma ugula kakhulu kungazelelwa, ungakalindi lilanga lekukhicwa — hamba ekliniki noma eCasualty.',
  },
  {
    id: 'complaint',
    keys: [
      'complaint', 'complain', 'unhappy', 'bad service', 'feedback', 'sla', 'sikhalo', 'angenetisekile',
      'lusito lolubi', 'kukhala',
    ],
    en: 'You can lodge a complaint under Feedback after you log in as a patient. The hospital aims to acknowledge it within 5 working days and resolve it within 25 working days. Say what happened, the date, and the department. A complaint is not for chest pain, trouble breathing, or heavy bleeding — those go to Casualty now.',
    ss: 'Ungafaka sikhalo ngaphansi kwe-Feedback ngemuva kwekungena njengesiguli. Sibhedlela sihlose kuvuma sikhalo ngetinsuku letisihlanu tisebenti, bese siyicaculisa ngetinsuku letingemashumi lambili nasisihlanu. Tjela lokwentekile, lusuku, nomnyango. Sikhalo akusilo sifuba lesibuhlungu, umoya umfishane, noma ingati leningi — loko kuya eCasualty nyalo.',
  },
  {
    id: 'familyplan',
    keys: [
      'family planning', 'contraception', 'contraceptive', 'injection', 'implant', 'condom', 'iud',
      'kuhlela umndeni', 'kugoma umndeni', 'i-injection', 'i-condom', 'kungakhulelwa',
    ],
    en: 'Family planning is available at the clinic and hospital: condoms, pills, injections, implants, and intrauterine methods. A nurse helps you choose what fits your health. It does not need you to be married. Emergency contraception works best as soon as possible after unprotected sex. This chat does not choose a method for you.',
    ss: 'Kuhlela umndeni kukhona ekliniki nasesibhedlela: ema-condom, emaphilisi, ema-injection, i-implant, netindlela letifakwa esibelethweni. Umhlengikati ukusita kukhetsa lokukufanele. Awudingi kutsi ushadile. Umutsi wekukhulelwa lwephutfumako usebenta kangcono masinyane ngemuva kwekuya ocansini ngaphandle kwekuvikeleka. Lengcoco ayikukhetseli indlela.',
  },
  {
    id: 'breastfeed',
    keys: [
      'breastfeed', 'breastfeeding', 'breast milk', 'formula', 'latch', 'kunyisa', 'lubisi lwemabele',
      'umntfwana akanati', 'akanati',
    ],
    en: 'Breast milk is the usual first food for a baby. Feed on cue, including at night, and ask a midwife if latching is painful or the baby is too sleepy to feed. Do not water down formula. Get help the same day if the baby has few wet nappies, a dry mouth, or will not wake to feed.',
    ss: 'Lubisi lwemabele ludla lwekucala lejwayelekile kumntfwana. Mnyise uma afuna, nasebusuku. Buta umbelethisi uma kubuhlungu noma umntfwana alele kakhulu. Ungangezi emanti ku-formula. Cela lusito namuhla uma umntfwana anemanti amancane ema-nappy, umlomo wome, noma angavuki kunyisa.',
  },
  {
    id: 'postnatal',
    keys: [
      'after birth', 'postnatal', 'postpartum', 'bleeding after birth', 'gave birth', 'just given birth',
      'new baby', 'ngemuva kwekuzala', 'ngisebele', 'ngizalile', 'ingati ngemuva kwekuzala',
    ],
    en: 'After birth, attend postnatal checks for you and the baby, and keep the Road to Health card. Heavy bleeding, fever, a severe headache, a smelly discharge, or a baby who will not feed or wake needs the hospital the same day. Feeling very sad after birth is common to mention to the midwife — ask for help, especially if you may harm yourself or the baby.',
    ss: 'Ngemuva kwekuzala, hamba ekuhlolweni kwakho nekwemntfwana, ugcine ikhadi le-Road to Health. Ingati leningi, kushisa, inhloko lebuhlungu kakhulu, noma umntfwana angakunyisi angavuki kudinga sibhedlela namuhla. Kudzinwa kakhulu ngemuva kwekuzala kujwayelekile kukutjela umbelethisi — cela lusito, ikakhulu uma ucabanga kuzilimata noma umntfwana.',
  },
  {
    id: 'hospital',
    keys: ['rob ferreira hospital', 'tertiary hospital', 'which hospital', 'sibhedlela sase', 'about the hospital', 'rfh hms'],
    en: 'Rob Ferreira Hospital in Mbombela is a tertiary hospital. Casualty is for emergencies. Clinics and booked appointments are for ongoing care such as HIV, TB, diabetes, pregnancy, and pharmacy collections. Staff and patients sign in with Login. This chat gives guidance only.',
    ss: 'Sibhedlela saseRob Ferreira eMbombela sibhedlela lesikhulu. I-Casualty yezindzaba letiphutfumako. Tikliniki netikhatsi letibhaliwe ngekunakekelwa lokuchubekako: i-HIV, i-TB, shukela, kukhulelwa, nekhemisi. Basebenti netiguli bangena nge-Login. Lengcoco inika luhlahlo kuphela.',
  },
];

const GREET = {
  keys: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'sawubona', 'sanibonani', 'unjani', 'lotjha'],
  en: 'Sawubona. I am the Rob Ferreira health guide. Ask in English or siSwati about symptoms, HIV, TB, diabetes, pregnancy, children, medicines, or when to come to hospital. I do not give a diagnosis. Emergencies go to Casualty.',
  ss: 'Sawubona. Ngingumsiti wetemphilo eRob Ferreira. Buta ngesiNgisi noma ngesiSwati ngetimphawu, i-HIV, i-TB, shukela, kukhulelwa, bantfwana, umutsi, noma kutsi uhamba nini esibhedlela. Angikhiphi sikhatselo. Tindzaba letiphutfumako tiya eCasualty.',
};

function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectLanguage(text) {
  const value = normalise(text);
  let hits = 0;
  SS_MARKERS.forEach((word) => {
    if (value.includes(word)) hits += 1;
  });
  return hits > 0 ? 'ss' : 'en';
}

function scoreTopic(value, topic) {
  const matched = topic.keys.filter((key) => value.includes(key));
  const kept = matched.filter((key) => !matched.some((other) => other !== key && other.includes(key) && other.length > key.length));
  return kept.reduce((total, key) => total + key.length, 0);
}

export function replyToMedicalQuestion(message, preferred) {
  const value = normalise(message);
  const lang = preferred === 'en' || preferred === 'ss' ? preferred : detectLanguage(value);
  if (!value) {
    return {
      lang,
      emergency: false,
      text: lang === 'ss' ? GREET.ss : GREET.en,
    };
  }

  const emergency = TOPICS.find((topic) => topic.emergency && scoreTopic(value, topic) > 0);
  if (emergency) {
    return { lang, emergency: true, text: emergency[lang] };
  }

  const greetingOnly = value.split(' ').length <= 4 && scoreTopic(value, GREET) > 0
    && TOPICS.every((topic) => scoreTopic(value, topic) === 0);
  if (greetingOnly) {
    return { lang, emergency: false, text: GREET[lang] };
  }

  let best = null;
  let bestScore = 0;
  TOPICS.forEach((topic) => {
    if (topic.emergency) return;
    const score = scoreTopic(value, topic);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  });

  if (best) {
    return { lang, emergency: false, text: best[lang] };
  }

  return {
    lang,
    emergency: false,
    text: lang === 'ss'
      ? 'Angikawutfola kahle lombuto. Chaza kutsi kubuhlungu kuphi, kucale nini, nobani logulako. Ngingachaza ngetimphawu, i-HIV, i-TB, shukela, kukhulelwa, kunyisa, kuhlela umndeni, loko lekumele ukulete, i-CCMDD, sikhalo, nekuvakasha. Angikho dokotela. Uma kute kulungile, hamba eCasualty.'
      : 'I could not match that question yet. Say where it hurts, when it started, and who is ill. I can also guide you on what to bring, where to go, CCMDD collections, complaints, visiting, family planning, and breastfeeding. I am not a doctor. If this feels like an emergency, go to Casualty.',
  };
}

export const STARTERS = [
  { lang: 'en', label: 'I have a fever', text: 'I have a fever' },
  { lang: 'en', label: 'What to bring', text: 'What should I bring to hospital?' },
  { lang: 'en', label: 'CCMDD', text: 'When do I collect my chronic medicine on CCMDD?' },
  { lang: 'ss', label: 'Ngigula', text: 'Ngigula, umtimba ushisa' },
  { lang: 'ss', label: 'Sikhalo', text: 'Ngifuna kufaka sikhalo ngesibhedlela' },
  { lang: 'ss', label: 'Umndeni', text: 'Ngifuna lwati ngekuhlela umndeni' },
];
