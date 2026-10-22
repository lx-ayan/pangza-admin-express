"use strict";

const readline = require("readline");

function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(String(answer || "").trim()));
  });
}

/**
 * @param {string} message
 * @param {string} [fallback]
 */
async function askText(rl, message, fallback = "") {
  const hint = fallback ? ` (${fallback})` : "";
  const answer = await ask(rl, `${message}${hint}: `);
  return answer || fallback;
}

/**
 * @param {string} message
 * @param {{ value: string, label: string }[]} choices
 * @param {string} [fallback]
 */
async function askSelect(rl, message, choices, fallback) {
  console.log(`\n${message}`);
  choices.forEach((c, i) => {
    console.log(`  ${i + 1}) ${c.label}`);
  });
  const def =
    fallback != null
      ? choices.findIndex((c) => c.value === fallback) + 1
      : 1;
  const answer = await ask(rl, `选择 [1-${choices.length}] (默认 ${def}): `);
  const n = Number(answer || def);
  if (!Number.isInteger(n) || n < 1 || n > choices.length) {
    console.log(`无效选择，使用默认: ${choices[def - 1].label}`);
    return choices[def - 1].value;
  }
  return choices[n - 1].value;
}

/**
 * Multi-select by comma-separated numbers.
 * @param {string} message
 * @param {{ value: string, label: string, hint?: string }[]} choices
 * @param {string[]} [preselected]
 */
async function askMulti(rl, message, choices, preselected = []) {
  console.log(`\n${message}`);
  console.log("（输入序号，逗号分隔；直接回车=不选额外模块）");
  choices.forEach((c, i) => {
    const mark = preselected.includes(c.value) ? "*" : " ";
    const hint = c.hint ? ` — ${c.hint}` : "";
    console.log(`  ${i + 1}) [${mark}] ${c.label}${hint}`);
  });
  const answer = await ask(rl, "> ");
  if (!answer) return [...preselected];

  const picked = new Set(preselected);
  for (const part of answer.split(/[,，\s]+/)) {
    if (!part) continue;
    const n = Number(part);
    if (!Number.isInteger(n) || n < 1 || n > choices.length) {
      console.log(`忽略无效项: ${part}`);
      continue;
    }
    picked.add(choices[n - 1].value);
  }
  return [...picked];
}

async function askYesNo(rl, message, defaultYes = true) {
  const tip = defaultYes ? "Y/n" : "y/N";
  const answer = (await ask(rl, `${message} (${tip}): `)).toLowerCase();
  if (!answer) return defaultYes;
  return answer === "y" || answer === "yes";
}

module.exports = {
  createRl,
  askText,
  askSelect,
  askMulti,
  askYesNo,
};
