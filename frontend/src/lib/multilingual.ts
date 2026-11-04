import { ExplanationBlock } from '@/lib/types';

export interface LocalizedPhrases {
  greeting: string;
  langChanged: string;
  listening: string;
  readyRead: string;
  readingCard: string;
  finishedReading: string;
  stopListening: string;
}

export const LOCALIZED_STRINGS: Record<string, LocalizedPhrases> = {
  'hi-IN': {
    greeting: 'नेत्रसाथी आवाज़ मोड तैयार है। आप किसी भी चित्र, फ़्लोचार्ट या अवधारणा के बारे में पूछ सकते हैं।',
    langChanged: 'भाषा बदलकर हिन्दी कर दी गई है।',
    listening: 'आपकी आवाज़ सुनी जा रही है... कृपया स्पष्ट बोलें।',
    readyRead: 'तैयार! विस्तृत स्पष्टीकरण कार्ड और दृश्य चार्ट तैयार हैं।',
    readingCard: 'कार्ड पढ़ा जा रहा है',
    finishedReading: 'इस पृष्ठ के सभी कार्ड समाप्त हो गए हैं।',
    stopListening: 'आवाज़ सुनना रोक दिया गया है।',
  },
  'ta-IN': {
    greeting: 'நேத்ரசாதி குரல் முறை தயார். எந்த வரைபடம் அல்லது கருத்து பற்றியும் கேளுங்கள்.',
    langChanged: 'மொழி தமிழாக மாற்றப்பட்டது.',
    listening: 'உங்கள் குரலைக் கேட்கிறது... தெளிவாகப் பேசுங்கள்.',
    readyRead: 'தயார்! விரிவான விளக்க அட்டைகள் மற்றும் வரைபடங்கள் தயாராக உள்ளன.',
    readingCard: 'அட்டை படிக்கப்படுகிறது',
    finishedReading: 'இந்தப் பக்கத்தின் அனைத்து அட்டைகளும் முடிந்துவிட்டன.',
    stopListening: 'குரல் கேட்பது நிறுத்தப்பட்டது.',
  },
  'te-IN': {
    greeting: 'నేత్రసాథి వాయిస్ మోడ్ సిద్ధంగా ఉంది. ఏదైనా రేఖాచిత్రం లేదా భావన గురించి అడగండి.',
    langChanged: 'భాష తెలుగులోకి మార్చబడింది.',
    listening: 'మీ స్వరాన్ని వింటున్నాము... స్పష్టంగా మాట్లాడండి.',
    readyRead: 'సిద్ధం! వివరణాత్మక కార్డ్‌లు మరియు రేఖాచిత్రాలు సిద్ధంగా ఉన్నాయి.',
    readingCard: 'కార్డ్ చదవబడుతోంది',
    finishedReading: 'ఈ పేజీలోని అన్ని కార్డులు పూర్తయ్యాయి.',
    stopListening: 'వాయిస్ వినడం ఆపివేయబడింది.',
  },
  'bn-IN': {
    greeting: 'নেত্রসাথী ভয়েস মোড প্রস্তুত। যেকোনো ডায়াগ্রাম বা ধারণা সম্পর্কে জিজ্ঞাসা করুন।',
    langChanged: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
    listening: 'আপনার কথা শোনা হচ্ছে... স্পষ্টভাবে বলুন।',
    readyRead: 'প্রস্তুত! বিস্তারিত ব্যাখ্যামূলক কার্ড এবং চিত্র প্রদর্শিত হয়েছে।',
    readingCard: 'কার্ড পড়া হচ্ছে',
    finishedReading: 'এই পৃষ্ঠার সমস্ত কার্ড শেষ হয়েছে।',
    stopListening: 'কথা শোনা থামানো হয়েছে।',
  },
  'mr-IN': {
    greeting: 'नेत्रसाथी व्हॉइस मोड तयार आहे. कोणत्याही आकृती किंवा संकल्पनेबद्दल विचारा.',
    langChanged: 'भाषा मराठीमध्ये बदलली आहे.',
    listening: 'तुमचा आवाज ऐकत आहे... कृपया स्पष्ट बोला.',
    readyRead: 'तयार! सविस्तर स्पष्टीकरण कार्ड आणि फ्लोचार्ट तयार आहेत.',
    readingCard: 'कार्ड वाचले जात आहे',
    finishedReading: 'या पृष्ठावरील सर्व कार्डे पूर्ण झाली आहेत.',
    stopListening: 'आवाज ऐकणे थांबवले आहे.',
  },
  'ml-IN': {
    greeting: 'നേത്രസാഥി വോയ്‌സ് മോഡ് തയ്യാറാണ്. ഏത് ഡയഗ്രത്തെക്കുറിച്ചും ആശയത്തെക്കുറിച്ചും ചോദിക്കാം.',
    langChanged: 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.',
    listening: 'നിങ്ങളുടെ ശബ്ദം കേൾക്കുന്നു... വ്യക്തമായി സംസാരിക്കുക.',
    readyRead: 'തയ്യാറാണ്! വിശദമായ കാർഡുകളും ഫ്ലോചാർട്ടുകളും തയ്യാറായിക്കഴിഞ്ഞു.',
    readingCard: 'കാർഡ് വായിക്കുന്നു',
    finishedReading: 'ഈ പേജിലെ എല്ലാ കാർഡുകളും പൂർത്തിയായി.',
    stopListening: 'ശബ്ദം കേൾക്കുന്നത് നിർത്തി.',
  },
  'es-ES': {
    greeting: 'Modo de voz de Netrasaathi listo. Pide cualquier diagrama, flujo o concepto que desees explicar.',
    langChanged: 'Idioma cambiado a español.',
    listening: 'Escuchando tu voz... Habla con claridad.',
    readyRead: '¡Listo! Tarjetas explicativas detalladas y diagramas generados.',
    readingCard: 'Leyendo tarjeta',
    finishedReading: 'Has terminado de leer todas las tarjetas de esta página.',
    stopListening: 'Escucha de voz pausada.',
  },
  'en-IN': {
    greeting: 'Direct voice mode ready. Speak the diagram, flowchart, or concept you want explained.',
    langChanged: 'Voice language set to English.',
    listening: 'Listening to your voice... Speak clearly.',
    readyRead: 'Ready! Detailed step-by-step visual cards and flowcharts prepared.',
    readingCard: 'Reading card',
    finishedReading: 'Finished reading all cards on this page.',
    stopListening: 'Voice listening paused.',
  },
  'en-US': {
    greeting: 'Direct voice mode ready. Speak the diagram, flowchart, or concept you want explained.',
    langChanged: 'Voice language set to English.',
    listening: 'Listening to your voice... Speak clearly.',
    readyRead: 'Ready! Detailed step-by-step visual cards and flowcharts prepared.',
    readingCard: 'Reading card',
    finishedReading: 'Finished reading all cards on this page.',
    stopListening: 'Voice listening paused.',
  },
};

export function getLocalizedStrings(langCode: string): LocalizedPhrases {
  return LOCALIZED_STRINGS[langCode] || LOCALIZED_STRINGS['en-IN'];
}

