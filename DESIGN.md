# 記憶力じゃんけんアプリ 方式設計書

## 1. 目的

本書は `SPEC.md` をもとに、記憶力じゃんけんアプリの実装方式を定義する。
HTML / CSS / JavaScript の役割、データ構造、処理フロー、関数分割、保存方式を明確にし、実装時の迷いを減らすことを目的とする。

## 2. アプリ方式

### 2.1 実行方式

- ブラウザ上で動作する静的Webアプリとする
- サーバーサイド処理は持たない
- 画面表示、勝敗判定、スコア管理、履歴管理はすべてJavaScriptで行う
- データ保存には `sessionStorage` を使用する

### 2.2 対象ファイル

```text
20260515_janken/
├── SPEC.md
├── DESIGN.md
├── index.html
├── css/
│   └── style.css
└── js/
    └── main.js
```

現時点で `janken.js` を使う場合は、`js/main.js` の代わりに `janken.js` を読み込んでもよい。
ただし、実装時はJSファイルを1つに統一する。

## 3. 基本ルール

### 3.1 手の定義

アプリで扱う手は以下の3種類とする。

| 内部値 | 表示名 | 絵文字 |
| --- | --- | --- |
| rock | グー | ✊ |
| scissors | チョキ | ✌️ |
| paper | パー | ✋ |

JavaScriptでは文字列の揺れを避けるため、判定処理には内部値を使う。
画面表示時だけ表示名と絵文字に変換する。

### 3.2 通常じゃんけん判定

初期フェーズでは、ユーザーの手とコンピューターのランダムな手で勝敗を判定する。

| ユーザー | コンピューター | 結果 |
| --- | --- | --- |
| rock | scissors | win |
| rock | paper | lose |
| scissors | paper | win |
| scissors | rock | lose |
| paper | rock | win |
| paper | scissors | lose |
| 同じ手 | 同じ手 | draw |

### 3.3 記憶力じゃんけん判定

仕様の「n回コンピュータと勝負をした後は、自分のx回前の手に勝ち続ける」を以下の方式で実装する。

- 最初の `memoryOffset` 回は通常じゃんけんを行う
- `memoryOffset + 1` 回目以降は、ユーザーの `memoryOffset` 回前の手を対象手とする
- 現在のユーザーの手が、対象手に勝つ手なら成功
- 成功したら記憶スコアを1増やす
- 失敗したら記憶スコアを0に戻す

初期値:

```js
const memoryOffset = 2;
```

例:

| ラウンド | ユーザーの手 | 2回前の手 | 成功条件 |
| --- | --- | --- | --- |
| 1 | グー | なし | 通常じゃんけん |
| 2 | チョキ | なし | 通常じゃんけん |
| 3 | パー | グー | パーなら成功 |
| 4 | グー | チョキ | グーなら成功 |
| 5 | チョキ | パー | チョキなら成功 |

## 4. 画面設計

### 4.1 画面レイアウト

画面は以下の領域に分ける。

```text
[ヘッダー]
[説明文 / 現在のルール]
[スコア表示]
[結果表示]
[手の選択ボタン]
[履歴]
[リセットボタン]
```

### 4.2 ヘッダー

表示内容:

- アプリ名: `じゃんけん記憶アプリ`
- サブコピー: `出した手を覚えて、数手前の自分に勝ち続けよう`

### 4.3 ルール表示

現在のフェーズに応じて表示を切り替える。

初期フェーズ:

```text
まずはコンピューターと勝負しよう
```

記憶フェーズ:

```text
2回前の自分の手に勝つ手を選ぼう
```

### 4.4 スコア表示

表示項目:

- 対戦数
- 勝ち数
- 負け数
- あいこ数
- 勝率
- 記憶成功数
- 記憶連続成功数

### 4.5 結果表示

表示項目:

- 自分の手
- コンピューターの手
- 通常じゃんけん結果
- 記憶判定結果
- 次に意識するラウンド情報

### 4.6 手の選択ボタン

3つのボタンを配置する。

```html
<button data-hand="rock">✊ グー</button>
<button data-hand="scissors">✌️ チョキ</button>
<button data-hand="paper">✋ パー</button>
```

### 4.7 履歴表示

履歴は新しい順に表示する。
最大表示件数は10件とする。

表示項目:

- ラウンド
- 自分の手
- コンピューターの手
- 通常結果
- 記憶対象の手
- 記憶結果

## 5. データ設計

### 5.1 定数

```js
const HANDS = {
  rock: {
    label: "グー",
    icon: "✊",
    beats: "scissors"
  },
  scissors: {
    label: "チョキ",
    icon: "✌️",
    beats: "paper"
  },
  paper: {
    label: "パー",
    icon: "✋",
    beats: "rock"
  }
};

const HAND_KEYS = ["rock", "scissors", "paper"];
const MEMORY_OFFSET = 2;
const MAX_HISTORY_COUNT = 10;
const STORAGE_KEY = "jankenMemoryAppState";
```

