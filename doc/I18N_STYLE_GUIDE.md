# XunNi Project - i18n Translation Style Guide
> **Source of Truth**: Derived from `tools/gas/translation_tool.gs` (v5.1).

## 1. Core Terminology (Strict Adherence)

The world concept is based on **"Blessing Fortune Telling"**.
**Global Change**: "Message Bottle" (漂流瓶) is now conceptually **"Blessing Bottle" (祝福漂流瓶)**.

### 1.1 Bottle Types (Noun)

| Language | Generic / Blessing Bottle <br> (漂流瓶 / 祝福漂流瓶) | Fortune Bottle <br> (算命瓶) |
| :--- | :--- | :--- |
| **zh-TW** | **祝福漂流瓶** | 算命瓶 |
| **zh-CN** | **祝福漂流瓶** | 算命瓶 |
| **en** | **Blessing Bottle** | Fortune Bottle |
| **ja** | **祈りのボトル** | 占いボトル |
| **ko** | **축복의 병** | 운세 병 |
| **th** | **ขวดอวยพร** | ขวดทำนาย |
| **vi** | **Chai Cầu Nguyện** | chai bói toán |
| **id** | **Botol Berkah** | botol ramalan |
| **ms** | **Botol Restu** | botol nasib |
| **tl** | **Bote ng Pagpapala** | botelyang panghuhula |
| **es** | **Botella de Bendición** | botella de la fortuna |
| **pt** | **Garrafa de Bênção** | garrafa da sorte |
| **fr** | **Bouteille de Vœux** | bouteille de bonne aventure |
| **de** | **Segensflasche** | Glücksflasche |
| **it** | **Bottiglia dei Desideri** | bottiglia della fortuna |
| **ru** | **Бутылка Желаний** | бутылка с предсказанием |
| **ar** | **زجاجة البركة** | زجاجة الحظ |
| **tr** | **Dilek Şişesi** | fal şişesi |

> **Critical Rule**: Do NOT confuse the two. "Fortune Bottle" deals with destiny/tarot. "Blessing Bottle" deals with wishes/connections.

### 1.2 Bottle Actions (Verb + Noun)

| Language | Throw Blessing Bottle <br> (丟/扔 瓶子) | Catch/Pick Blessing Bottle <br> (撿/撈 瓶子) |
| :--- | :--- | :--- |
| **en** | Throw Blessing Bottle | Catch Blessing Bottle |
| **ja** | 祈りのボトルを流す | 祈りのボトルを拾う |
| **ko** | 축복의 병 던지기 | 축복의 병 줍기 |

### 1.3 Features

| Language | Psychic Fortune Telling <br> (靈能算命) |
| :--- | :--- |
| **zh-TW** | 靈能算命 |
| **en** | Psychic Reading |
| **ja** | 霊能占い |
| **ko** | 영능 점술 |
| **th** | ทำนายพลังจิต |
| **vi** | Bói tâm linh |

## 2. Fortune Telling & Tarot Rules (CRITICAL)

### 🇨🇳 Chinese (zh-CN)
- Convert Traditional to Simplified (e.g., 權杖 -> 权杖, 錢幣 -> 钱币).
- Keep consistent with Chinese Tarot standards.

### 🇺🇸 English (en)
- Use standard **Rider-Waite** names.
- **Suits**: Wands, Cups, Swords, Pentacles.
- **Court**: Page, Knight, Queen, King.
- **Format**: "Ace of Wands", "The Fool".

### 🇯🇵 Japanese (ja)
- **Suits (Katakana)**:
  - Cups -> **カップ** (NOT 聖杯)
  - Wands -> **ワンド** (NOT 杖/権杖)
  - Swords -> **ソード** (NOT 剣)
  - Pentacles -> **ペンタクル** (NOT 金貨/星)
- **Court Cards**:
  - Page -> **ペイジ**
  - Knight -> **ナイト**
  - Queen -> **クイーン**
  - King -> **キング**
- **Format**: `Suit` + の + `Rank` (e.g., ワンドのエース, カップの9).
- **Major Arcana**: Use standard Kanji names (愚者, 魔術師...).

### 🇰🇷 Korean (ko)
- **Suits**:
  - Cups -> **컵**
  - Wands -> **완드**
  - Swords -> **소드**
  - Pentacles -> **펜타클**
- **Court Cards**:
  - Page -> **페이지**
  - Knight -> **나이트**
  - Queen -> **퀸**
  - King -> **킹**
- **Format**: `Suit` + ` ` + `Rank` (e.g., 완드 에이스, 컵 9).

## 3. Contextual Rules (Ambiguity Handling)

1.  **Ambiguous "Bottle" (瓶子)**:
    - If verb is **Throw/Catch** -> Translate as **Blessing Bottle**.
    - If verb is **Ask/Divinate** -> Translate as **Fortune Bottle**.
    - If context is neutral ("My Bottle") -> Default to **Blessing Bottle** (as it's the inventory item).

2.  **Co-occurrence**:
    - If a sentence contains BOTH "算命" and "漂流瓶", preserve BOTH terms distinctively.
    - Example: "算命瓶與漂流瓶" -> "Fortune Bottle and Blessing Bottle".

3.  **Legacy Blacklist (Strictly Forbidden)**:
    - ❌ Message Bottle
    - ❌ Drifting Bottle
    - ❌ Drift Bottle
    - ❌ ボトルメール (JP)
    - ❌ 메시지 병 (KO)

## 4. Quality Checklist (AI)
1. **Terminology**: Did I use the exact term from the Bottle Map?
2. **Tarot**: Did I follow the suit/rank rules for JA/KO/EN?
3. **Safety**: Are all `{placeholders}` intact?
4. **Consistency**: Did I translate "XunNi" as "XunNi" (or keep it if it's the brand name)?
