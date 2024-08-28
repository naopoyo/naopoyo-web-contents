import { FieldAction } from '@frontmatter/extensibility';

(async () => {
  const value = makeRandomEmoji();

  FieldAction.update(value);
})();

function isEmoji(value) {
  const emojiRegex =
    /\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u;
  return emojiRegex.test(value);
}

function getRandomRange() {
  const emojiRanges = [
    { start: 0x1f600, end: 0x1f64f },
    { start: 0x1f300, end: 0x1f5ff },
    { start: 0x1f680, end: 0x1f6ff },
  ];

  const randomIndex = Math.floor(Math.random() * emojiRanges.length);
  return emojiRanges[randomIndex];
}

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeRandomEmoji() {
  let emoji = '';

  do {
    const randomRange = getRandomRange();
    const randomCodePoint = getRandomValue(randomRange.start, randomRange.end);
    emoji = String.fromCodePoint(randomCodePoint);
  } while (!isEmoji(emoji));

  return emoji;
}
