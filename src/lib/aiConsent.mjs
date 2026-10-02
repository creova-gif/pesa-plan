export const AI_CONSENT_STORAGE_KEY = 'maokoto.aiConsent';

const COPY = {
  en: {
    title: 'Before cloud AI sees your finances',
    body: 'Cloud AI sends this chat plus your balances, loans, and net worth to Anthropic. A receipt photo is sent only if you scan one. The on-device coach answers without sending that data.',
    grant: 'Share with cloud AI',
    deny: 'Keep on-device coach',
    active: 'Cloud AI is on. Each question includes your balances, loans, and net worth.',
    stop: 'Stop sharing',
    denied: 'On-device coach is answering. Cloud AI is off.',
    review: 'Review cloud AI',
  },
  sw: {
    title: 'Kabla AI ya wingu kuona fedha zako',
    body: 'AI ya wingu hutuma mazungumzo haya pamoja na bakaa, mikopo, na thamani halisi kwenda Anthropic. Picha ya risiti hutumwa tu ukiiweka. Mshauri wa simu hujibu bila kutuma data hiyo.',
    grant: 'Tumia AI ya wingu',
    deny: 'Bakia na mshauri wa simu',
    active: 'AI ya wingu imewashwa. Kila swali lina bakaa, mikopo, na thamani halisi.',
    stop: 'Acha kushiriki',
    denied: 'Mshauri wa simu anajibu. AI ya wingu imezimwa.',
    review: 'Kagua AI ya wingu',
  },
  fr: {
    title: 'Avant que l’IA cloud voie vos finances',
    body: 'L’IA cloud envoie cette conversation ainsi que vos soldes, prêts et valeur nette à Anthropic. Une photo de reçu n’est envoyée que si vous la scannez. Le coach sur l’appareil répond sans envoyer ces données.',
    grant: 'Partager avec l’IA cloud',
    deny: 'Garder le coach local',
    active: 'L’IA cloud est activée. Chaque question inclut vos soldes, prêts et valeur nette.',
    stop: 'Arrêter le partage',
    denied: 'Le coach local répond. L’IA cloud est désactivée.',
    review: 'Revoir l’IA cloud',
  },
  ar: {
    title: 'قبل أن يرى الذكاء الاصطناعي السحابي أموالك',
    body: 'يرسل الذكاء الاصطناعي السحابي هذه المحادثة مع أرصدتك وقروضك وصافي ثروتك إلى Anthropic. تُرسل صورة الإيصال فقط إذا مسحتها. المدرب على الجهاز يجيب دون إرسال هذه البيانات.',
    grant: 'المشاركة مع الذكاء الاصطناعي السحابي',
    deny: 'الإبقاء على المدرب المحلي',
    active: 'الذكاء الاصطناعي السحابي يعمل. كل سؤال يتضمن أرصدتك وقروضك وصافي ثروتك.',
    stop: 'إيقاف المشاركة',
    denied: 'المدرب على الجهاز يجيب. الذكاء الاصطناعي السحابي متوقف.',
    review: 'مراجعة الذكاء الاصطناعي السحابي',
  },
  pt: {
    title: 'Antes de a IA na nuvem ver suas finanças',
    body: 'A IA na nuvem envia esta conversa junto com seus saldos, empréstimos e patrimônio líquido para a Anthropic. A foto do recibo só é enviada se você digitalizá-la. O coach no aparelho responde sem enviar esses dados.',
    grant: 'Compartilhar com a IA na nuvem',
    deny: 'Manter o coach no aparelho',
    active: 'A IA na nuvem está ativa. Cada pergunta inclui saldos, empréstimos e patrimônio líquido.',
    stop: 'Parar de compartilhar',
    denied: 'O coach no aparelho está respondendo. A IA na nuvem está desligada.',
    review: 'Rever a IA na nuvem',
  },
};

export function aiConsentCopy(lang) {
  return COPY[lang] || COPY.en;
}

export function browserStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readAiConsent(storage) {
  if (!storage) return 'unset';
  const value = storage.getItem(AI_CONSENT_STORAGE_KEY);
  if (value === 'granted' || value === 'denied') return value;
  return 'unset';
}

export function writeAiConsent(storage, value) {
  if (!storage) return;
  if (value !== 'granted' && value !== 'denied') return;
  storage.setItem(AI_CONSENT_STORAGE_KEY, value);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maokoto:ai-consent', { detail: value }));
  }
}
