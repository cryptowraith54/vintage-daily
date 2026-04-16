import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const HISTORY_PATH = join(DATA_DIR, "history.json");

const CULTURE_THEMES = [
  "ブランド史",
  "人物・デザイナー",
  "映画・音楽・アニメとの関係",
  "時代背景・社会文化",
  "メーカー・製造業の歴史",
] as const;

const CLOTHING_THEMES = [
  "タグ識別",
  "縫製・ステッチ",
  "素材・生地",
  "年代判定",
  "パーツ・ディテール",
] as const;

export type CultureTheme = (typeof CULTURE_THEMES)[number];
export type ClothingTheme = (typeof CLOTHING_THEMES)[number];

interface HistoryEntry {
  date: string;
  cultureTitle: string;
  cultureTheme: CultureTheme;
  clothingTitle: string;
  clothingTheme: ClothingTheme;
}

interface HistoryData {
  entries: HistoryEntry[];
}

export function loadHistory(): HistoryData {
  return JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
}

export function getUsedTopics(): {
  cultureTitles: string[];
  clothingTitles: string[];
} {
  const data = loadHistory();
  return {
    cultureTitles: data.entries.map((e) => e.cultureTitle),
    clothingTitles: data.entries.map((e) => e.clothingTitle),
  };
}

export function getNextThemes(): {
  cultureTheme: CultureTheme;
  clothingTheme: ClothingTheme;
} {
  const data = loadHistory();
  const recent = data.entries.slice(-10);

  const cultureCounts = new Map<string, number>();
  const clothingCounts = new Map<string, number>();

  for (const theme of CULTURE_THEMES) cultureCounts.set(theme, 0);
  for (const theme of CLOTHING_THEMES) clothingCounts.set(theme, 0);

  for (const entry of recent) {
    cultureCounts.set(
      entry.cultureTheme,
      (cultureCounts.get(entry.cultureTheme) ?? 0) + 1
    );
    clothingCounts.set(
      entry.clothingTheme,
      (clothingCounts.get(entry.clothingTheme) ?? 0) + 1
    );
  }

  const cultureTheme = [...cultureCounts.entries()].sort(
    (a, b) => a[1] - b[1]
  )[0][0] as CultureTheme;

  const clothingTheme = [...clothingCounts.entries()].sort(
    (a, b) => a[1] - b[1]
  )[0][0] as ClothingTheme;

  return { cultureTheme, clothingTheme };
}

export function saveEntry(entry: HistoryEntry): void {
  const data = loadHistory();
  data.entries.push(entry);

  // Keep only last 60 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  data.entries = data.entries.filter((e) => new Date(e.date) >= cutoff);

  writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2));
}