// Multilingual in-depth concept generator for Direct Concept Explainer
// Returns 4 comprehensive, detailed, step-by-step cards with visual diagrams, flowcharts, analogies, and formulas
export function generateConceptBlocks(query: string, langCode: string): ExplanationBlock[] {
  const q = query.toLowerCase();
  const lang = langCode.split('-')[0].toLowerCase();

  // -------------------------------------------------------------
  // HINDI (hi)
  // -------------------------------------------------------------
  if (lang === 'hi') {
    if (q.includes('osi') || q.includes('नेटवर्क') || q.includes('network') || q.includes('layer')) {
      return [
        {
          id: 1,
          order_index: 1,
          block_type: 'diagram',
          title: 'ओएसआई 7-परत संदर्भ मॉडल: सम्पूर्ण दृश्य संरचना',
          explanation_text:
            'ओएसआई मॉडल कंप्यूटर नेटवर्किंग की रीढ़ है। यह एक लंबवत स्टैक के रूप में 7 अलग-अलग परतों में व्यवस्थित है। सबसे शीर्ष पर परत 7 (एप्लिकेशन परत) है, जहाँ उपयोगकर्ता के वेब ब्राउज़र और ऐप्स कार्य करते हैं। परत 6 (प्रेजेंटेशन परत) डेटा को एन्क्रिप्ट और प्रारूपित करती है। परत 5 (सेशन परत) सक्रिय संचार सत्र को नियंत्रित करती है। परत 4 (ट्रांसपोर्ट परत) टीसीपी और यूडीपी के माध्यम से डेटा को छोटे सेगमेंट्स में तोड़कर सुरक्षित डिलीवरी सुनिश्चित करती है। परत 3 (नेटवर्क परत) आईपी पते के आधार पर रूटिंग करती है। परत 2 (डेटा लिंक परत) मैक पते और फ्रेम का प्रबंधन करती है। सबसे नीचे परत 1 (भौतिक परत) तारों, फाइबर और रेडियो तरंगों के माध्यम से बाइनरी बिट्स (0 और 1) स्थानांतरित करती है।',
        },
        {
          id: 2,
          order_index: 2,
          block_type: 'flowchart',
          title: 'डेटा एनकैप्सुलेशन और ट्रांसमिशन फ़्लोचार्ट',
          explanation_text:
            'चरण-दर-चरण प्रवाह: चरण 1: प्रेषक के कंप्यूटर पर एप्लिकेशन परत डेटा तैयार करती है। चरण 2: नीचे की ओर प्रत्येक परत अपने संबंधित हेडर (जैसे टीसीपी पोर्ट और आईपी पता) को जोड़ती है, जिसे एनकैप्सुलेशन कहते हैं। चरण 3: भौतिक परत पर यह बिट्स बनकर तार या हवा में प्रवाहित होता है। चरण 4: रिसीवर के छोर पर, यह प्रक्रिया उल्टी दिशा में नीचे से ऊपर की ओर होती है (डी-एनकैप्सुलेशन), जहाँ प्रत्येक हेडर की जाँच की जाती है और केवल शुद्ध डेटा एप्लिकेशन को सौंपा जाता है।',
        },
        {
          id: 3,
          order_index: 3,
          block_type: 'text',
          title: 'दैनिक जीवन से सरल उपमा: डाक व्यवस्था',
          explanation_text:
            'ओएसआई मॉडल को एक आधिकारिक पत्र भेजने की तरह समझें। आप पत्र लिखते हैं (एप्लिकेशन परत), उसे गोपनीय कोड में बदलते हैं (प्रेजेंटेशन परत), उस पर रिसीवर का विभाग लिखते हैं (सेशन परत), उसे एक कूरियर पैकेट में रखते हैं (ट्रांसपोर्ट परत), उस पर शहर का पिन कोड और पता लिखते हैं (नेटवर्क परत), उसे डाक वैन में लोड करते हैं (डेटा लिंक परत), और अंत में राष्ट्रीय राजमार्ग सड़क पर वाहन दौड़ता है (भौतिक परत)।',
        },
        {
          id: 4,
          order_index: 4,
          block_type: 'table',
          title: 'मुख्य तुलना: लेयर 2 (डेटा लिंक) बनाम लेयर 4 (ट्रांसपोर्ट)',
          explanation_text:
            'परीक्षा और साक्षात्कार के लिए मुख्य अंतर: डेटा लिंक परत स्थानीय नेटवर्क (LAN) में भौतिक मैक पते का उपयोग करती है और केवल सीधे जुड़े उपकरणों के बीच काम करती है। दूसरी ओर, ट्रांसपोर्ट परत विश्व भर में स्थित अंतिम एप्लिकेशन प्रोग्रामों के बीच पोर्ट नंबर (जैसे 80 या 443) का उपयोग करके एंड-टू-एंड विश्वसनीय डेटा प्रवाह की गारंटी देती है।',
        },
      ];
    }

    if (q.includes('flowchart') || q.includes('फ़्लोचार्ट') || q.includes('tcp') || q.includes('handshake')) {
      return [
        {
          id: 1,
          order_index: 1,
          block_type: 'flowchart',
          title: 'टीसीपी 3-वे हैंडशेक: कनेक्शन स्थापना फ़्लोचार्ट',
          explanation_text:
            'टीसीपी एक कनेक्शन-उन्मुख प्रोटोकॉल है जो डेटा भेजने से पहले दोनों सिरों पर पूर्ण सहमति सुनिश्चित करता है। चरण 1 (SYN): क्लाइंट सर्वर को एक सिंक्रोनाइज़ेशन संदेश भेजता है जिसमें एक प्रारंभिक क्रम संख्या होती है। चरण 2 (SYN-ACK): सर्वर अनुरोध स्वीकार करता है और अपनी स्वयं की क्रम संख्या के साथ पावती भेजता है। चरण 3 (ACK): क्लाइंट सर्वर की पावती की पुष्टि करता है। इस तीसरे चरण के पूरा होते ही एक सुरक्षित और विश्वसनीय संचार चैनल खुल जाता है।',
        },
        {
          id: 2,
          order_index: 2,
          block_type: 'diagram',
          title: 'पैकेट प्रवाह और समय अनुक्रम आरेख',
          explanation_text:
            'दृश्य आरेख में दो ऊर्ध्वाधर समय-रेखाएँ हैं: बायीं ओर क्लाइंट और दायीं ओर सर्वर। तीन कोणीय तीर क्रम से आगे बढ़ते हैं: पहला तीर बाएँ से दाएँ (SYN), दूसरा तीर दाएँ से बाएँ (SYN-ACK), और तीसरा तीर फिर बाएँ से दाएँ (ACK)। यह त्रिकोणीय संवाद पुष्टि करता है कि दोनों दिशाओं में नेटवर्क पूरी तरह चालू है।',
        },
        {
          id: 3,
          order_index: 3,
          block_type: 'text',
          title: 'सरल उपमा: दो मित्रों का फ़ोन संवाद',
          explanation_text:
            'इसे एक टेलीफ़ोन कॉल की शुरुआत की तरह समझें: क्लाइंट कहता है, "नमस्ते, क्या आप मेरी आवाज़ सुन सकते हैं?" (SYN)। सर्वर उत्तर देता है, "हाँ, मैं सुन सकता हूँ, क्या आप मुझे सुन पा रहे हैं?" (SYN-ACK)। अंत में क्लाइंट कहता है, "हाँ, मैं भी आपको स्पष्ट सुन रहा हूँ, अब बात शुरू करते हैं" (ACK)। यह दोनों पक्षों की तैयारी की पुष्टि करता है।',
        },
        {
          id: 4,
          order_index: 4,
          block_type: 'table',
          title: 'तुलनात्मक विश्लेषण: टीसीपी बनाम यूडीपी',
          explanation_text:
            'टीसीपी गारंटीकृत डिलीवरी और त्रुटि सुधार प्रदान करता है, इसलिए यह वेब ब्राउज़िंग और फ़ाइल डाउनलोड के लिए अनिवार्य है। इसके विपरीत, यूडीपी में कोई हैंडशेक नहीं होता; यह सीधा डेटा भेजता है, जिससे यह लाइव वीडियो स्ट्रीमिंग और ऑनलाइन गेमिंग के लिए अत्यधिक तेज़ है।',
        },
      ];
    }

    if (q.includes('search') || q.includes('खोज') || q.includes('binary') || q.includes('sort') || q.includes('algorithm')) {
      return [
        {
          id: 1,
          order_index: 1,
          block_type: 'diagram',
          title: 'बाइनरी सर्च ट्री: दृश्य संरचना और विभाजन',
          explanation_text:
            'बाइनरी सर्च एक क्रमित (सॉर्टेड) सूची में किसी तत्व को खोजने की सबसे तेज़ विधि है। आरेख में एक वृक्ष संरचना दिखती है जहाँ शीर्ष पर रूट नोड (जैसे 50) है। बाइनरी सर्च का स्वर्णिम नियम यह है कि रूट से छोटे सभी तत्व बायीं ओर (जैसे 30, 20, 40) और रूट से बड़े सभी तत्व दायीं ओर (जैसे 70, 60, 80) रखे जाते हैं। प्रत्येक तुलना के साथ आधी सूची तुरंत छोड़ दी जाती है।',
        },
        {
          id: 2,
          order_index: 2,
          block_type: 'flowchart',
          title: 'चरण-दर-चरण बाइनरी सर्च फ़्लोचार्ट',
          explanation_text:
            'फ़्लोचार्ट पथ: चरण 1: सूची के सबसे बाएँ (L) और सबसे दाएँ (R) छोर को चिह्नित करें। चरण 2: मध्य तत्व की गणना करें, Mid = (L + R) / 2। चरण 3: निर्णय डायमंड - क्या खोजा जाने वाला तत्व Mid के बराबर है? यदि हाँ, तो तत्व मिल गया और खोज समाप्त। यदि तत्व Mid से छोटा है, तो दायीं आधी सूची को त्यागें और बायीं ओर खोजें (R = Mid - 1)। यदि बड़ा है, तो बायीं आधी सूची त्यागें और दायीं ओर खोजें (L = Mid + 1)।',
        },
        {
          id: 3,
          order_index: 3,
          block_type: 'text',
          title: 'सरल उपमा: शब्दकोश में शब्द ढूँढना',
          explanation_text:
            'सोचिए कि आप एक मोटे शब्दकोश में शब्द ढूँढ रहे हैं। आप पहले पन्ने से एक-एक शब्द नहीं पढ़ते। आप सीधे किताब को बीच से खोलते हैं। यदि आपका शब्द बीच के अक्षर से आगे का है, तो आप पूरे पहले आधे हिस्से को छोड़ देते हैं और केवल पिछले आधे में फिर से बीच में खोलते हैं। इस प्रकार 1000 पन्नों में भी आप मात्र 10 प्रयासों में शब्द ढूँढ लेते हैं।',
        },
        {
          id: 4,
          order_index: 4,
          block_type: 'formula',
          title: 'समय जटिलता सूत्र: टी(एन) = ओ(लॉग एन)',
          explanation_text:
            'बाइनरी सर्च की समय जटिलता O(log₂ N) है। इसका अर्थ है कि यदि डेटा दोगुना हो जाए, तो भी केवल एक अतिरिक्त कदम लगता है। 10 लाख तत्वों में किसी संख्या को ढूँढने के लिए लीनियर सर्च में 10 लाख बार देखना पड़ सकता है, जबकि बाइनरी सर्च में अधिकतम 20 चरणों में परिणाम मिल जाता है।',
        },
      ];
    }

    if (q.includes('newton') || q.includes('गति') || q.includes('बल') || q.includes('physics') || q.includes('force')) {
      return [
        {
          id: 1,
          order_index: 1,
          block_type: 'formula',
          title: 'न्यूटन का गति का दूसरा नियम: एफ़ = एम • ए',
          explanation_text:
            'न्यूटन का दूसरा नियम भौतिकी के सबसे महत्वपूर्ण नियमों में से एक है: शुद्ध बल (F) वस्तु के द्रव्यमान (m) और उसमें उत्पन्न त्वरण (a) के गुणनफल के बराबर होता है। सूत्र है: F = m • a। बल की इकाई न्यूटन है, द्रव्यमान किलोग्राम में और त्वरण मीटर प्रति सेकंड वर्ग में मापा जाता है।',
        },
        {
          id: 2,
          order_index: 2,
          block_type: 'diagram',
          title: 'दृश्य बल और त्वरण वेक्टर आरेख',
          explanation_text:
            'आरेख में एक क्षैतिज सतह पर द्रव्यमान (m) का एक ब्लॉक रखा गया है। जब बायीं ओर से दायीं ओर बल का तीर (F) लगाया जाता है, तो ब्लॉक पर उसी दिशा में त्वरण (a) उत्पन्न होता है। यदि द्रव्यमान भारी है तो समान बल लगाने पर त्वरण कम होगा; यदि द्रव्यमान हल्का है तो त्वरण बहुत अधिक होगा।',
        },
        {
          id: 3,
          order_index: 3,
          block_type: 'flowchart',
          title: 'गतिशीलता और संतुलन निर्णय फ़्लोचार्ट',
          explanation_text:
            'फ़्लोचार्ट निर्णय तर्क: चरण 1: वस्तु पर लगने वाले सभी बाहरी बलों का योग (शुद्ध बल) निकालें। चरण 2: निर्णय डायमंड - क्या शुद्ध बल शून्य से अधिक है? यदि नहीं, तो वस्तु अपनी वर्तमान अवस्था में स्थिर या निरंतर गति में रहेगी। यदि हाँ, तो वस्तु में तात्कालिक त्वरण उत्पन्न होगा जिसकी गणना a = F / m सूत्र से होगी।',
        },
        {
          id: 4,
          order_index: 4,
          block_type: 'text',
          title: 'दैनिक जीवन से सरल उदाहरण: खरीदारी की ट्रॉली',
          explanation_text:
            'सुपरमार्केट की एक खाली ट्रॉली को धक्का देना बहुत आसान होता है क्योंकि उसका द्रव्यमान कम होता है, इसलिए थोड़े से बल से भी वह तेज़ी से आगे बढ़ती है। लेकिन जब ट्रॉली सामान से पूरी भर जाती है (भारी द्रव्यमान), तो उसे उसी गति से चलाने के लिए आपको बहुत अधिक बल लगाना पड़ता है। यही F = m • a है।',
        },
      ];
    }

    // Default General Hindi Explainer
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: `दृश्य संरचना और रूपरेखा: ${query}`,
        explanation_text:
          'यह आरेख विषय की सम्पूर्ण संरचना को स्पष्ट करता है। इसमें मुख्य प्रणाली को तीन प्रमुख स्तरों में विभाजित किया गया है: इनपुट स्तर जहाँ आवश्यकताएँ आती हैं, प्रसंस्करण स्तर जहाँ मुख्य गणना या तर्क लागू होता है, और परिणाम स्तर जहाँ अंतिम आउटपुट प्रदर्शित होता है। सभी घटक सुव्यवस्थित तीरों द्वारा जुड़े हैं।',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: `चरण-दर-चरण कार्यप्रणाली फ़्लोचार्ट: ${query}`,
        explanation_text:
          'कार्यप्रणाली का चरणबद्ध प्रवाह: चरण 1: आरंभ और इनपुट सत्यापन। चरण 2: निर्णय डायमंड - मुख्य शर्त की जाँच। यदि शर्त पूरी होती है तो सकारात्मक पथ पर आगे बढ़ें; यदि अधूरी है तो वैकल्पिक समाधान की ओर पुनर्निर्देशित हों। चरण 3: डेटा निष्पादन और अंतिम स्थिति का निर्धारण। चरण 4: अंतिम परिणाम प्रस्तुत करना और चक्र पूर्ण करना।',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'दैनिक जीवन से सरल उदाहरण और मानसिक मॉडल',
        explanation_text:
          'इस अवधारणा को एक स्वचालित आधुनिक रसोई की तरह समझें। इनपुट आपकी सामग्री है, नुस्खा (रेसिपी) आपका फ़्लोचार्ट है, और तैयार स्वादिष्ट व्यंजन आपका आउटपुट है। जब तक आप चरण-दर-चरण क्रम का पालन करते हैं, परिणाम हमेशा सटीक और सफल रहता है।',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'परीक्षा और साक्षात्कार के लिए मुख्य बिंदु',
        explanation_text:
          'याद रखने योग्य तीन मुख्य बिंदु: पहला, इनपुट और आउटपुट के बीच का संबंध हमेशा तार्किक नियमों पर आधारित होता है। दूसरा, प्रत्येक मॉड्यूल का अपना स्वतंत्र उत्तरदायित्व होता है। तीसरा, बाधाओं और त्रुटियों से बचने के लिए सत्यापन चरण अत्यंत आवश्यक है।',
      },
    ];
  }

  // -------------------------------------------------------------
  // MALAYALAM (ml)
  // -------------------------------------------------------------
  if (lang === 'ml') {
    if (q.includes('osi') || q.includes('network') || q.includes('നെറ്റ്‌വർക്ക്') || q.includes('layer')) {
      return [
        {
          id: 1,
          order_index: 1,
          block_type: 'diagram',
          title: 'ഒ.എസ്.ഐ 7-ലെയർ റഫറൻസ് മോഡൽ: ഘടനാപരമായ രൂപരേഖ',
          explanation_text:
            'കമ്പ്യൂട്ടർ നെറ്റ്‌വർക്കിംഗിലെ ഏഴ് ലെയറുകളെ പ്രതിനിധീകരിക്കുന്ന ലംബമായ ഘടനയാണിത്. ഏറ്റവും മുകളിൽ ലെയർ 7 ആപ്ലിക്കേഷൻ ലെയർ (ബ്രൗസറുകളും ആപ്പുകളും). താഴെ ലെയർ 6 പ്രസന്റേഷൻ ലെയർ (ഡാറ്റാ എൻക്രിപ്ഷനും ഫോർമാറ്റിംഗും). ലെയർ 5 സെഷൻ ലെയർ (കണക്ഷൻ നിയന്ത്രണം). ലെയർ 4 ട്രാൻസ്പോർട്ട് ലെയർ (ടിസിപി/യുഡിപി വഴി ഡാറ്റ കൃത്യമായി എത്തിക്കൽ). ലെയർ 3 നെറ്റ്‌വർക്ക് ലെയർ (ഐപി റൂട്ടിംഗ്). ലെയർ 2 ഡാറ്റാ ലിങ്ക് ലെയർ (മാക് വിലാസങ്ങൾ). ഏറ്റവും താഴെ ലെയർ 1 ഫിസിക്കൽ ലെയർ (കേബിളുകൾ, ഫൈബർ, റേഡിയോ തരംഗങ്ങൾ എന്നിവയിലൂടെയുള്ള ബിറ്റുകൾ).',
        },
        {
          id: 2,
          order_index: 2,
          block_type: 'flowchart',
          title: 'ഡാറ്റാ എൻക്യാപ്സുലേഷൻ ഫ്ലോചാർട്ട്',
          explanation_text:
            'ഘട്ടം ഘട്ടമായുള്ള പ്രക്രിയ: ഘട്ടം 1: ആപ്ലിക്കേഷൻ ലെയറിൽ ഡാറ്റ തയ്യാറാക്കുന്നു. ഘട്ടം 2: താഴേക്ക് പോകുന്തോറും ഓരോ ലെയറും ഹെഡറുകൾ ചേർക്കുന്നു (എൻക്യാപ്സുലേഷൻ). ഘട്ടം 3: ഫിസിക്കൽ ലെയറിലൂടെ സിഗ്നലുകളായി ലക്ഷ്യസ്ഥാനത്തേക്ക് അയക്കുന്നു. ഘട്ടം 4: സ്വീകരിക്കുന്ന കമ്പ്യൂട്ടറിൽ താഴെ നിന്ന് മുകളിലേക്ക് ഹെഡറുകൾ ഓരോന്നായി പരിശോധിച്ച് നീക്കം ചെയ്യുന്നു (ഡീ-എൻക്യാപ്സുലേഷൻ).',
        },
        {
          id: 3,
          order_index: 3,
          block_type: 'text',
          title: 'ലളിതമായ ഉദാഹരണം: തപാൽ സംവിധാനം',
          explanation_text:
            'ഒരു കത്ത് അയക്കുന്നത് പോലെ ചിന്തിക്കുക: നിങ്ങൾ കത്തെഴുതുന്നു (ആപ്ലിക്കേഷൻ), കവറിലിടുന്നു (പ്രസന്റേഷൻ), ലക്ഷ്യസ്ഥാനത്തിന്റെ വിലാസവും പിൻകോഡും എഴുതുന്നു (നെറ്റ്‌വർക്ക്), പോസ്റ്റ് വണ്ടിയിൽ കയറ്റുന്നു (ഡാറ്റ ലിങ്ക്), റോഡിലൂടെ വണ്ടി സഞ്ചരിക്കുന്നു (ഫിസിക്കൽ). ഓരോ ഘട്ടത്തിലും സുരക്ഷിതത്വം ഉറപ്പാക്കുന്നു.',
        },
        {
          id: 4,
          order_index: 4,
          block_type: 'table',
          title: 'താരതമ്യം: ലെയർ 2 (ഡാറ്റ ലിങ്ക്) vs ലെയർ 4 (ട്രാൻസ്പോർട്ട്)',
          explanation_text:
            'ഡാറ്റാ ലിങ്ക് ലെയർ ലോക്കൽ നെറ്റ്‌വർക്കിൽ ഹാർഡ്‌വെയർ മാക് വിലാസങ്ങൾ ഉപയോഗിച്ച് അടുത്തുള്ള ഉപകരണങ്ങളിലേക്ക് ഡാറ്റ നൽകുന്നു. ട്രാൻസ്പോർട്ട് ലെയർ ഇന്റർനെറ്റിലൂടെ വിദൂരത്തുള്ള ആപ്ലിക്കേഷനുകൾ തമ്മിൽ പോർട്ട് നമ്പറുകൾ ഉപയോഗിച്ച് സുരക്ഷിതമായ എൻഡ്-ടു-എൻഡ് കണക്ഷൻ ഉറപ്പാക്കുന്നു.',
        },
      ];
    }

    if (q.includes('flowchart') || q.includes('ഫ്ലോചാർട്ട്') || q.includes('tcp') || q.includes('handshake')) {
      return [
        {
          id: 1,
          order_index: 1,
          block_type: 'flowchart',
          title: 'ടിസിപി 3-വേ ഹാൻഡ്ഷേക്ക് ഫ്ലോചാർട്ട്',
          explanation_text:
            'ഘട്ടം ഘട്ടമായുള്ള കണക്ഷൻ പ്രക്രിയ: ഘട്ടം 1 (SYN): ക്ലയന്റ് സെർവറിലേക്ക് ഒരു കണക്ഷൻ അഭ്യർത്ഥനയും ക്രമനമ്പറും അയക്കുന്നു. ഘട്ടം 2 (SYN-ACK): സെർവർ അത് സ്വീകരിച്ച് സ്വന്തം ക്രമനമ്പറോടൊപ്പം മറുപടി അയക്കുന്നു. ഘട്ടം 3 (ACK): ക്ലയന്റ് സെർവറിന്റെ മറുപടി സ്ഥിരീകരിക്കുന്നു. ഇതോടെ സുരക്ഷിതമായ ഡാറ്റാ ചാനൽ നിലവിൽ വരുന്നു.',
        },
        {
          id: 2,
          order_index: 2,
          block_type: 'diagram',
          title: 'പാക്കറ്റ് കൈമാറ്റ ടൈംലൈൻ ഡയഗ്രം',
          explanation_text:
            'ഇടതുവശത്ത് ക്ലയന്റും വലതുവശത്ത് സെർവറുമുള്ള ഡയഗ്രത്തിൽ മൂന്ന് അമ്പടയാളങ്ങൾ കാണാം. ആദ്യ അമ്പടയാളം ഇടത്തുനിന്ന് വലത്തോട്ട് (SYN), രണ്ടാമത്തേത് വലത്തുനിന്ന് ഇടത്തോട്ട് (SYN-ACK), മൂന്നാമത്തേത് വീണ്ടും ഇടത്തുനിന്ന് വലത്തോട്ട് (ACK). രണ്ടുപേരും തയ്യാറാണെന്ന് ഈ സംഭാഷണം ഉറപ്പാക്കുന്നു.',
        },
        {
          id: 3,
          order_index: 3,
          block_type: 'text',
          title: 'ലളിതമായ ജീവിത ഉദാഹരണം: ഫോൺ വിളി',
          explanation_text:
            'ഒരു ഫോൺ കോൾ എടുക്കുമ്പോൾ: "ഹലോ കേൾക്കാമോ?" എന്ന് ചോദിക്കുന്നു (SYN). മറുപടി: "അതെ കേൾക്കാം, ഞാൻ പറയുന്നത് കേൾക്കുന്നുണ്ടോ?" (SYN-ACK). "അതെ വ്യക്തമായി കേൾക്കുന്നു, നമുക്ക് സംസാരിക്കാം" (ACK). ഇതിലൂടെ ആശയവിനിമയ തടസ്സമില്ലെന്ന് ഉറപ്പുവരുത്തുന്നു.',
        },
        {
          id: 4,
          order_index: 4,
          block_type: 'table',
          title: 'താരതമ്യം: ടിസിപി vs യുഡിപി',
          explanation_text:
            'ടിസിപിയിൽ ഓരോ പാക്കറ്റിനും രസീത് നിർബന്ധമാണ്, അതുകൊണ്ട് വെബ്സൈറ്റുകൾക്കും ഫയലുകൾക്കും ടിസിപി ഉപയോഗിക്കുന്നു. യുഡിപിയിൽ മുൻകൂർ ഹാൻഡ്ഷേക്ക് ഇല്ലാത്തതിനാൽ തത്സമയ വീഡിയോ കോളിംഗിനും ഗെയിമിംഗിനും അതിവേഗം ഡാറ്റ അയക്കാൻ യുഡിപി അനുയോജ്യമാണ്.',
        },
      ];
    }

    // Default General Malayalam Explainer
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: `ഘടനാപരമായ ഡയഗ്രം: ${query}`,
        explanation_text:
          'ഈ ഡയഗ്രം സിസ്റ്റത്തിന്റെ പ്രധാന ഘടകങ്ങളെയും അവ തമ്മിലുള്ള ബന്ധങ്ങളെയും കാണിക്കുന്നു. ഇൻപുട്ട് തലം, പ്രോസസ്സിംഗ് തലം, സ്റ്റോറേജ് തലം എന്നിവ ക്രമമായി ക്രമീകരിച്ചിരിക്കുന്നു. ഡാറ്റ സുഗമമായി ഒഴുകാൻ സഹായിക്കുന്ന അമ്പടയാളങ്ങൾ ഇതിലുണ്ട്.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: `ഘട്ടം ഘട്ടമായുള്ള ഫ്ലോചാർട്ട്: ${query}`,
        explanation_text:
          'പ്രവർത്തന പ്രക്രിയ: ഘട്ടം 1: തുടക്കം - വിവരങ്ങൾ സ്വീകരിക്കുന്നു. ഘട്ടം 2: തീരുമാന ഡയമണ്ട് - നിബന്ധന ശരിയാണോ എന്ന് പരിശോധിക്കുന്നു. ശരിയാണെങ്കിൽ വിജയ പാതയിലൂടെ നീങ്ങുന്നു; തെറ്റാണെങ്കിൽ തിരുത്തൽ പാതയിലേക്ക് തിരിയുന്നു. ഘട്ടം 3: പൂർത്തീകരണം - ഫലം നൽകുന്നു.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'ലളിതമായ ഉദാഹരണവും ആശയവും',
        explanation_text:
          'ഒരു സ്മാർട്ട് അടുക്കള പോലെ ഈ പ്രക്രിയയെ സങ്കൽപ്പിക്കുക. ചേരുവകൾ ഇൻപുട്ടാണ്, പാചകക്കുറിപ്പ് ഫ്ലോചാർട്ടാണ്, രുചികരമായ ഭക്ഷണം ഔട്ട്പുട്ടാണ്. ഓരോ ഘട്ടവും കൃത്യമായി പിന്തുടരുമ്പോൾ മികച്ച ഫലം ലഭിക്കുന്നു.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'പ്രധാന പരീക്ഷാ പോയിന്റുകൾ',
        explanation_text:
          'ഓർക്കേണ്ട പ്രധാന കാര്യങ്ങൾ: ഓരോ ഘടകത്തിനും പ്രത്യേക ചുമതലയുണ്ട്. തടസ്സങ്ങൾ ഒഴിവാക്കാൻ മുൻകൂർ പരിശോധന അത്യാവശ്യമാണ്. തത്വങ്ങൾ കൃത്യമായി പാലിച്ചാൽ സിസ്റ്റം സുരക്ഷിതമായി നിലനിൽക്കും.',
      },
    ];
  }

  // -------------------------------------------------------------
  // TAMIL (ta)
  // -------------------------------------------------------------
  if (lang === 'ta') {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: `கட்டமைப்பு வரைபடம்: ${query}`,
        explanation_text:
          'இந்த வரைபடம் கணினி கட்டமைப்பின் முழுமையான அடுக்கைக் காட்டுகிறது. மேல் அடுக்கு பயனரின் கோரிக்கைகளைப் பெறுகிறது. நடு அடுக்கு கணக்கீடுகளைச் செய்கிறது. கீழ் அடுக்கு தகவல்களைப் பாதுகாப்பாகச் சேமிக்கிறது. அம்பு குறிகள் தரவு பாயும் திசையைக் குறிக்கின்றன.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: `படி-படி பாய்வுப்படம் (Flowchart): ${query}`,
        explanation_text:
          'படி 1: தொடக்கம் - உள்ளீட்டுத் தகவலைச் சரிபார்த்தல். படி 2: முடிவு வைரம் - நிபந்தனை பூர்த்தியாகிறதா என ஆய்வு செய்தல். ஆம் எனில், அடுத்த செயல்முறைக்குச் செல்லவும்; இல்லை எனில், எச்சரிக்கை செய்தி காட்டி வழியை மாற்றவும். படி 3: இறுதி முடிவை வெற்றிகரமாக வழங்குதல்.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'எளிய நடைமுறை உதாரணம்',
        explanation_text:
          'ரயில்வே சந்திப்பில் உள்ள பாதை மாற்றி (டிராக் சுவிட்ச்) போல இதை நினையுங்கள். பச்சை சிக்னல் கிடைத்தால் ரயில் நேராக இலக்கை அடைகிறது. சிவப்பு சிக்னல் எனில் மாற்றுப் பாதையில் பாதுகாப்பாக நிறுத்தப்படுகிறது.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'முக்கிய ஒப்பீட்டு அட்டவணை',
        explanation_text:
          'தேர்வுக்கான முக்கிய குறிப்புகள்: உள்ளீடும் வெளியீடும் நேரடித் தொடர்புடையவை. ஒவ்வொரு தொகுதிக்கும் தனித்தனி பொறுப்புகள் உள்ளன. பிழைகளைக் குறைக்க சரிபார்த்தல் படி மிகவும் அவசியமானது.',
      },
    ];
  }

  // -------------------------------------------------------------
  // TELUGU (te)
  // -------------------------------------------------------------
  if (lang === 'te') {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: `ఆర్కిటెక్చర్ రేఖాచిత్రం: ${query}`,
        explanation_text:
          'ఈ రేఖాచిత్రం వ్యవస్థ యొక్క పూర్తి నిర్మాణాన్ని వివరిస్తుంది. పై భాగం వినియోగదారు అభ్యర్థనలను స్వీకరిస్తుంది, మధ్య భాగం విశ్లేషణను చేస్తుంది, క్రింది భాగం డేటాను సురక్షితంగా నిల్వ చేస్తుంది. బాణపు గుర్తులు డేటా ప్రవాహాన్ని స్పష్టంగా చూపుతాయి.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: `దశలవారీ ఫ్లోచార్ట్: ${query}`,
        explanation_text:
          'దశ 1: ప్రారంభం మరియు ఇన్పుట్ తనిఖీ. దశ 2: నిర్ణయ డైమండ్ - షరతు సరిగ్గా ఉందో లేదో నిర్ధారించడం. అవును అయితే విజయవంతమైన మార్గంలో సాగండి; కాకపోతే ప్రత్యామ్నాయ మార్గాన్ని ఎంచుకోండి. దశ 3: తుది ఫలితాన్ని అందించడం.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'నిజ జీవిత ఉదాహరణ మరియు భావన',
        explanation_text:
          'రైల్వే ట్రాక్ స్విచ్ వంటిది ఇది. సిగ్నల్ ఆకుపచ్చగా ఉంటే రైలు నేరుగా ముందుకు వెళుతుంది; ఎరుపుగా ఉంటే సురక్షితమైన లూప్ లైన్‌కు మళ్లించబడుతుంది.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'పరీక్షా ముఖ్యాంశాలు',
        explanation_text:
          'గుర్తుంచుకోవలసిన విషయాలు: ప్రతి భాగానికి నిర్దిష్టమైన పని ఉంటుంది. ఇన్పుట్ మరియు అవుట్పుట్ మధ్య సంబంధం క్రమబద్ధంగా ఉంటుంది. లోపాలను సరిదిద్దడానికి దశలవారీ తనిఖీ ముఖ్యం.',
      },
    ];
  }

  // -------------------------------------------------------------
  // BENGALI (bn)
  // -------------------------------------------------------------
  if (lang === 'bn') {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: `আর্কিটেকচার ডায়াগ্রাম: ${query}`,
        explanation_text:
          'এই চিত্রটি কাঠামোগত স্তরগুলিকে সুন্দরভাবে উপস্থাপন করে। শীর্ষ স্তর অনুরোধ গ্রহণ করে, মধ্য স্তর যুক্তিসঙ্গত প্রক্রিয়াকরণ পরিচালনা করে এবং নিম্ন স্তর তথ্য সংরক্ষণ করে। সংযোগকারী তীরগুলি তথ্যের প্রবাহ নির্দেশ করে।',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: `ধাপে ধাপে ফ্লোচার্ট: ${query}`,
        explanation_text:
          'ধাপ ১: শুরু এবং ইনপুট যাচাই। ধাপ ২: সিদ্ধান্ত ডায়মন্ড - শর্তটি পূরণ হয়েছে কিনা তা পরীক্ষা করা। হ্যাঁ হলে পরবর্তী পদক্ষেপে যান; না হলে সতর্কতা দেখিয়ে থামুন। ধাপ ৩: ফলাফল প্রদান এবং প্রক্রিয়া সমাপ্তি।',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'সহজ বাস্তব উদাহরণ',
        explanation_text:
          'রেল লাইনের জংশনের কথা ভাবুন। সবুজ সংকেত পেলে ট্রেন সোজা গন্তব্যে চলে যায়, আর লাল সংকেত পেলে নিরাপদে পাশের লাইনে থামে।',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'পরীক্ষার জন্য গুরুত্বপূর্ণ পয়েন্ট',
        explanation_text:
          'স্মরণ রাখার বিষয়: প্রতিটি উপাদানের স্বাধীন কাজ রয়েছে। ধারাবাহিক প্রবাহ এবং সঠিক যাচাইকরণ যেকোনো সিস্টেমকে দ্রুত এবং নিরাপদ রাখে।',
      },
    ];
  }

  // -------------------------------------------------------------
  // MARATHI (mr)
  // -------------------------------------------------------------
  if (lang === 'mr') {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: `रचनात्मक आकृती: ${query}`,
        explanation_text:
          'ही आकृती संपूर्ण रचनेची स्पष्ट मांडणी दर्शवते. वरचा स्तर विनंत्या स्वीकारतो, मधला स्तर विचारपूर्वक प्रक्रिया करतो आणि खालचा स्तर माहिती सुरक्षित ठेवतो. बाणांद्वारे डेटाचा योग्य मार्ग दाखवला आहे.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: `टप्प्याटप्प्याने फ्लोचार्ट: ${query}`,
        explanation_text:
          'टप्पा १: प्रारंभ आणि इनपुट तपासणी. टप्पा २: निर्णय चौकोन - मुख्य अट पूर्ण आहे का ते पाहणे. होय असल्यास पुढे जा; नाही असल्यास पर्यायी मार्गाने सुरक्षितपणे वळा. टप्पा ३: अंतिम निकाल देणे आणि प्रक्रिया समाप्त करणे.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'सोपे दैनंदिन उदाहरण',
        explanation_text:
          'रेल्वे ट्रॅकच्या स्विचसारखे हे कार्य करते. हिरवा सिग्नल असल्यास गाडी थेट पुढे निघून जाते, आणि लाल सिग्नल असल्यास थांबून सुरक्षित मार्ग स्वीकारते.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'परीक्षेसाठी निष्कर्ष',
        explanation_text:
          'महत्त्वाचे मुद्दे: प्रत्येक घटकाची जबाबदारी निश्चित असते. नियमांचे काटेकोर पालन केल्याने प्रणालीमध्ये त्रुटी राहत नाहीत.',
      },
    ];
  }

  // -------------------------------------------------------------
  // SPANISH (es)
  // -------------------------------------------------------------
  if (lang === 'es') {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: `Diagrama de Arquitectura: ${query}`,
        explanation_text:
          'Este diagrama ilustra la estructura modular completa. De arriba a abajo, la capa de presentación recibe las solicitudes, la capa lógica ejecuta los cálculos de forma inteligente y la capa de almacenamiento resguarda la información de forma segura.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: `Diagrama de Flujo Paso a Paso: ${query}`,
        explanation_text:
          'Paso 1: Inicio e ingesta de datos. Paso 2: Rombo de decisión: evaluar la condición objetivo. Si es afirmativa, avanzar al procesamiento principal; si no, redirigir al manejo de errores. Paso 3: Retornar el resultado exitoso.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'Analogía del Mundo Real',
        explanation_text:
          'Imagina el desvío de una vía de tren: con semáforo en verde el tren continúa veloz a su estación final; con semáforo en rojo toma la vía de espera segura.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'Puntos Clave para Exámenes',
        explanation_text:
          'Aspectos fundamentales: cada componente tiene una responsabilidad bien delimitada y la validación en cada paso garantiza la robustez del sistema.',
      },
    ];
  }

  // -------------------------------------------------------------
  // ENGLISH (en-IN / en-US / Default)
  // -------------------------------------------------------------
  if (q.includes('osi') || q.includes('network') || q.includes('layer') || q.includes('encapsulation')) {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: 'The 7-Layer OSI Reference Model: Visual Architecture',
        explanation_text:
          'The Open Systems Interconnection (OSI) model organizes computer networking into a vertical stack of seven distinct layers. At the very top sits Layer 7, the Application layer, where web browsers, email clients, and user programs interface with the network. Layer 6 (Presentation) handles data encryption, SSL/TLS, and character formatting. Layer 5 (Session) establishes and synchronizes active dialogues. Layer 4 (Transport) guarantees reliable delivery across endpoints using TCP segments or UDP datagrams. Layer 3 (Network) routes packets across the global internet using logical IP addresses. Layer 2 (Data Link) handles local framing and hardware MAC addresses. Layer 1 (Physical) transmits raw binary electrical pulses, fiber-optic light, and radio frequencies.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: 'Data Encapsulation & Transmission Flowchart',
        explanation_text:
          'Step-by-step pipeline: Step 1: User generates data in the Application layer. Step 2: The data descends through the layers, with each layer wrapping the payload inside its own control metadata called a header. This process is called encapsulation. Step 3: At the physical layer, the packet is serialized into binary bits (0s and 1s) and transmitted across physical cables or wireless air. Step 4: Upon reaching the destination host, the reverse process (de-encapsulation) occurs: each layer inspects and peels off its header until only the clean original payload reaches the recipient application.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'Intuitive Analogy: Sending a Certified Postal Letter',
        explanation_text:
          'Think of sending an official letter. You write your message on paper (Application), translate it into English (Presentation), write the recipient department (Session), slide it into a protective envelope (Transport), write the recipient street address and postal zip code on the front (Network), load it into a local courier mail truck (Data Link), and finally drive along physical asphalt highways across the nation (Physical). Each envelope level ensures the message navigates smoothly without tampering.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'Comparison Matrix: Layer 2 (Data Link) vs Layer 4 (Transport)',
        explanation_text:
          'Critical differences for exams and interviews: Data Link operates strictly within a single local area network (LAN) using 48-bit hardware MAC addresses to move frames between adjacent switches and routers. Transport operates globally between end-to-end applications across the entire internet using 16-bit Port numbers (such as port 80 for HTTP and 443 for HTTPS) to guarantee ordered, lossless byte delivery.',
      },
    ];
  }

  if (q.includes('flowchart') || q.includes('tcp') || q.includes('handshake')) {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'flowchart',
        title: 'TCP 3-Way Handshake: Step-by-Step Connection Flowchart',
        explanation_text:
          'TCP is a connection-oriented transport protocol that guarantees zero packet loss. Before transmitting any actual payload, it synchronizes sequence numbers through three distinct steps. Step 1 (SYN): The client sends a synchronization packet containing an Initial Sequence Number (ISN) to notify the server that it wants to connect. Step 2 (SYN-ACK): The server receives the request, acknowledges it, and replies with its own synchronization sequence number. Step 3 (ACK): The client acknowledges the server sequence. The connection is now established, and reliable two-way data streaming commences.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'diagram',
        title: 'Packet Sequence Timing Diagram',
        explanation_text:
          'The visual timing diagram depicts two vertical parallel timelines representing the Client on the left and the Server on the right. Three angled directional arrows illustrate the sequential exchange: first arrow travels diagonally downward from Client to Server labeled SYN; second arrow returns from Server to Client labeled SYN-ACK; third arrow travels from Client to Server labeled ACK. Once the third arrow lands, both state machines transition to the ESTABLISHED status.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'Real-World Metaphor: Two Walkie-Talkie Operators',
        explanation_text:
          'Imagine two radio operators establishing communication: Operator 1 presses the button and says: "Base station, do you copy me? Over" (SYN). Base station replies: "Loud and clear Operator 1, can you hear me? Over" (SYN-ACK). Operator 1 confirms: "Yes, I hear you perfectly, proceeding with mission report" (ACK). This ensures neither party talks into a dead microphone.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'table',
        title: 'Protocol Comparison: TCP vs UDP',
        explanation_text:
          'TCP requires connection setup via the 3-way handshake, ensures guaranteed packet delivery, and retransmits lost packets; it powers web browsing, banking, and file transfers. UDP is completely connectionless (fire-and-forget) with zero handshake overhead, making it ideal for real-time voice calls, live video broadcasts, and competitive multiplayer games.',
      },
    ];
  }

  if (q.includes('binary search') || q.includes('search') || q.includes('algorithm') || q.includes('tree')) {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: 'Binary Search Tree (BST): Visual Node Hierarchy',
        explanation_text:
          'Binary search operates on sorted datasets by repeatedly dividing the search interval in half. The visual tree structure displays a central Root Node (value 50). The core mathematical property of a Binary Search Tree dictates that every element in the left subtree has a key strictly less than the root (such as 30, 20, 40), while every element in the right subtree has a key strictly greater than the root (such as 70, 60, 80). With each single comparison, half of the entire search space is discarded.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: 'Algorithmic Decision Path Flowchart',
        explanation_text:
          'Execution steps: Step 1: Set left pointer L = 0 and right pointer R = N - 1. Step 2: Compute Midpoint index Mid = (L + R) / 2. Step 3: Decision Diamond - Does the target value match the element at Mid? If YES, the item is found; return the index immediately. If the target is LESS than the midpoint value, eliminate the entire right half by setting R = Mid - 1. If the target is GREATER, eliminate the left half by setting L = Mid + 1. Step 4: Repeat until found or until L exceeds R.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'Intuitive Analogy: Opening a 1,000-Page Dictionary',
        explanation_text:
          'If you want to look up the word "Pencil" in a 1,000-page dictionary, you never read page 1, then page 2, then page 3. You split the heavy book right down the middle to page 500. If the words on page 500 start with "M", you know "P" must be in the second half. You discard pages 1 through 500 instantly and open the middle of the remaining half. In just 10 quick splits, you pinpoint any single word out of thousands.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'formula',
        title: 'Time Complexity Formula: T(N) = O(log₂ N)',
        explanation_text:
          'Binary search operates in logarithmic time O(log₂ N). For an array of 1,000,000 items, a linear search could require checking all 1,000,000 positions in the worst case. Binary search guarantees finding the item or proving it absent in no more than 20 total comparisons, representing an astonishing 50,000-fold speed improvement.',
      },
    ];
  }

  if (q.includes('newton') || q.includes('force') || q.includes('physics') || q.includes('acceleration') || q.includes('gravity')) {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'formula',
        title: "Newton's Second Law of Motion: F = m • a",
        explanation_text:
          'Newton’s Second Law states that the net unbalanced force applied to an object is directly proportional to its mass and its resulting acceleration. The fundamental formula is F = m • a. Net force (F) is measured in Newtons (N), mass (m) is measured in kilograms (kg), and acceleration (a) is measured in meters per second squared (m/s²). If mass remains constant, doubling the force exactly doubles the acceleration.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'diagram',
        title: 'Free-Body Force & Acceleration Vector Diagram',
        explanation_text:
          'The visual diagram illustrates a block of mass (m) resting on a frictionless surface. A bold arrow pointing toward the right denotes the applied Force vector (F). Below the block, a matching vector arrow indicates the resulting Acceleration (a) pointing in the exact same direction. The normal force pointing upward balances the downward gravitational weight (W = mg), leaving only the net horizontal force to accelerate the object.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'flowchart',
        title: 'Force & Motion Decision Flowchart',
        explanation_text:
          'Step-by-step physical analysis: Step 1: Identify all acting forces and compute the net vector sum. Step 2: Decision Diamond - Is Net Force greater than zero? If NO, the object remains in equilibrium (at rest or moving with constant velocity, satisfying Newton’s First Law). If YES, the object is accelerating; proceed to Step 3 and calculate acceleration a = F / m. Step 4: Integrate acceleration over time to determine velocity and trajectory.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'text',
        title: 'Everyday Life Analogy: Pushing a Shopping Cart',
        explanation_text:
          'Pushing an empty shopping cart is effortless: because its mass is small, a gentle push creates rapid acceleration. But fill the cart to the brim with 40 kilograms of groceries, and that same gentle push barely budges it. To achieve the same brisk acceleration with a heavy cart, your muscles must exert much greater force. That intuitive experience is F = m • a.',
      },
    ];
  }

  if (q.includes('photosynthesis') || q.includes('biology') || q.includes('plant') || q.includes('chlorophyll')) {
    return [
      {
        id: 1,
        order_index: 1,
        block_type: 'diagram',
        title: 'Photosynthesis: Biological Energy Transformation',
        explanation_text:
          'Photosynthesis is the foundational biological process by which green plants convert light energy into chemical fuel. Inside plant leaf cells, specialized organelles called chloroplasts contain chlorophyll pigments that absorb blue and red wavelengths of sunlight. Water (H₂O) absorbed by roots from soil and carbon dioxide (CO₂) absorbed from ambient air through microscopic leaf pores (stomata) react to synthesize glucose sugars and release oxygen gas.',
      },
      {
        id: 2,
        order_index: 2,
        block_type: 'flowchart',
        title: 'Two-Stage Reaction Flowchart: Light vs Dark Reactions',
        explanation_text:
          'Step-by-step chemical pathway: Step 1 (Light-Dependent Reactions in Thylakoids): Solar photons strike chlorophyll, splitting water molecules (photolysis) to release oxygen gas and generate energetic ATP and NADPH molecules. Step 2 (Calvin Cycle / Dark Reactions in Stroma): The energy stored in ATP and NADPH is utilized to fix carbon dioxide molecules into high-energy six-carbon glucose sugar (C₆H₁₂O₆). Step 3: Plant distributes glucose to grow stems, leaves, and fruits.',
      },
      {
        id: 3,
        order_index: 3,
        block_type: 'text',
        title: 'Intuitive Analogy: A Solar-Powered Bakery',
        explanation_text:
          'Imagine a bakery with solar panels on the roof. The solar panels gather sunlight (chlorophyll trapping photons), water comes from the sink tap (roots), and air provides carbon flour (CO₂). The oven runs on clean solar energy to bake fresh loaves of bread (glucose food). As a pleasant bonus, the bakery exhausts clean, refreshing oxygen into the neighborhood for everyone to breathe.',
      },
      {
        id: 4,
        order_index: 4,
        block_type: 'formula',
        title: 'Chemical Equation: 6CO₂ + 6H₂O + Light ➔ C₆H₁₂O₆ + 6O₂',
        explanation_text:
          'The balanced chemical equation demonstrates atomic conservation: six molecules of carbon dioxide combined with six molecules of water in the presence of solar photon energy produce one molecule of glucose sugar and six molecules of oxygen gas as a byproduct.',
      },
    ];
  }

  // Default Universal Comprehensive Explainer
  return [
    {
      id: 1,
      order_index: 1,
      block_type: 'diagram',
      title: `System Architecture & Overview: ${query}`,
      explanation_text:
        `This structural diagram outlines the core components of ${query}. The architecture is organized into three primary layers: an Intake / Input Layer that receives initial parameters, a Processing & Business Logic Layer that evaluates rules and performs computations, and an Output / Storage Layer that securely persists results and provides feedback. Clear directional connectors illustrate how information circulates seamlessly.`,
    },
    {
      id: 2,
      order_index: 2,
      block_type: 'flowchart',
      title: `Step-by-Step Flowchart & Execution Path: ${query}`,
      explanation_text:
        `Detailed execution sequence: Step 1: Initial state intake and data validation. Step 2: Decision Diamond - Evaluate primary criteria. If the condition evaluates to TRUE, proceed down the primary execution corridor; if FALSE, redirect to the contingency fallback path. Step 3: Transformation and execution of the workload. Step 4: Final verification, state commit, and delivery of the confirmed outcome.`,
    },
    {
      id: 3,
      order_index: 3,
      block_type: 'text',
      title: 'Intuitive Mental Model & Real-World Analogy',
      explanation_text:
        `To understand ${query} intuitively, consider a well-run automated kitchen. Raw ingredients represent the incoming inputs, the verified recipe steps represent the flowchart logic, and the finished dish represents the final output. As long as each step is carried out in sequence without skipping verification, the final result is always consistent, reliable, and high quality.`,
    },
    {
      id: 4,
      order_index: 4,
      block_type: 'table',
      title: 'Key Examination Takeaways & Evaluation Matrix',
      explanation_text:
        `Essential concepts for mastery: First, modularity allows each subcomponent to be maintained and scaled independently. Second, clear input-output contracts prevent unexpected errors. Third, following a validated step-by-step decision path ensures deterministic and reproducible results every single time.`,
    },
  ];
}

