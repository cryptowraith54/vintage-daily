import { generateContent } from "./claude.js";
import { sendSlackMessage } from "./slack.js";
import {
  getUsedTopics,
  getNextThemes,
  saveEntry,
  type CultureTheme,
  type ClothingTheme,
} from "./history.js";

const now = new Date();
const dateJP = now.toLocaleDateString("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});
const dateISO = now.toISOString().split("T")[0];

async function main() {
  const used = getUsedTopics();
  const { cultureTheme, clothingTheme } = getNextThemes();

  const prompt = buildPrompt(used, cultureTheme, clothingTheme);
  const message = await generateContent(prompt);

  await sendSlackMessage(message);

  const { cultureTitle, clothingTitle } = extractTitles(message);
  saveEntry({
    date: dateISO,
    cultureTitle,
    cultureTheme,
    clothingTitle,
    clothingTheme,
  });

  console.log(`Sent vintage daily for ${dateISO}`);
  console.log(`  Culture: [${cultureTheme}] ${cultureTitle}`);
  console.log(`  Clothing: [${clothingTheme}] ${clothingTitle}`);
}

function buildPrompt(
  used: { cultureTitles: string[]; clothingTitles: string[] },
  cultureTheme: CultureTheme,
  clothingTheme: ClothingTheme
): string {
  return `あなたはヴィンテージファッションの専門家です。Koya（20代男性、vintage tee・デニム・シャツを販売）に向けて、毎朝のヴィンテージファッション知識配信を作成してください。

## 今日のテーマ指定
- カルチャー洞察のテーマカテゴリ：「${cultureTheme}」
- 服の知識のテーマカテゴリ：「${clothingTheme}」

## 品質基準
- 明らかな誤情報は出力しないこと。大筋で正しければ多少の細部の曖昧さはOK
- 以下のソース・知識ベースを参考にした内容を優先：
  【アメリカ系】Heddels、Vintage & Rags、superfuture
  【日本系】2nd、Lightning、Ollie、古着屋TAROブログ等
- 具体的な年代・背景・エピソードを含めること
- 読んでいて「へえ、知らなかった」と思える内容を意識

## 過去に使用済みのトピック（これらと同じ内容は避けること）
カルチャー洞察: ${used.cultureTitles.length > 0 ? used.cultureTitles.join("、") : "なし"}
服の知識: ${used.clothingTitles.length > 0 ? used.clothingTitles.join("、") : "なし"}

## 出力フォーマット（このまま出力すること。前後の余計な説明は不要）

🕗 Vintage Daily — ${dateJP}

━━━━━━━━━━━━━━━━━━
🎭 【カルチャー洞察】
*[タイトル]*

[本文 200〜300字程度]
具体的な年代・背景・人物・エピソードを含める。

📖 参考ベース：[Heddels / Lightning / 2nd 等から該当するもの]
━━━━━━━━━━━━━━━━━━
👕 【服の知識】
*[タイトル]*

[本文 200〜300字程度]
実際の見分け方・数値・具体的な特徴を含める。

📖 参考ベース：[Heddels / Lightning / 2nd 等から該当するもの]
━━━━━━━━━━━━━━━━━━

IMPORTANT: 上記フォーマットのメッセージのみを出力してください。前後に説明や補足は不要です。`;
}

function extractTitles(message: string): {
  cultureTitle: string;
  clothingTitle: string;
} {
  const cultureMatch = message.match(/【カルチャー洞察】\s*\n\*(.+?)\*/);
  const clothingMatch = message.match(/【服の知識】\s*\n\*(.+?)\*/);

  return {
    cultureTitle: cultureMatch?.[1]?.trim() ?? "unknown",
    clothingTitle: clothingMatch?.[1]?.trim() ?? "unknown",
  };
}

main().catch((err) => {
  console.error("Failed to generate vintage daily:", err);
  process.exit(1);
});
