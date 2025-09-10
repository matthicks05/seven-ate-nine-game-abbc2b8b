// Common bad words list (basic implementation)
const BAD_WORDS = [
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 
  'piss', 'dick', 'cock', 'pussy', 'whore', 'slut', 'fag', 'nigger',
  'retard', 'gay', 'stupid', 'idiot', 'moron', 'dumb', 'kill', 'die'
];

export const containsProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => lowerText.includes(word));
};

export const blurProfanity = (text: string): string => {
  let blurredText = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const replacement = '*'.repeat(word.length);
    blurredText = blurredText.replace(regex, replacement);
  });
  return blurredText;
};

export const getTempBanDuration = (): Date => {
  // 5 minute temporary ban
  return new Date(Date.now() + 5 * 60 * 1000);
};