//定数
const resultLabels = {
  win: "あなたの勝ち！",
  lose: "あなたの負け...",
  draw: "あいこ！",
};

const JANKEN_HANDS = {
  ROCK: { value: 0, label: "グー", icon: "✊" },
  SCISSORS: { value: 1, label: "チョキ", icon: "✌️" },
  PAPER: { value: 2, label: "パー", icon: "✋" },
};

const STORAGE_KEY_PLAYER_HANDS = "playerJankenHands";
const TARGET_PATH_HAND = 10;
const JANKEN_HAND_KINDS = 3;

// n回前の手の初期値
var beforeCount = 0;
//勝負回数の初期値
var playCount = 0;
//記憶じゃんけん利用フラグ
var isMemoryJanken = false;

//ジャンケン用の処理

//コンピュータの手変更メソッド
function getComputerHand() {
  var computerHand = Math.floor(Math.random() * JANKEN_HAND_KINDS);
  changeComputerDisplay(computerHand);
  return computerHand;
}

//勝敗判定メソッド
function judgeJanken(playerHand, computerHand) {
  //あいこの時
  if (playerHand === computerHand) {
    return "draw";
  }
  //グーの時
  if (playerHand === JANKEN_HANDS.ROCK.value) {
    return computerHand === JANKEN_HANDS.SCISSORS.value ? "win" : "lose";
  }
  //チョキの時
  if (playerHand === JANKEN_HANDS.SCISSORS.value) {
    return computerHand === JANKEN_HANDS.PAPER.value ? "win" : "lose";
  }
  //パーの時
  if (playerHand === JANKEN_HANDS.PAPER.value) {
    return computerHand === JANKEN_HANDS.ROCK.value ? "win" : "lose";
  }
}

//画面表示変更用

//コンピュータの表示変更メソッド
function changeComputerDisplay(computerHand) {
  if (computerHand === null) {
    $("#computerHand").html("-");
    return;
  }
  if (computerHand === JANKEN_HANDS.ROCK.value) {
    $("#computerHand").html(JANKEN_HANDS.ROCK.icon);
  } else if (computerHand === JANKEN_HANDS.SCISSORS.value) {
    $("#computerHand").html(JANKEN_HANDS.SCISSORS.icon);
  } else {
    $("#computerHand").html(JANKEN_HANDS.PAPER.icon);
  }
}

//結果表示変更メソッド
function changeDisplay(result) {
  $("#resultMessage").removeClass("result-win result-lose result-draw");
  if (result === "win") {
    $("#resultMessage").html(resultLabels.win).addClass("result-win");
  } else if (result === "draw") {
    $("#resultMessage").html(resultLabels.draw).addClass("result-draw");
  } else if (result === "lose") {
    $("#resultMessage").html(resultLabels.lose).addClass("result-lose");
  } else {
    $("#resultMessage").html("結果を判定できませんでした");
  }
}

//ボタン押下時の処理

//グーを押下したとき
$(".hand-rock").on("click", function () {
  $("#playerHand").html(JANKEN_HANDS.ROCK.icon);
  pushHandsButton(JANKEN_HANDS.ROCK.value);
});
//チョキを押下したとき
$(".hand-scissors").on("click", function () {
  $("#playerHand").html(JANKEN_HANDS.SCISSORS.icon);
  pushHandsButton(JANKEN_HANDS.SCISSORS.value);
});
//パーを押下したとき
$(".hand-paper").on("click", function () {
  $("#playerHand").html(JANKEN_HANDS.PAPER.icon);
  pushHandsButton(JANKEN_HANDS.PAPER.value);
});
//リセットボタンを押下した時
$(".reset-button").on("click", function () {
  $("#playerHand").html("-");
  $("#computerHand").html("-");
  $("#playCount").html("1回目");
  $("#ruleMessage").html("まずはコンピューターと勝負しよう");
  reset();
});

//じゃんけんボタン押下時共通処理
function pushHandsButton(jankenHandsValue) {
  var result = isMemoryJanken
    ? judgeJanken(jankenHandsValue, getPastPlayerHand(beforeCount))
    : judgeJanken(jankenHandsValue, getComputerHand());
  changeDisplay(result);
  savePlayerHand(jankenHandsValue);
  playCount++;
  $("#playCount").html(playCount + 1 + "回目");
  //記憶ジャンケンフラグ判定
  if (getPlayerHands().length >= TARGET_PATH_HAND) {
    isMemoryJanken = true;
    selectTargetPastHand();
  }
}

//記憶ジャンケンに必要な処理

//セッションストレージへの保存と記憶ジャンケン判定フラグ変更
function savePlayerHand(playerHand) {
  const savedHands = JSON.parse(
    sessionStorage.getItem(STORAGE_KEY_PLAYER_HANDS) || "[]",
  );
  savedHands.push(playerHand);
  sessionStorage.setItem(STORAGE_KEY_PLAYER_HANDS, JSON.stringify(savedHands));
}

//リセット処理
function reset() {
  beforeCount = 0;
  playCount = 0;
  isMemoryJanken = false;
  sessionStorage.removeItem(STORAGE_KEY_PLAYER_HANDS);
}

//過去のユーザーの手の取得
function getPlayerHands() {
  return JSON.parse(sessionStorage.getItem(STORAGE_KEY_PLAYER_HANDS) || "[]");
}

//勝負するn回前の手の選択
function selectTargetPastHand() {
  beforeCount = Math.floor(Math.random() * TARGET_PATH_HAND) + 1;
  $("#ruleMessage").html(beforeCount + "回前の自分の手とジャンケンしよう");
}

//n回前の手の取得
function getPastPlayerHand(countBefore) {
  var hands = getPlayerHands();
  var hand = hands[hands.length - countBefore] ?? null;
  changeComputerDisplay(hand);
  return hand;
}