### 5.2 状態管理

アプリの状態は `state` オブジェクトに集約する。

```js
const state = {
  round: 0,
  score: {
    win: 0,
    lose: 0,
    draw: 0
  },
  memory: {
    totalSuccess: 0,
    streak: 0,
    maxStreak: 0
  },
  playerHands: [],
  history: []
};
```

### 5.3 履歴データ

```js
const historyItem = {
  round: 1,
  playerHand: "rock",
  computerHand: "scissors",
  jankenResult: "win",
  memoryTargetHand: null,
  memoryResult: null
};
```

`memoryTargetHand` は、記憶フェーズ前は `null` とする。
`memoryResult` は以下のいずれかとする。

- `success`
- `fail`
- `none`

## 6. 処理設計

### 6.1 初期表示処理

処理内容:

1. DOM要素を取得する
2. `sessionStorage` から保存済み状態を読み込む
3. 保存済み状態があれば `state` に反映する
4. 保存済み状態がなければ初期状態を使う
5. 画面を描画する
6. ボタンにイベントを登録する

### 6.2 勝負処理

ユーザーが手のボタンを押したときに実行する。

処理フロー:

```text
手のボタンをクリック
  ↓
ユーザーの手を取得
  ↓
コンピューターの手をランダム決定
  ↓
通常じゃんけんの勝敗判定
  ↓
記憶フェーズか判定
  ↓
記憶フェーズならx回前の手との判定
  ↓
stateを更新
  ↓
sessionStorageに保存
  ↓
画面を再描画
```

### 6.3 通常じゃんけん判定

```js
function judgeJanken(playerHand, computerHand) {
  if (playerHand === computerHand) {
    return "draw";
  }

  if (HANDS[playerHand].beats === computerHand) {
    return "win";
  }

  return "lose";
}
```

### 6.4 記憶判定

```js
function judgeMemory(playerHand, targetHand) {
  if (!targetHand) {
    return "none";
  }

  return HANDS[playerHand].beats === targetHand ? "success" : "fail";
}
```

### 6.5 コンピューターの手の決定

```js
function getRandomHand() {
  const index = Math.floor(Math.random() * HAND_KEYS.length);
  return HAND_KEYS[index];
}
```

### 6.6 状態更新

状態更新の順序:

1. `state.round` を1増やす
2. 通常じゃんけん結果に応じて `score` を更新する
3. 記憶判定結果に応じて `memory` を更新する
4. `playerHands` にユーザーの手を追加する
5. `history` に履歴を追加する
6. 履歴が最大件数を超えたら古いものを削除する

注意:

- 記憶判定に使う対象手は、現在の手を `playerHands` に追加する前に取得する
- 例えば `MEMORY_OFFSET = 2` の場合、対象手は `playerHands[playerHands.length - 2]`

## 7. 関数設計

### 7.1 初期化

| 関数名 | 役割 |
| --- | --- |
| init | 初期処理を実行する |
| bindEvents | イベントを登録する |
| createInitialState | 初期状態を返す |

### 7.2 ゲーム処理

| 関数名 | 役割 |
| --- | --- |
| playRound | 1回分の勝負を実行する |
| getRandomHand | コンピューターの手を決める |
| judgeJanken | 通常じゃんけんを判定する |
| getMemoryTargetHand | x回前の自分の手を取得する |
| judgeMemory | 記憶判定を行う |
| updateScore | 通常スコアを更新する |
| updateMemoryScore | 記憶スコアを更新する |
| addHistory | 履歴を追加する |
| resetGame | 状態を初期化する |

### 7.3 描画処理

| 関数名 | 役割 |
| --- | --- |
| render | 画面全体を再描画する |
| renderScore | スコアを表示する |
| renderResult | 直近結果を表示する |
| renderHistory | 履歴を表示する |
| renderRuleMessage | 現在のルールを表示する |

### 7.4 保存処理

| 関数名 | 役割 |
| --- | --- |
| saveState | `sessionStorage` に保存する |
| loadState | `sessionStorage` から読み込む |
| clearState | `sessionStorage` を削除する |

## 8. DOM設計

### 8.1 ID / class 方針

JavaScriptから取得する要素には `id` を使う。
CSS装飾用には `class` を使う。

### 8.2 DOM要素案