// Translations for standard seeded reader documents
const BLOCK_TRANSLATIONS: Record<string, Record<string, { title: string; text: string }>> = {
  'b-101-1-1': {
    'hi-IN': {
      title: 'ओएसआई संदर्भ मॉडल वास्तुकला',
      text: 'यह आरेख कंप्यूटर नेटवर्किंग की सात परतों को दर्शाने वाले सात रंगीन आयताकार बक्सों का एक लंबवत ढेर दिखाता है। सबसे ऊपर परत 7, एप्लिकेशन परत है, जहाँ वेब ब्राउज़र और ईमेल ऐप चलते हैं। इसके नीचे परत 6, प्रेजेंटेशन परत है, जो डेटा प्रारूप और एन्क्रिप्शन संभालती है। इसके बाद परत 5, सेशन परत है, जो सक्रिय कनेक्शन प्रबंधित करती है। बीच में परत 4, ट्रांसपोर्ट परत है, जो टीसीपी या यूडीपी का उपयोग करके विश्वसनीय डिलीवरी सुनिश्चित करती है। इसके नीचे परत 3, नेटवर्क परत है, जो आईपी पते का उपयोग करके पैकेट रूट करती है। फिर परत 2, डेटा लिंक परत, जो भौतिक तारों पर मैक पते का उपयोग करती है। सबसे नीचे परत 1, भौतिक परत है, जो विद्युत केबल, रेडियो सिग्नल और ऑप्टिकल फाइबर का प्रतिनिधित्व करती है।',
    },
    'ta-IN': {
      title: 'ஓ.எஸ்.ஐ குறிப்பு மாதிரி கட்டமைப்பு',
      text: 'இந்த வரைபடம் கணினி நெட்வொர்க்கிங்கின் ஏழு அடுக்குகளைக் குறிக்கும் ஏழு செவ்வக பெட்டிகளைக் காட்டுகிறது. மிக மேலே அடுக்கு 7 பயன்பாட்டு அடுக்கு ஆகும், அங்கு இணைய உலாவிகள் செயல்படுகின்றன. கீழே அடுக்கு 6 விளக்க அடுக்கு, தரவு வடிவமைப்பு மற்றும் குறியாக்கத்தைக் கையாள்கிறது. நடுவில் அடுக்கு 4 போக்குவரத்து அடுக்கு, டிசிபி மூலம் நம்பகமான விநியோகத்தை உறுதி செய்கிறது. கீழே அடுக்கு 3 நெட்வொர்க் அடுக்கு, ஐபி முகவரிகளைப் பயன்படுத்தி பாக்கெட்டுகளை வழிநடத்துகிறது. மிக கீழே அடுக்கு 1 இயற்பியல் அடுக்கு கேபிள்கள் மற்றும் சிக்னல்களைக் குறிக்கிறது.',
    },
    'ml-IN': {
      title: 'ഒ.എസ്.ഐ റഫറൻസ് മോഡൽ ഘടന',
      text: 'കമ്പ്യൂട്ടർ നെറ്റ്‌വർക്കിംഗിലെ ഏഴ് ലെയറുകളെ പ്രതിനിധീകരിക്കുന്ന ലംബമായ ഏഴ് ബോക്സുകളാണ് ഈ ഡയഗ്രം കാണിക്കുന്നത്. ഏറ്റവും മുകളിൽ ലെയർ 7 ആപ്ലിക്കേഷൻ ലെയറാണ്, ഇവിടെ ബ്രൗസറുകളും ആപ്പുകളും പ്രവർത്തിക്കുന്നു. താഴെ ലെയർ 6 പ്രസന്റേഷൻ ലെയർ ഡാറ്റാ ഫോർമാറ്റിംഗും എൻക്രിപ്ഷനും കൈകാര്യം ചെയ്യുന്നു. നടുവിൽ ലെയർ 4 ട്രാൻസ്പോർട്ട് ലെയർ ടിസിപി വഴി കൃത്യമായ വിതരണം ഉറപ്പാക്കുന്നു. താഴെ ലെയർ 3 നെറ്റ്‌വർക്ക് ലെയർ ഐപി വിലാസങ്ങൾ ഉപയോഗിച്ച് പാക്കറ്റുകൾ റൂട്ട് ചെയ്യുന്നു. ഏറ്റവും താഴെ ലെയർ 1 ഫിസിക്കൽ ലെയർ കേബിളുകളെയും സിഗ്നലുകളെയും പ്രതിനിധീകരിക്കുന്നു.',
    },
    'te-IN': {
      title: 'ఓ.ఎస్.ఐ రిఫరెన్స్ మోడల్ ఆర్కిటెక్చర్',
      text: 'ఈ రేఖాచిత్రం కంప్యూటర్ నెట్‌వర్కింగ్ యొక్క ఏడు పొరలను సూచించే ఏడు రంగుల పెట్టెల నిలువు సమూహాన్ని చూపిస్తుంది. పైభాగంలో లేయర్ 7 అప్లికేషన్ లేయర్ ఉంది, ఇక్కడ బ్రౌజర్లు పనిచేస్తాయి. క్రింద లేయర్ 6 ప్రెజెంటేషన్ లేయర్ డేటా ఫార్మాటింగ్‌ను నిర్వహిస్తుంది. మధ్యలో లేయర్ 4 ట్రాన్స్‌పోర్ట్ లేయర్ టీసీపీ ద్వారా సురక్షితమైన డెలివరీని అందిస్తుంది. దిగువన లేయర్ 3 నెట్‌వర్క్ లేయర్ ఐపీ చిరునామాలను ఉపయోగిస్తుంది. చివరిగా లేయర్ 1 ఫిజికల్ లేయర్ కేబుల్స్ మరియు సిగ్నల్స్‌ను సూచిస్తుంది.',
    },
    'bn-IN': {
      title: 'ওএসআই রেফারেন্স মডেল আর্কিটেকচার',
      text: 'এই চিত্রটি কম্পিউটার নেটওয়ার্কিংয়ের সাতটি স্তরকে নির্দেশ করে সাতটি রঙিন আয়তাকার বাক্সের একটি উল্লম্ব স্তূপ দেখায়। সবার উপরে স্তর ৭ অ্যাপ্লিকেশন স্তর রয়েছে, যেখানে ওয়েব ব্রাউজার চলে। নিচে স্তর ৬ প্রেজেন্টেশন স্তর ডেটা ফরম্যাটিং পরিচালনা করে। মাঝে স্তর ৪ ট্রান্সপোর্ট স্তর টিসিপির মাধ্যমে নির্ভরযোগ্য ডেটা স্থানান্তর নিশ্চিত করে। নিচে স্তর ৩ নেটওয়ার্ক স্তর আইপি অ্যাড্রেস দিয়ে প্যাকেট রুট করে। সবার নিচে স্তর ১ ফিজিক্যাল স্তর বৈদ্যুতিক তার এবং অপটিক্যাল ফাইবারকে নির্দেশ করে।',
    },
    'mr-IN': {
      title: 'ओएसआय संदर्भ मॉडेल संरचना',
      text: 'हा आकृतीसंग्रह संगणक नेटवर्किंगच्या सात स्तरांचे प्रतिनिधित्व करणार्‍या सात रंगीत आयताकृती पेट्यांचा एक उभा संच दाखवतो. सर्वात वर लेयर ७ ॲप्लिकेशन लेयर आहे, जिथे वेब ब्राउझर चालतात. खाली लेयर ६ प्रेझेंटेशन लेयर डेटा फॉरमॅटिंग आणि एन्क्रिप्शन हाताळते. मध्यभागी लेयर ४ ट्रान्सपोर्ट लेयर टीसीपीद्वारे विश्वासार्ह वितरण सुनिश्चित करते. खाली लेयर ३ नेटवर्क लेयर आयपी पत्ते वापरून पॅकेट्स रूट करते. सर्वात खाली लेयर १ फिजिकल लेयर केबल्स आणि सिग्नल्सचे प्रतिनिधित्व करते.',
    },
    'es-ES': {
      title: 'Arquitectura del Modelo de Referencia OSI',
      text: 'Este diagrama muestra una pila vertical de siete cajas rectangulares de colores que representan las siete capas de redes de computadoras. En la parte superior está la Capa 7, la Capa de Aplicación, donde se ejecutan los navegadores web. Abajo está la Capa 6, Presentación, que maneja el formato de datos y cifrado. En el centro está la Capa 4, Transporte, que garantiza la entrega confiable mediante TCP. Abajo está la Capa 3, Red, que enruta paquetes mediante direcciones IP. En la base está la Capa 1, la Capa Física.',
    },
  },
  'b-101-1-2': {
    'hi-IN': {
      title: 'डेटा एनकैप्सुलेशन की अवधारणा',
      text: 'जब आप इंटरनेट पर कोई संदेश भेजते हैं, तो प्रत्येक परत आपके डेटा को हेडर नामक अतिरिक्त निर्देशों के साथ लपेटती है। इसे एक पत्र को लिफाफे में डालने, फिर कूरियर बैग में और अंत में डाक ट्रक में रखने जैसा समझें। जब तक यह तार तक पहुँचता है, मूल डेटा में सुरक्षित पहुँचने के लिए सभी टैग लग चुके होते हैं।',
    },
    'ta-IN': {
      title: 'தரவு உறைபொதியாக்கம் கருத்து',
      text: 'இணையத்தில் தகவலை அனுப்பும்போது, ஒவ்வொரு அடுக்கும் கூடுதல் வழிமுறைகளைச் சேர்க்கிறது. ஒரு கடிதத்தை உறையில் வைத்து அஞ்சல் வாகனத்தில் அனுப்புவது போன்றது இது. சேருமிடத்தை அடையும் வரை தேவையான அனைத்து முகவரி குறிப்புகளும் இதில் சேர்க்கப்படும்.',
    },
    'ml-IN': {
      title: 'ഡാറ്റ എൻക്യാപ്സുലേഷൻ ആശയം',
      text: 'നിങ്ങൾ ഇന്റർനെറ്റിലൂടെ ഒരു സന്ദേശം അയക്കുമ്പോൾ, ഓരോ ലെയറും ഹെഡർ എന്ന അധിക നിർദ്ദേശങ്ങൾ ഇതിൽ ചേർക്കുന്നു. ഒരു കത്ത് കവറിലിട്ട് പോസ്റ്റൽ വണ്ടിയിൽ അയക്കുന്നത് പോലെയാണിത്. ലക്ഷ്യസ്ഥാനത്ത് സുരക്ഷിതമായി എത്താൻ ആവശ്യമായ എല്ലാ റൂട്ടിംഗ് ടാഗുകളും ഇതിൽ ചേർക്കുന്നു.',
    },
    'te-IN': {
      title: 'డేటా ఎన్‌క్యాప్సులేషన్ భావన',
      text: 'మీరు ఇంటర్నెట్ ద్వారా సందేశాన్ని పంపినప్పుడు, ప్రతి పొర మీ డేటాకు హెడర్ అనే అదనపు సూచనలను జోడిస్తుంది. ఇది ఒక లేఖను కవరులో ఉంచి రవాణా సంచిలో పెట్టడం వంటిది. గమ్యస్థానాన్ని చేరుకోవడానికి అవసరమైన అన్ని చిరునామా ట్యాగ్‌లు సురక్షితంగా జతచేయబడతాయి.',
    },
    'bn-IN': {
      title: 'ডেটা এনক্যাপসুলেশন ধারণা',
      text: 'আপনি যখন ইন্টারনেটে কোনো বার্তা পাঠান, তখন প্রতিটি স্তর আপনার ডেটার সাথে হেডার নামে অতিরিক্ত নির্দেশিকা যুক্ত করে। এটি একটি চিঠিকে খামে ভরে ডাক ট্রাকে পাঠানোর মতো। গন্তব্যে পৌঁছানোর জন্য প্রয়োজনীয় সমস্ত ট্যাগ যুক্ত হয়ে এটি নিরাপদে স্থানান্তরিত হয়।',
    },
    'mr-IN': {
      title: 'डेटा एनकॅप्सुलेशन संकल्पना',
      text: 'जेव्हा तुम्ही इंटरनेटवर संदेश पाठवता, तेव्हा प्रत्येक स्तर तुमच्या डेटाभोवती हेडर नावाच्या अतिरिक्त सूचना गुंडाळतो. हे एका पत्राला लिफाफ्यात ठेवून पोस्टाच्या गाडीत पाठवण्यासारखे आहे. संदेश सुरक्षितपणे पोहोचण्यासाठी आवश्यक ते सर्व मार्गदर्शक टॅग्ज यामध्ये जोडले जातात.',
    },
    'es-ES': {
      title: 'Concepto de Encapsulación de Datos',
      text: 'Cuando envías un mensaje por internet, cada capa envuelve tus datos con instrucciones adicionales llamadas encabezados. Es como colocar una carta dentro de un sobre y luego dentro de un paquete postal.',
    },
  },
  'b-101-1-3': {
    'hi-IN': {
      title: 'तुलना: लेयर 2 डेटा लिंक बनाम लेयर 4 ट्रांसपोर्ट',
      text: 'यह तालिका तीन पंक्तियों में डेटा लिंक परत और ट्रांसपोर्ट परत की तुलना करती है। पंक्ति एक: पता लगाना। डेटा लिंक भौतिक मैक पते का उपयोग करता है, जबकि ट्रांसपोर्ट विशिष्ट प्रोग्रामों के लिए पोर्ट नंबर का उपयोग करता है। पंक्ति दो: डिलीवरी का दायरा। डेटा लिंक सीधे जुड़े दो उपकरणों के बीच डेटा ले जाता है, जबकि ट्रांसपोर्ट अंतिम रिसीवर तक एंड-टू-एंड डिलीवरी करता है।',
    },
    'ta-IN': {
      title: 'ஒப்பீடு: அடுக்கு 2 டேட்டா லிங்க் vs அடுக்கு 4 போக்குவரத்து',
      text: 'இந்த அட்டவணை டேட்டா லிங்க் மற்றும் போக்குவரத்து அடுக்குகளை ஒப்பிடுகிறது. டேட்டா லிங்க் மேக் முகவரிகளைப் பயன்படுத்துகிறது, போக்குவரத்து அடுக்கு போர்ட் எண்களைப் பயன்படுத்துகிறது. டேட்டா லிங்க் அருகிலுள்ள சாதனங்களுக்கு இடையே இயங்குகிறது, போக்குவரத்து அடுக்கு முழுமையான இறுதி விநியோகத்தை உறுதி செய்கிறது.',
    },
    'ml-IN': {
      title: 'താരതമ്യം: ലെയർ 2 ഡാറ്റാ ലിങ്ക് vs ലെയർ 4 ട്രാൻസ്പോർട്ട്',
      text: 'ഈ പട്ടിക ഡാറ്റാ ലിങ്ക്, ട്രാൻസ്പോർട്ട് ലെയറുകളെ താരതമ്യം ചെയ്യുന്നു. ഡാറ്റാ ലിങ്ക് മാക് വിലാസങ്ങളും, ട്രാൻസ്പോർട്ട് പോർട്ട് നമ്പറുകളും ഉപയോഗിക്കുന്നു. ഡാറ്റാ ലിങ്ക് തൊട്ടടുത്ത ഉപകരണങ്ങൾക്കിടയിലും, ട്രാൻസ്പോർട്ട് എൻഡ്-ടു-എൻഡ് സുരക്ഷിതമായ കൈമാറ്റവും ഉറപ്പാക്കുന്നു.',
    },
    'te-IN': {
      title: 'పోలిక: లేయర్ 2 డేటా లింక్ వర్సెస్ లేయర్ 4 ట్రాన్స్‌పోర్ట్',
      text: 'ఈ పట్టిక డేటా లింక్ మరియు ట్రాన్స్‌పోర్ట్ లేయర్‌లను పోలుస్తుంది. డేటా లింక్ మ్యాక్ అడ్రస్‌లను ఉపయోగిస్తుంది, ట్రాన్స్‌పోర్ట్ పోర్ట్ నంబర్‌లను ఉపయోగిస్తుంది. డేటా లింక్ సమీప పరికరాల మధ్య పనిచేస్తుంది, ట్రాన్స్‌పోర్ట్ ఎండ్-టు-ఎండ్ డెలివరీని నిర్ధారిస్తుంది.',
    },
    'bn-IN': {
      title: 'তুলনা: লেয়ার ২ ডেটা লিঙ্ক বনাম লেয়ার ৪ ট্রান্সপোর্ট',
      text: 'এই টেবিলটি ডেটা লিঙ্ক এবং ট্রান্সপোর্ট স্তরের তুলনা করে। ডেটা লিঙ্ক ম্যাক অ্যাড্রেস ব্যবহার করে, আর ট্রান্সপোর্ট পোর্ট নম্বর ব্যবহার করে। ডেটা লিঙ্ক স্থানীয় ডিভাইসের মধ্যে ডেটা সরায়, আর ট্রান্সপোর্ট এন্ড-টু-এন্ড স্থানান্তর নিশ্চিত করে।',
    },
    'mr-IN': {
      title: 'तुलना: लेयर २ डेटा लिंक विरुद्ध लेयर ४ ट्रान्सपोर्ट',
      text: 'हा तक्ता डेटा लिंक आणि ट्रान्सपोर्ट लेयरची तुलना करतो. डेटा लिंक मॅक पत्ते वापरते, तर ट्रान्सपोर्ट पोर्ट क्रमांक वापरते. डेटा लिंक थेट जोडलेल्या उपकरणांमध्ये कार्य करते, तर ट्रान्सपोर्ट शेवटपर्यंत सुरक्षित वितरण करते.',
    },
    'es-ES': {
      title: 'Comparación: Capa 2 Enlace de Datos vs Capa 4 Transporte',
      text: 'Esta tabla compara la capa de Enlace de Datos y la de Transporte. Enlace de Datos utiliza direcciones físicas MAC en la red local, mientras que Transporte utiliza números de puerto para comunicarse con programas específicos.',
    },
  },
};

export function getLocalizedBlock(block: ExplanationBlock, langCode: string): { title: string; text: string } {
  const blockId = String(block.id || '');
  if (BLOCK_TRANSLATIONS[blockId] && BLOCK_TRANSLATIONS[blockId][langCode]) {
    return BLOCK_TRANSLATIONS[blockId][langCode];
  }
  return {
    title: block.title || '',
    text: block.explanation_text || '',
  };
}