```html
<main class="app">
  <section class="rule">
    <p id="ruleMessage"></p>
  </section>

  <section class="score">
    <p>対戦数: <span id="roundCount">0</span></p>
    <p>勝ち: <span id="winCount">0</span></p>
    <p>負け: <span id="loseCount">0</span></p>
    <p>あいこ: <span id="drawCount">0</span></p>
    <p>記憶連続成功: <span id="memoryStreak">0</span></p>
  </section>

  <section class="result">
    <p id="resultMessage">手を選んでください</p>
    <p id="playerHand"></p>
    <p id="computerHand"></p>
    <p id="memoryMessage"></p>
  </section>

  <section class="hands">
    <button class="hand-button" data-hand="rock">✊ グー</button>
    <button class="hand-button" data-hand="scissors">✌️ チョキ</button>
    <button class="hand-button" data-hand="paper">✋ パー</button>
  </section>

  <section class="history">
    <ol id="historyList"></ol>
  </section>

  <button id="resetButton" type="button">リセット</button>
</main>
```

## 9. sessionStorage設計

### 9.1 保存キー

```js
const STORAGE_KEY = "jankenMemoryAppState";
```

### 9.2 保存形式

`state` をJSON文字列化して保存する。

```js
sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
```

### 9.3 読み込み形式

```js
const saved = sessionStorage.getItem(STORAGE_KEY);
const state = saved ? JSON.parse(saved) : createInitialState();
```

### 9.4 例外対応

- JSONの読み込みに失敗した場合は初期状態に戻す
- 不正なデータ形式の場合も初期状態に戻す

## 10. エラー・例外対応

### 10.1 想定するエラー

| エラー | 対応 |
| --- | --- |
| 不正な手の値が渡された | 処理を中断する |
| sessionStorageのJSONが壊れている | 初期状態で開始する |
| DOM要素が見つからない | コンソールにエラーを出し、処理を中断する |

### 10.2 入力制御

- ユーザー入力は3つのボタンに限定する
- `data-hand` が `rock/scissors/paper` 以外の場合は処理しない

## 11. 表示文言設計

### 11.1 通常じゃんけん結果

| 結果 | 表示文言 | class |
| --- | --- | --- |
| win | あなたの勝ち！ | result-win |
| lose | あなたの負け... | result-lose |
| draw | あいこ！ | result-draw |

### 11.2 記憶判定結果

| 結果 | 表示文言 | class |
| --- | --- | --- |
| success | 記憶成功！ | memory-success |
| fail | 記憶失敗。もう一度チャレンジ！ | memory-fail |
| none | まずは手を覚えよう | memory-none |

## 12. CSS方式

### 12.1 レイアウト

- `body` は中央寄せ
- `.app` は最大幅を設定する
- 手のボタンは横並び
- スマートフォン幅では縦並びまたは折り返しにする

### 12.2 状態別スタイル

- 勝ち: 明るい色
- 負け: 落ち着いた色
- あいこ: 中立色
- 記憶成功: 強調色
- 記憶失敗: 注意色

色だけでなく、文言でも結果が分かるようにする。

## 13. テスト設計

### 13.1 通常じゃんけん判定

| No | 入力 | 期待結果 |
| --- | --- | --- |
| 1 | グー vs チョキ | 勝ち |
| 2 | グー vs パー | 負け |
| 3 | グー vs グー | あいこ |
| 4 | チョキ vs パー | 勝ち |
| 5 | チョキ vs グー | 負け |
| 6 | パー vs グー | 勝ち |

### 13.2 記憶判定

`MEMORY_OFFSET = 2` の場合。

| No | 過去の手 | 現在の手 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 2回前がグー | パー | 成功 |
| 2 | 2回前がグー | チョキ | 失敗 |
| 3 | 2回前がチョキ | グー | 成功 |
| 4 | 2回前がパー | チョキ | 成功 |

### 13.3 画面操作

| No | 操作 | 期待結果 |
| --- | --- | --- |
| 1 | グーボタンをクリック | ラウンドが1増える |
| 2 | 3回以上クリック | 記憶判定が表示される |
| 3 | リセットをクリック | スコア、履歴、保存データが消える |
| 4 | ページを再読み込み | sessionStorageの状態が復元される |

## 14. 実装順序

1. `index.html` に画面要素を作る
2. `css/style.css` で基本レイアウトを整える
3. `js/main.js` で定数と初期状態を作る
4. 通常じゃんけん判定を実装する
5. ボタンクリックで1回勝負できるようにする
6. スコア表示を実装する
7. 履歴表示を実装する
8. 記憶判定を実装する
9. `sessionStorage` 保存・復元を実装する
10. リセット処理を実装する
11. Chromeで動作確認する

## 15. 未確定事項

以下は実装前に決めるとよい。

- 記憶対象を何回前にするか
  - 初期案: 2回前
- 記憶フェーズ前の通常じゃんけん結果をスコアに含めるか
  - 初期案: 含める
- 記憶失敗時にゲームオーバーにするか、連続成功数だけリセットするか
  - 初期案: 連続成功数だけリセットして継続
- 履歴の最大表示件数
  - 初期案: 10件

